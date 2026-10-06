"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ModuleInfo {
  title: string;
  description: string;
  topics: string[];
}

const suggestedPrompts = [
  "Explain a concept I'm finding difficult",
  "Give me a short quiz on what I'm learning",
  "Help me understand this with an example",
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const recentChats = await getDocs(query(
          collection(db, "users", user.uid, "chatHistory"),
          orderBy("updatedAt", "desc"),
          limit(20),
        ));
        const conversation = recentChats.docs.find(
          (item) => (item.data().moduleId ?? null) === (moduleId || null),
        );
        if (conversation) {
          setActiveChatId(conversation.id);
          const history = await getDocs(query(
            collection(db, "users", user.uid, "chatHistory", conversation.id, "messages"),
            orderBy("createdAt", "asc"),
            limit(100),
          ));
          setMessages(history.docs.map((item) => item.data() as Message));
        }
      } catch {
        setHistoryError("Chat history could not be loaded. You can still start a new conversation.");
      }

      if (moduleId) {
        try {
          const modSnap = await getDoc(doc(db, "modules", moduleId));
          if (modSnap.exists()) setModuleInfo(modSnap.data() as ModuleInfo);
        } catch {
          setHistoryError((current) => current || "Module details could not be loaded.");
        }
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router, moduleId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persistAssistantMessage = async (currentUserId: string, conversationId: string, message: Message) => {
    try {
      await addDoc(collection(db, "users", currentUserId, "chatHistory", conversationId, "messages"), {
        ...message,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", currentUserId, "chatHistory", conversationId), {
        updatedAt: serverTimestamp(),
      });
    } catch {
      setHistoryError("The AI response could not be saved to your chat history.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    let conversationId = activeChatId;
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        if (!conversationId) {
          const conversation = await addDoc(collection(db, "users", currentUser.uid, "chatHistory"), {
            title: userMessage.content.slice(0, 80),
            moduleId: moduleId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          conversationId = conversation.id;
          setActiveChatId(conversation.id);
        }
        await addDoc(collection(db, "users", currentUser.uid, "chatHistory", conversationId, "messages"), {
          ...userMessage,
          createdAt: serverTimestamp(),
        });
      } catch {
        setHistoryError("This conversation may not be saved. Check your Firestore security rules.");
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          moduleContext: moduleInfo
            ? {
                title: moduleInfo.title,
                description: moduleInfo.description,
                topics: moduleInfo.topics,
              }
            : null,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || "Sorry, something went wrong. Please try again.",
      };
      setMessages([...newMessages, assistantMessage]);
      if (currentUser && conversationId) {
        await persistAssistantMessage(currentUser.uid, conversationId, assistantMessage);
      }
    } catch {
      const assistantMessage: Message = { role: "assistant", content: "Error connecting to the AI. Please try again." };
      setMessages([...newMessages, assistantMessage]);
      if (currentUser && conversationId) {
        await persistAssistantMessage(currentUser.uid, conversationId, assistantMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setActiveChatId(null);
    setHistoryError("");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <main className="chat-workspace flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col overflow-hidden bg-[#f7f3ff] text-[#241b35]">
      {historyError && <p role="status" className="border-b border-violet-200 bg-violet-50 px-5 py-2 text-center text-xs text-violet-800">{historyError}</p>}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl justify-end pt-3">
          <button
            type="button"
            onClick={startNewChat}
            disabled={messages.length === 0 && !input}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-800 transition hover:border-violet-400 hover:bg-violet-50 disabled:cursor-default disabled:opacity-50"
            aria-label="Start a new chat"
            title="New chat"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            <span>New chat</span>
          </button>
        </div>
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-10 sm:py-14">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-300/60">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">What would you like to learn?</h2>
            <p className="mx-auto mt-3 max-w-lg text-center leading-7 text-slate-600">
              {moduleInfo
                ? `Ask anything about ${moduleInfo.title}. I can explain ideas, work through examples, and help you practice.`
                : "Ask a question, explore a tricky concept, or get help with your next learning goal."}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="min-h-24 rounded-xl border border-violet-200 bg-white p-4 text-left text-sm font-medium leading-6 text-violet-950 shadow-sm shadow-violet-100 transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:shadow-md"
                >
                  <span className="mb-2 block text-lg text-violet-600" aria-hidden="true">↗</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7 py-8 sm:py-10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm" aria-label="AI Tutor">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3v3m0 12v3M3 12h3m12 0h3" /><circle cx="12" cy="12" r="3" /></svg>
                  </span>
                )}
                <div className={`max-w-[88%] whitespace-pre-wrap text-[15px] leading-7 sm:max-w-[82%] ${msg.role === "user" ? "rounded-2xl rounded-br-md bg-violet-700 px-5 py-3 text-white shadow-md shadow-violet-200" : "pt-1 text-slate-800"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white" aria-hidden="true">✦</span>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-4 py-3 shadow-sm ring-1 ring-violet-100" role="status" aria-label="AI Tutor is thinking">
                  <span className="size-1.5 animate-pulse rounded-full bg-violet-500" />
                  <span className="size-1.5 animate-pulse rounded-full bg-violet-500 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-violet-500 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-violet-200/80 bg-white/90 px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-violet-300 bg-white p-2 shadow-lg shadow-violet-200/50 transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your AI tutor..."
              rows={1}
              className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-3 py-2.5 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Message your AI tutor"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-700 text-white shadow-md shadow-violet-300 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:shadow-none"
              aria-label="Send message"
              title="Send message"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">AI responses can be inaccurate. Check important information.</p>
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100dvh-4rem)] bg-violet-50" />}>
      <ChatContent />
    </Suspense>
  );
}