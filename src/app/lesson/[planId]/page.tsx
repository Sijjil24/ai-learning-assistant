"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { arrayRemove, arrayUnion, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { topicProgressId, type LearningPlan, type LessonRating, type TopicProgress } from "@/lib/learning";

const ratingOptions: { value: LessonRating; label: string; detail: string }[] = [
  { value: "shaky", label: "Still shaky", detail: "Add to review" },
  { value: "getting-there", label: "Getting there", detail: "Keep practicing" },
  { value: "confident", label: "Got it", detail: "Mark as strong" },
];

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [rating, setRating] = useState<LessonRating | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      try {
        const planRef = doc(db, "users", currentUser.uid, "learningPlans", params.planId);
        const planSnap = await getDoc(planRef);
        if (!planSnap.exists()) {
          setError("This learning path could not be found.");
          return;
        }

        const planData = planSnap.data() as LearningPlan;
        setPlan(planData);
        const progressSnap = await getDoc(
          doc(db, "users", currentUser.uid, "learningProgress", topicProgressId(planData.topic)),
        );
        if (progressSnap.exists()) {
          const progressData = progressSnap.data() as TopicProgress;
          setProgress(progressData);
          setRating(progressData.lessonRatings?.[`${params.planId}:${planData.lessons[0]?.id}`] ?? null);
        }
      } catch {
        setError("Unable to load this lesson path. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    });
  }, [params.planId, router]);

  const lesson = plan?.lessons[lessonIndex];
  const ratings = progress?.lessonRatings ?? {};
  const completedCount = plan?.lessons.filter((item) => ratings[`${params.planId}:${item.id}`]).length ?? 0;
  const progressPercent = plan?.lessons.length
    ? Math.round((completedCount / plan.lessons.length) * 100)
    : 0;
  const areaLabel = useMemo(
    () => (plan && lesson ? `${plan.topic}: ${lesson.title}` : ""),
    [plan, lesson],
  );

  const saveUnderstanding = async () => {
    if (!user || !plan || !lesson || !rating) return;
    setSaving(true);
    setError("");

    try {
      const ratingKey = `${params.planId}:${lesson.id}`;
      const today = new Date().toISOString().slice(0, 10);
      const yesterdayDate = new Date();
      yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
      const yesterday = yesterdayDate.toISOString().slice(0, 10);
      const userRef = doc(db, "users", user.uid);
      const progressRef = doc(db, "users", user.uid, "learningProgress", topicProgressId(plan.topic));
      const activityRef = doc(db, "users", user.uid, "dailyActivity", today);

      const nextProgress = await runTransaction(db, async (transaction) => {
        const [userSnapshot, progressSnapshot, activitySnapshot] = await Promise.all([
          transaction.get(userRef),
          transaction.get(progressRef),
          transaction.get(activityRef),
        ]);
        const currentProgress = progressSnapshot.exists()
          ? progressSnapshot.data() as TopicProgress
          : progress ?? {
              topic: plan.topic,
              level: plan.level,
              progressPercent: 0,
              lessonRatings: {},
              completedLessons: [],
              strongAreas: [],
              weakAreas: [],
            };
        const previousRatings = currentProgress.lessonRatings ?? {};
        const nextRatings = { ...previousRatings, [ratingKey]: rating };
        const strongAreas = new Set(currentProgress.strongAreas ?? []);
        const weakAreas = new Set(currentProgress.weakAreas ?? []);
        strongAreas.delete(areaLabel);
        weakAreas.delete(areaLabel);
        if (rating === "confident") strongAreas.add(areaLabel);
        if (rating === "shaky") weakAreas.add(areaLabel);

        const nextTopicProgress: TopicProgress = {
          topic: plan.topic,
          level: plan.level,
          progressPercent: Math.round((plan.lessons.filter((item) => nextRatings[`${params.planId}:${item.id}`]).length / plan.lessons.length) * 100),
          lessonRatings: nextRatings,
          completedLessons: Object.keys(nextRatings),
          strongAreas: [...strongAreas],
          weakAreas: [...weakAreas],
        };
        const userData = userSnapshot.data();
        const lastStudyDate = userData?.lastStudyDate as string | undefined;
        const currentStreak = lastStudyDate === today
          ? (userData?.currentStreak as number | undefined) ?? 1
          : lastStudyDate === yesterday
            ? ((userData?.currentStreak as number | undefined) ?? 0) + 1
            : 1;
        const previousActivity = activitySnapshot.data();
        const completedLessons = (previousActivity?.completedLessons as number | undefined ?? 0)
          + (previousRatings[ratingKey] ? 0 : 1);

        transaction.set(progressRef, { ...nextTopicProgress, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(userRef, {
          strongAreas: rating === "confident" ? arrayUnion(areaLabel) : arrayRemove(areaLabel),
          weakAreas: rating === "shaky" ? arrayUnion(areaLabel) : arrayRemove(areaLabel),
          currentStreak,
          longestStreak: Math.max((userData?.longestStreak as number | undefined) ?? 0, currentStreak),
          lastStudyDate: today,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        transaction.set(activityRef, { date: today, completedLessons, updatedAt: serverTimestamp() }, { merge: true });
        return nextTopicProgress;
      });

      setProgress(nextProgress);
    } catch {
      setError("Your feedback could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="flex flex-1 items-center justify-center bg-violet-50 text-slate-600">Loading your lesson path...</main>;
  }

  if (error && !plan) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-violet-50 px-5 text-center">
        <p className="text-slate-700">{error}</p>
        <Link href="/dashboard" className="font-semibold text-violet-700 hover:text-violet-900">Back to dashboard</Link>
      </main>
    );
  }

  if (!plan || !lesson) return null;

  return (
    <main className="flex-1 bg-[#f8f5ff] px-4 py-8 text-slate-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-medium text-violet-700 hover:text-violet-900">← Dashboard</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{plan.level} path</p>
            <h1 className="mt-2 text-xl font-semibold">{plan.topic}</h1>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-600">Your progress</span>
              <span className="font-semibold text-violet-800">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <ol className="mt-5 grid gap-2">
              {plan.lessons.map((item, index) => {
                const done = Boolean(ratings[`${params.planId}:${item.id}`]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonIndex(index);
                        setRating(ratings[`${params.planId}:${item.id}`] ?? null);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${lessonIndex === index ? "bg-violet-100 text-violet-950" : "text-slate-600 hover:bg-violet-50"}`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? "bg-violet-700 text-white" : "bg-violet-100 text-violet-800"}`}>
                        {done ? "✓" : index + 1}
                      </span>
                      <span className="text-sm font-medium leading-5">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <article className="min-w-0 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-100 sm:p-8">
            <p className="text-sm font-medium text-violet-700">Lesson {lessonIndex + 1} of {plan.lessons.length}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">{lesson.summary}</p>
            <div className="prose-learning mt-7 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{lesson.content}</div>

            <section className="mt-7 rounded-xl border border-violet-200 bg-violet-50 p-5">
              <h3 className="font-semibold text-violet-950">Example</h3>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#211833] p-4 text-sm leading-6 text-violet-50"><code>{lesson.example}</code></pre>
            </section>

            <section className="mt-7 border-t border-violet-100 pt-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Try it yourself</p>
              <h3 className="mt-2 text-lg font-semibold">{lesson.practiceQuestion}</h3>
              <p className="mt-6 text-sm font-semibold text-slate-800">How well did you understand this lesson?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRating(option.value)}
                    aria-pressed={rating === option.value}
                    className={`rounded-xl border px-4 py-3 text-left transition ${rating === option.value ? "border-violet-600 bg-violet-100 ring-2 ring-violet-200" : "border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50"}`}
                  >
                    <span className="block text-sm font-semibold text-violet-950">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{option.detail}</span>
                  </button>
                ))}
              </div>
              {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p aria-live="polite" className="text-sm text-emerald-700">{ratings[`${params.planId}:${lesson.id}`] === rating ? "Your feedback is saved." : ""}</p>
                <button
                  type="button"
                  onClick={saveUnderstanding}
                  disabled={!rating || saving}
                  className="rounded-lg bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : ratings[`${params.planId}:${lesson.id}`] ? "Update understanding" : "Save and update progress"}
                </button>
              </div>
            </section>

            <div className="mt-7 flex justify-between border-t border-violet-100 pt-5">
              <button type="button" onClick={() => { setLessonIndex((index) => index - 1); setRating(ratings[`${params.planId}:${plan.lessons[lessonIndex - 1]?.id}`] ?? null); }} disabled={lessonIndex === 0} className="text-sm font-medium text-violet-700 hover:text-violet-900 disabled:invisible">Previous lesson</button>
              <button type="button" onClick={() => { setLessonIndex((index) => index + 1); setRating(ratings[`${params.planId}:${plan.lessons[lessonIndex + 1]?.id}`] ?? null); }} disabled={lessonIndex === plan.lessons.length - 1} className="text-sm font-medium text-violet-700 hover:text-violet-900 disabled:invisible">Next lesson →</button>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}