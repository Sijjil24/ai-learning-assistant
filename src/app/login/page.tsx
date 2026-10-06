"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Mode = "login" | "signup" | "reset";

function friendlyError(caughtError: unknown): string {
  const code =
    typeof caughtError === "object" && caughtError !== null && "code" in caughtError
      ? String((caughtError as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password. Please try again.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your internet and try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Allow popups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a password. Log in with your email and password instead.";
    case "auth/unauthorized-domain":
      return "This website address is not allowed for Google sign-in yet. Add it in Firebase, under Authentication, Settings, Authorized domains.";
    default:
      return caughtError instanceof Error
        ? caughtError.message.replace(/^Firebase:\s*/, "")
        : "Something went wrong. Please try again.";
  }
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSignUp = mode === "signup";
  const isReset = mode === "reset";

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isReset) {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccess(
          "If an account exists for this email, a reset link is on its way. Check your inbox and your spam folder.",
        );
        return;
      }

      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await setDoc(doc(db, "users", credential.user.uid), {
          name: name.trim(),
          email: credential.user.email,
          role: "intern",
          currentModule: "",
          strongAreas: [],
          weakAreas: [],
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/dashboard");
    } catch (caughtError: unknown) {
      setError(friendlyError(caughtError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", result.user.uid);
      const existing = await getDoc(userRef);

      // Only create the profile the first time, so returning users keep their progress data
      if (!existing.exists()) {
        await setDoc(userRef, {
          name: result.user.displayName ?? "",
          email: result.user.email,
          role: "intern",
          currentModule: "",
          strongAreas: [],
          weakAreas: [],
          createdAt: serverTimestamp(),
        });
      }

      router.push("/dashboard");
    } catch (caughtError: unknown) {
      const code =
        typeof caughtError === "object" && caughtError !== null && "code" in caughtError
          ? String((caughtError as { code: unknown }).code)
          : "";

      // Closing the popup is not an error worth showing
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setError(friendlyError(caughtError));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-[#fbfaff] px-5 py-14 text-[#201a2e]">
      <section className="w-full max-w-md border border-[#e7e0f2] bg-white p-7 shadow-xl shadow-violet-200/40 sm:p-9">
        <p className="mb-3 text-sm font-semibold text-violet-700">
          INTERNEE.PK LEARNING ASSISTANT
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          {isReset
            ? "Reset your password"
            : isSignUp
              ? "Create your account"
              : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isReset
            ? "Enter the email you signed up with and we will send you a link to choose a new password."
            : isSignUp
              ? "Create an account to start learning with your personal AI tutor."
              : "Log in to continue your courses and pick up where you left off."}
        </p>

        {!isReset && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="mt-8 flex w-full items-center justify-center gap-3 border border-violet-200 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:border-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? "Opening Google..." : "Continue with Google"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e7e0f2]" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                or
              </span>
              <span className="h-px flex-1 bg-[#e7e0f2]" />
            </div>
          </>
        )}

        <form
          onSubmit={handleSubmit}
          className={isReset ? "mt-8 space-y-5" : "space-y-5"}
        >
          {isSignUp && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full border border-violet-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-violet-600"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-violet-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-violet-600"
              placeholder="you@example.com"
            />
          </div>

          {!isReset && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-sm font-medium text-violet-700 hover:text-violet-900"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full border border-violet-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-violet-600"
                placeholder="At least 6 characters"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-violet-700 px-4 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isReset
                ? "Send reset link"
                : isSignUp
                  ? "Create account"
                  : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isReset ? (
            <>
              Remembered it?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-violet-700 hover:text-violet-900"
              >
                Back to log in
              </button>
            </>
          ) : (
            <>
              {isSignUp ? "Already have an account?" : "New to InternLearn AI?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? "login" : "signup")}
                className="font-medium text-violet-700 hover:text-violet-900"
              >
                {isSignUp ? "Log in" : "Create an account"}
              </button>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex flex-1 items-center justify-center bg-[#fbfaff]" />}>
      <LoginForm />
    </Suspense>
  );
}