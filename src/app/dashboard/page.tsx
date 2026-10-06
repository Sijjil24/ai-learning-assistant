"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { topicProgressId, type LearningLevel, type LearningPlan, type TopicProgress, type Understanding } from "@/lib/learning";

interface UserData {
  name: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  order: number;
  topics: string[];
}

interface Progress {
  status: string;
  score: number;
  weakTopics?: string[];
}

interface Profile {
  name?: string;
  strongAreas?: string[];
  weakAreas?: string[];
  dailyLessonGoal?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastStudyDate?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [learningProgress, setLearningProgress] = useState<TopicProgress[]>([]);
  const [learningPlans, setLearningPlans] = useState<{ id: string; plan: LearningPlan }[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<Profile>({});
  const [topic, setTopic] = useState("JavaScript");
  const [customTopic, setCustomTopic] = useState("");
  const [level, setLevel] = useState<LearningLevel>("Beginner");
  const [understanding, setUnderstanding] = useState<Understanding>("shaky");
  const [generating, setGenerating] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const [userDoc, modulesSnap, progressSnap, topicProgressSnap, plansSnap, activitySnap] = await Promise.all([
          getDoc(doc(db, "users", currentUser.uid)),
          getDocs(query(collection(db, "modules"), orderBy("order"))),
          getDocs(collection(db, "users", currentUser.uid, "progress")),
          getDocs(collection(db, "users", currentUser.uid, "learningProgress")),
          getDocs(collection(db, "users", currentUser.uid, "learningPlans")),
          getDocs(query(collection(db, "users", currentUser.uid, "dailyActivity"), orderBy("date", "desc"), limit(7))),
        ]);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data as UserData);
          setProfile(data as Profile);
        }
        setModules(modulesSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as Module[]);
        setProgressMap(Object.fromEntries(progressSnap.docs.map((item) => [item.id, item.data() as Progress])));
        setLearningProgress(topicProgressSnap.docs.map((item) => item.data() as TopicProgress));
        setLearningPlans(plansSnap.docs.map((item) => ({ id: item.id, plan: item.data() as LearningPlan })));
        setActivityCounts(Object.fromEntries(activitySnap.docs.map((item) => {
          const data = item.data();
          return [data.date as string, data.completedLessons as number];
        })));
     } catch (err: any) {
  console.error("DASHBOARD ERROR:", err.code, err.message);
  setError("Your dashboard data could not be loaded. Check your Firestore connection and security rules.");
} finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const generateLearningPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedTopic = (topic === "Other" ? customTopic : topic).trim();
    if (!user || !selectedTopic || generating) return;

    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic, level, understanding }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to generate a learning path.");

      const plan: LearningPlan = { topic: selectedTopic, level, understanding, lessons: result.lessons };
      const planRef = await addDoc(collection(db, "users", user.uid, "learningPlans"), {
        ...plan,
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, "users", user.uid, "learningProgress", topicProgressId(selectedTopic)),
        {
          topic: selectedTopic,
          level,
          progressPercent: 0,
          lessonRatings: {},
          completedLessons: [],
          strongAreas: [],
          weakAreas: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      router.push(`/lesson/${planRef.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to generate a learning path.");
    } finally {
      setGenerating(false);
    }
  };

  const updateDailyGoal = async (goal: number) => {
    if (!user || savingGoal) return;
    setSavingGoal(true);
    setError("");
    try {
      await setDoc(doc(db, "users", user.uid), { dailyLessonGoal: goal, updatedAt: serverTimestamp() }, { merge: true });
      setProfile((current) => ({ ...current, dailyLessonGoal: goal }));
    } catch {
      setError("Your daily learning goal could not be saved.");
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-violet-50">
        <p className="text-violet-800">Loading your learning space...</p>
      </div>
    );
  }

  const completedCount = Object.values(progressMap).filter((item) => item.status === "completed").length;
  const strongAreas = Array.from(new Set([
    ...(profile.strongAreas ?? []),
    ...learningProgress.flatMap((item) => item.strongAreas ?? []),
  ]));
  const weakAreas = Array.from(new Set([
    ...(profile.weakAreas ?? []),
    ...learningProgress.flatMap((item) => item.weakAreas ?? []),
    ...Object.values(progressMap).flatMap((item) => item.weakTopics ?? []),
  ]));
  const averageProgress = learningProgress.length
    ? Math.round(learningProgress.reduce((sum, item) => sum + (item.progressPercent ?? 0), 0) / learningProgress.length)
    : 0;
  const dateAtOffset = (daysAgo: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };
  const today = dateAtOffset(0);
  const yesterday = dateAtOffset(1);
  const dailyGoal = profile.dailyLessonGoal ?? 2;
  const todayCompleted = activityCounts[today] ?? 0;
  const currentStreak = profile.lastStudyDate === today || profile.lastStudyDate === yesterday
    ? profile.currentStreak ?? 0
    : 0;
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = dateAtOffset(6 - index);
    return {
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      count: activityCounts[date] ?? 0,
    };
  });
  const maxActivity = Math.max(dailyGoal, ...weekActivity.map((day) => day.count), 1);

  return (
    <main className="flex-1 bg-[#f8f5ff] px-4 py-8 text-slate-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-700">YOUR LEARNING SPACE</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome, {userData?.name || user?.email}</h1>
            <p className="mt-2 text-slate-600">Pick a skill to build your next guided learning path.</p>
          </div>
          <Link href="/chat" className="rounded-lg border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-50">Ask the AI tutor</Link>
        </div>

        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

        <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-800 via-violet-700 to-fuchsia-700 p-5 text-white shadow-xl shadow-violet-300/40 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-violet-100">PERSONALIZED AI LEARNING</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">What do you want to learn?</h2>
            <p className="mt-2 leading-6 text-violet-100">Choose a skill and your current comfort level. Your lessons will adapt to your starting point.</p>
          </div>
          <form onSubmit={generateLearningPlan} className="mt-6 grid gap-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
            <label className="grid gap-2 text-sm font-medium text-white">
              Topic
              <select value={topic} onChange={(event) => setTopic(event.target.value)} className="h-11 rounded-lg border border-violet-200 bg-white px-3 text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-violet-200">
                <option>JavaScript</option>
                <option>Python</option>
                <option>React</option>
                <option>Data Structures & Algorithms</option>
                <option>HTML & CSS</option>
                <option>Other</option>
              </select>
            </label>
            {topic === "Other" && (
              <label className="grid gap-2 text-sm font-medium text-white sm:col-span-2 lg:col-span-1">
                Your topic
                <input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} maxLength={80} required placeholder="e.g. SQL" className="h-11 min-w-0 rounded-lg border border-violet-200 bg-white px-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-violet-200" />
              </label>
            )}
            <label className="grid gap-2 text-sm font-medium text-white">
              Level
              <select value={level} onChange={(event) => setLevel(event.target.value as LearningLevel)} className="h-11 rounded-lg border border-violet-200 bg-white px-3 text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-violet-200">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-white">
              How confident do you feel?
              <select value={understanding} onChange={(event) => setUnderstanding(event.target.value as Understanding)} className="h-11 rounded-lg border border-violet-200 bg-white px-3 text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-violet-200">
                <option value="shaky">Still shaky</option>
                <option value="getting-there">Getting there</option>
                <option value="confident">Confident</option>
              </select>
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button type="submit" disabled={generating || (topic === "Other" && !customTopic.trim())} className="h-11 w-full rounded-lg bg-white px-4 text-sm font-semibold text-violet-800 shadow-md transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-70">
                {generating ? "Building your path..." : "Generate lessons"}
              </button>
            </div>
          </form>
        </section>

        <section aria-label="Learning overview" className="mt-7 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100">
            <p className="text-sm font-medium text-slate-600">AI learning paths</p>
            <p className="mt-2 text-3xl font-semibold text-violet-800">{learningProgress.length}</p>
            <p className="mt-1 text-sm text-slate-500">{averageProgress}% average progress</p>
          </article>
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100">
            <p className="text-sm font-medium text-slate-600">Modules completed</p>
            <p className="mt-2 text-3xl font-semibold text-violet-800">{completedCount}<span className="text-lg font-medium text-slate-400"> / {modules.length}</span></p>
            <p className="mt-1 text-sm text-slate-500">From your course quizzes</p>
          </article>
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100">
            <p className="text-sm font-medium text-slate-600">Areas to revisit</p>
            <p className="mt-2 text-3xl font-semibold text-violet-800">{weakAreas.length}</p>
            <p className="mt-1 text-sm text-slate-500">Based on your lesson feedback</p>
          </article>
        </section>

        <section aria-label="Learning routine" className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-700">DAILY PRACTICE</p>
                <h2 className="mt-1 text-lg font-semibold">Your learning goal</h2>
                <p className="mt-1 text-sm text-slate-600">A small, steady session adds up.</p>
              </div>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Lessons per day
                <select value={dailyGoal} disabled={savingGoal} onChange={(event) => updateDailyGoal(Number(event.target.value))} className="h-10 rounded-lg border border-violet-200 bg-white px-3 text-sm text-violet-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                  <option value={1}>1 lesson</option>
                  <option value={2}>2 lessons</option>
                  <option value={3}>3 lessons</option>
                  <option value={5}>5 lessons</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-600">Today</span>
              <span className="font-semibold text-violet-800">{todayCompleted} / {dailyGoal} lessons</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-100" role="progressbar" aria-valuenow={Math.min(todayCompleted, dailyGoal)} aria-valuemin={0} aria-valuemax={dailyGoal} aria-label="Daily lesson goal">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all" style={{ width: `${Math.min(100, (todayCompleted / dailyGoal) * 100)}%` }} />
            </div>
          </article>

          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold text-violet-700">YOUR CONSISTENCY</p><h2 className="mt-1 text-lg font-semibold">Weekly activity</h2></div>
              <p className="text-right"><span className="text-2xl font-semibold text-violet-800">{currentStreak}</span><span className="ml-1 text-sm text-slate-500">day streak</span></p>
            </div>
            <div className="mt-4 flex h-20 items-end justify-between gap-2" role="list" aria-label="Lessons completed each day this week">
              {weekActivity.map((day) => (
                <div key={day.date} role="listitem" title={`${day.label}: ${day.count} lessons`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-500">{day.count || ""}</span>
                  <div className={`w-full max-w-7 rounded-t-md ${day.count ? "bg-gradient-to-t from-violet-700 to-fuchsia-500" : "bg-violet-100"}`} style={{ height: `${Math.max(5, (day.count / maxActivity) * 42)}px` }} />
                  <span className="text-[10px] text-slate-500">{day.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 sm:p-6">
            <h2 className="text-lg font-semibold">Strong areas</h2>
            <p className="mt-1 text-sm text-slate-500">Lessons you marked as understood</p>
            {strongAreas.length ? <div className="mt-4 flex flex-wrap gap-2">{strongAreas.map((area) => <span key={area} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{area}</span>)}</div> : <p className="mt-4 rounded-lg bg-violet-50 px-4 py-3 text-sm text-slate-600">Complete a lesson and mark “Got it” to build your strengths.</p>}
          </article>
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 sm:p-6">
            <h2 className="text-lg font-semibold">Needs review</h2>
            <p className="mt-1 text-sm text-slate-500">We’ll use these to guide your next practice</p>
            {weakAreas.length ? <div className="mt-4 flex flex-wrap gap-2">{weakAreas.map((area) => <span key={area} className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-sm font-medium text-fuchsia-800">{area}</span>)}</div> : <p className="mt-4 rounded-lg bg-violet-50 px-4 py-3 text-sm text-slate-600">Mark a lesson “Still shaky” and it will appear here.</p>}
          </article>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h2 className="text-xl font-semibold">Your AI learning paths</h2><p className="mt-1 text-sm text-slate-600">Continue where you left off.</p></div>
          </div>
          {learningPlans.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...learningPlans].reverse().map(({ id, plan }) => {
                const progress = learningProgress.find((item) => topicProgressId(item.topic) === topicProgressId(plan.topic));
                return <article key={id} className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-violet-700">{plan.level}</p><h3 className="mt-1 text-lg font-semibold">{plan.topic}</h3></div><span className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">{progress?.progressPercent ?? 0}%</span></div>
                  <p className="mt-2 text-sm text-slate-600">{plan.lessons.length} guided lessons</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${progress?.progressPercent ?? 0}%` }} /></div>
                  <Link href={`/lesson/${id}`} className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900">{progress?.progressPercent ? "Continue learning" : "Start learning"} →</Link>
                </article>;
              })}
            </div>
          ) : <p className="rounded-xl border border-dashed border-violet-300 bg-white px-5 py-6 text-sm text-slate-600">Your generated learning paths will appear here.</p>}
        </section>

        <section className="mt-10 pb-8">
          <h2 className="text-xl font-semibold">Course modules</h2>
          <p className="mt-1 text-sm text-slate-600">Your existing Internee.pk modules and quizzes.</p>
          {modules.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{modules.map((module) => {
            const progress = progressMap[module.id];
            return <article key={module.id} className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{module.title}</h3><span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800">{module.difficulty}</span></div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
              {progress && <p className="mt-3 text-sm font-medium text-violet-800">Completed · Quiz score {progress.score}%</p>}
              <div className="mt-4 flex gap-4"><Link href={`/chat?module=${module.id}`} className="text-sm font-medium text-violet-700 hover:text-violet-900">Ask tutor</Link><Link href={`/quiz/${module.id}`} className="text-sm font-medium text-violet-700 hover:text-violet-900">{progress ? "Retake quiz" : "Take quiz"}</Link></div>
            </article>;
          })}</div> : <p className="mt-4 rounded-xl border border-dashed border-violet-300 bg-white px-5 py-6 text-sm text-slate-600">No course modules are available yet. You can still create a personalized AI learning path above.</p>}
        </section>
      </div>
    </main>
  );
}