"use client";

import Link from "next/link";
import Image from "next/image";

export default function ProjectGuidelinesPage() {
  return (
    <main className="flex-1 bg-white text-slate-900 pb-20">
      {/* Hero Banner */}
      <section className="relative w-full py-24 flex items-center justify-center bg-violet-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2070&auto=format&fit=crop"
            alt="Code and technology"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-violet-900/80 to-transparent"></div>
        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-violet-200 backdrop-blur-md mb-6 border border-white/20">
            Official Guidelines
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            AI Personalized Learning Assistant
          </h1>
          <p className="mt-6 text-xl text-violet-200">
            Built for Internee.pk to guide interns through their learning modules with state-of-the-art GenAI integration.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-5 sm:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 border border-slate-100">
          
          <div className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-violet-700 mb-2">The Objective</h2>
            <p className="text-2xl font-semibold text-slate-800 leading-relaxed">
              Build a personalized tutor to guide interns through Internee.pk’s learning modules.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-700 mb-6">Core Features</h2>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="bg-violet-100 text-violet-700 p-2 rounded-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Dynamic Lesson Planning</h3>
                    <p className="text-slate-600 text-sm mt-1">Generates lessons adaptively based on the user's current knowledge.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="bg-fuchsia-100 text-fuchsia-700 p-2 rounded-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">AI-Powered Answers</h3>
                    <p className="text-slate-600 text-sm mt-1">Utilizes advanced LLMs to answer intern questions contextually.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Track Progress</h3>
                    <p className="text-slate-600 text-sm mt-1">Monitors strengths and identifies weak areas automatically.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-violet-700 mb-6">Tech Stack</h2>
              <ul className="space-y-4">
                <li className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-violet-300 hover:bg-violet-50 transition-colors">
                  <span className="font-bold text-slate-800">Next.js</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">Frontend & API</span>
                </li>
                <li className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-violet-300 hover:bg-violet-50 transition-colors">
                  <span className="font-bold text-slate-800">OpenAI API</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">GenAI Tutor</span>
                </li>
                <li className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-violet-300 hover:bg-violet-50 transition-colors">
                  <span className="font-bold text-slate-800">Firebase</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">Database & Auth</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <h3 className="font-bold text-slate-900 mb-2">The Deliverable</h3>
            <p className="text-slate-600">
              A GenAI tutor offering personalized guidance, beautifully wrapped in a modern, responsive web application.
            </p>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-violet-700 font-bold hover:text-violet-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
