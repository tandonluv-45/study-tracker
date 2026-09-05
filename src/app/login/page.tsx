"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 sm:p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Welcome to Tracker</h1>
        <p className="text-text-muted text-sm mb-8">
          Your personal study roadmap, task manager, expense tracker &amp; more.
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-text-muted">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required placeholder="you@example.com"
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required placeholder="••••••••"
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? "Signing in…" : "Sign in / Create account"}
          </button>
          <p className="text-[11px] text-text-dim text-center">
            New here? Signing in creates your account.
          </p>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] text-text-dim uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <a
          href="/api/auth/google?mode=login"
          className="inline-flex items-center gap-3 px-6 py-3 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-all text-sm font-medium text-text w-full justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </a>
        <p className="text-xs text-text-dim mt-6">
          Sign in to sync your data across devices
        </p>
      </div>
    </div>
  );
}
