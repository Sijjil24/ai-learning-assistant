"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.uid);
      const quizSnap = await getDoc(doc(db, "quizzes", moduleId));
      if (quizSnap.exists()) {
        setQuestions(quizSnap.data().questions as Question[]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, moduleId]);

  const handleAnswer = (index: number) => {
    setSelected(index);
  };

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      await saveResults(newAnswers);
      setFinished(true);
    }
  };

  const saveResults = async (finalAnswers: number[]) => {
    if (!userId) return;
    const correctCount = finalAnswers.filter((ans, i) => ans === questions[i].correctIndex).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const weakTopics = questions.filter((q, i) => finalAnswers[i] !== q.correctIndex).map((q) => q.topic);
    await setDoc(doc(db, "users", userId, "progress", moduleId), {
      status: "completed",
      score,
      weakTopics,
      lastActive: serverTimestamp(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-[#201a2e] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-[#201a2e] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">No quiz found for this module yet.</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = answers.filter((ans, i) => ans === questions[i].correctIndex).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-950 text-[#201a2e] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm w-full bg-gray-900 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-4xl font-bold text-blue-400 my-4">{score}%</p>
            <p className="text-gray-400 mb-6">You got {correctCount} out of {questions.length} correct</p>
            <a href="/dashboard" className="inline-block px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Back to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-gray-950 text-[#201a2e] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-gray-900 rounded-xl p-8">
          <p className="text-sm text-gray-500 mb-2">Question {current + 1} of {questions.length}</p>
          <h2 className="text-lg font-semibold mb-6">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((option, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className={selected === i ? "w-full text-left px-4 py-3 rounded-lg border bg-blue-600 border-blue-500" : "w-full text-left px-4 py-3 rounded-lg border bg-gray-800 border-gray-700 hover:border-gray-500"}>
                {option}
              </button>
            ))}
          </div>
          <button onClick={handleNext} disabled={selected === null} className="w-full mt-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 font-medium">
            {current + 1 === questions.length ? "Finish Quiz" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}