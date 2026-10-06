"use client";

import Link from "next/link";
import Image from "next/image";

const heroHighlights = [
  {
    title: "Dynamic Lesson Planning",
    desc: "Lessons built around your level and confidence.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "AI-Powered Answers",
    desc: "Ask anything and get clear, step-by-step explanations.",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    title: "Track Progress",
    desc: "See your strong areas and what needs another review.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function HomePage() {
  return (
    <main className="flex-1 overflow-hidden bg-[#fbfaff] text-[#201a2e]">
      {/* HERO SECTION WITH FULL BACKGROUND */}
      <section className="relative w-full min-h-[calc(100vh-64px)] flex items-center justify-center group overflow-hidden bg-[#0c0914]">
        {/* New Blur/Scale Transition on the Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2070&auto=format&fit=crop"
            alt="AI Digital Concept"
            fill
            priority
            className="object-cover transition-all duration-[1.5s] ease-out blur-[6px] scale-110 group-hover:blur-0 group-hover:scale-100 opacity-70 group-hover:opacity-60"
          />
          {/* Dynamic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151121] via-black/50 to-transparent transition-all duration-[1.5s] ease-out group-hover:via-violet-950/40" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-20 text-center flex flex-col items-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl hero-copy-enter drop-shadow-lg">
            GenAI learning,
            <span className="mt-4 block text-3xl font-bold text-violet-200 sm:text-4xl lg:text-5xl">
              built for Internee.pk interns.
            </span>
          </h1>

          <p
            className="mt-6 max-w-2xl text-lg leading-8 text-violet-100/90 sm:text-xl hero-copy-enter drop-shadow-md"
            style={{ animationDelay: "100ms" }}
          >
            InternLearn AI is your personal tutor for Internee.pk’s learning modules. Pick a
            skill, tell it your level, and it plans your lessons, answers your questions, and
            keeps track of what you have mastered and what needs more practice.
          </p>

          <div
            className="mt-10 flex flex-col sm:flex-row gap-4 hero-copy-enter"
            style={{ animationDelay: "200ms" }}
          >
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 font-semibold text-white shadow-[0_0_40px_-10px_rgba(109,72,181,0.6)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(192,132,252,0.7)]"
            >
              Start learning
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-violet-300/30 bg-white/10 backdrop-blur-md px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-violet-300/50 hover:scale-105"
            >
              Log in
            </Link>
          </div>

          {/* Highlights that fill the space */}
          <div
            className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3 hero-copy-enter"
            style={{ animationDelay: "300ms" }}
          >
            {heroHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-violet-300/20 bg-white/10 p-5 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/30 text-white">
                  <svg
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-violet-100/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW CARDS SECTION (Based on Guidelines) */}
      <section id="features" className="relative z-20 mx-auto max-w-7xl px-5 py-24 sm:px-8 bg-[#fbfaff]">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700 mb-3">Project Capabilities</p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            A Personalized GenAI Tutor
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Delivering adaptive learning experiences powered by modern web technologies.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="group rounded-3xl bg-white p-8 shadow-md shadow-violet-900/5 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-violet-200 border border-violet-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="mb-6 inline-flex rounded-2xl bg-violet-100 p-5 text-violet-700 shadow-inner group-hover:rotate-12 transition-all duration-300">
              <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-violet-700 transition-colors">Dynamic Lesson Planning</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Curriculums that adapt in real-time. The system evaluates your progress to tailor the next set of modules specifically for your needs.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="group rounded-3xl bg-white p-8 shadow-md shadow-violet-900/5 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-fuchsia-200 border border-violet-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-50 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="mb-6 inline-flex rounded-2xl bg-fuchsia-100 p-5 text-fuchsia-700 shadow-inner group-hover:rotate-12 transition-all duration-300">
              <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-fuchsia-700 transition-colors">AI-Powered Answers</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Powered by the OpenAI API, get instant, accurate, and context-aware explanations for any concept you are finding difficult.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-3xl bg-white p-8 shadow-md shadow-violet-900/5 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-indigo-200 border border-violet-100 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-150"></div>
            <div className="mb-6 inline-flex rounded-2xl bg-indigo-100 p-5 text-indigo-700 shadow-inner group-hover:rotate-12 transition-all duration-300">
              <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-700 transition-colors">Track Progress & Weak Areas</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Securely backed by Firebase, monitor your growth over time and let the system identify which topics require another review.
            </p>
          </div>
        </div>
      </section>

      {/* ADDITIONAL SECONDARY SECTION WITH NEW IMAGE AND TRANSITION */}
      <section className="theme-soft-band border-y border-violet-200 bg-[#eee5ff] py-24 overflow-hidden group/section">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              {/* Glassmorphism decorative element */}
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-2xl rounded-[3rem] group-hover/section:opacity-40 transition-opacity duration-1000"></div>
              
              <div className="relative aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-[600px] overflow-hidden rounded-[2.5rem] bg-violet-900 shadow-2xl group">
                 <Image
                   src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                   alt="Tech Workspace"
                   fill
                   className="object-cover transition-all duration-[2s] ease-in-out scale-100 filter sepia-[0.3] brightness-75 group-hover:scale-110 group-hover:sepia-0 group-hover:brightness-100"
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/80 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-1000"></div>
                 <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-8 group-hover:translate-y-0 backdrop-blur-sm">
                    <div>
                       <h3 className="text-3xl font-bold mb-4 drop-shadow-lg">Experience the future of learning</h3>
                       <Link
                        href="/login?mode=signup"
                        className="inline-block rounded-full bg-white px-8 py-4 font-bold text-violet-900 transition-transform hover:scale-105 shadow-xl"
                      >
                        Join Now
                      </Link>
                    </div>
                 </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block rounded-full bg-white border border-violet-200 px-4 py-1.5 text-sm font-bold tracking-wide text-violet-700 uppercase mb-4 shadow-sm">
                Internee.pk Guidelines
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                Master concepts with <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">expert tools</span>.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Our architecture combines the speed of Next.js, the intelligence of OpenAI, and the reliability of Firebase to deliver an unparalleled GenAI tutor.
              </p>
              
              <ul className="mt-10 space-y-8">
                {[
                  { 
                    title: 'Next.js Frontend', 
                    desc: 'Lightning fast, server-side rendered pages that provide a seamless user experience without interruptions.',
                    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                  },
                  { 
                    title: 'OpenAI API Integration', 
                    desc: 'Interact with a state-of-the-art language model designed to tutor, explain, and test your knowledge.',
                    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
                  },
                  { 
                    title: 'Firebase Backend', 
                    desc: 'Real-time database and secure authentication ensuring your progress is always saved and synchronized.',
                    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'
                  }
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-5 text-slate-700 group cursor-default">
                    <div className="flex mt-1 size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md shadow-violet-100 text-violet-600 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-violet-200">
                      <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xl group-hover:text-violet-700 transition-colors">{feature.title}</h4>
                      <p className="mt-2 text-slate-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-24 text-center sm:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-700 mb-4">Your next lesson starts here</p>
          <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">Ready to meet your AI Tutor?</h2>
        </div>
        <Link href="/login?mode=signup" className="shrink-0 rounded-full bg-violet-700 px-10 py-5 text-lg font-bold text-white transition-all duration-300 hover:bg-violet-800 hover:scale-105 hover:-translate-y-1 shadow-xl shadow-violet-900/20">
          Start your journey today
        </Link>
      </section>
    </main>
  );
}