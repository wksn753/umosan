"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to sign in.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <section className="loginPanel">
        <div className="logoRow">
          <span><img src="/images/umosan-logo.png" alt="UMOSAN logo" /></span>
          <span><img src="/images/must-logo.png" alt="MUST logo" /></span>
        </div>

        <div className="eyebrow">ADMIN ACCESS</div>
        <h1>Attendance console</h1>
        <p>Sign in to view attendance records and export reports.</p>

        <form onSubmit={submit}>
          <label htmlFor="admin-password">Password</label>

          <div className="passwordControl">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
              style={{
                color: "#071821",
                WebkitTextFillColor: "#071821",
                backgroundColor: "#ffffff",
              }}
            />

            <button
              type="button"
              className="passwordToggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <small className="passwordHint">Enter the administrator password configured for this site.</small>

          {error && <div className="errorBox" role="alert">{error}</div>}

          <button className="submitBtn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Enter admin"}
          </button>
        </form>
      </section>

      <style jsx>{`
        :global(html), :global(body) { margin: 0; background: #031827; }
        :global(*) { box-sizing: border-box; }
        .adminLoginPage {
          min-height: 100dvh; display: grid; place-items: center; padding: 24px;
          font-family: Inter, Arial, sans-serif;
          background: radial-gradient(circle at 80% 10%, rgba(141,255,79,.13), transparent 22%), linear-gradient(145deg, #031827, #083a58);
        }
        .loginPanel { width: min(100%, 430px); background: #fff; border-top: 6px solid #8dff4f; padding: 34px; box-shadow: 0 28px 70px rgba(0,0,0,.3); }
        .logoRow { display: flex; gap: 10px; margin-bottom: 28px; }
        .logoRow span { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: #fff; border: 1px solid #d9e5ea; }
        .logoRow img { width: 100%; height: 100%; object-fit: contain; }
        .eyebrow { font-size: 10px; font-weight: 900; letter-spacing: .14em; color: #0d7aa7; }
        h1 { margin: 8px 0 10px; color: #031827; font-size: 34px; line-height: 1; text-transform: uppercase; }
        p { margin: 0 0 28px; color: #60747f; font-size: 14px; line-height: 1.6; }
        form { display: grid; gap: 12px; }
        label { font-size: 12px; font-weight: 800; color: #17384a; }
        .passwordControl { position: relative; }
        input {
          width: 100%; min-height: 52px; border: 1.5px solid #8aa8b6; border-radius: 0;
          padding: 0 82px 0 14px; outline: none; font: inherit; font-size: 16px;
          color: #071821 !important; background: #ffffff !important; caret-color: #071821;
          -webkit-text-fill-color: #071821 !important; opacity: 1 !important;
        }
        input::placeholder { color: #617681 !important; opacity: 1 !important; -webkit-text-fill-color: #617681 !important; }
        input:focus { border-color: #0d7aa7; box-shadow: 0 0 0 3px rgba(13,122,167,.12); }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #071821 !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          caret-color: #071821;
        }
        .passwordToggle {
          position: absolute; right: 0; top: 0; bottom: 0; width: 72px;
          border: 0; border-left: 1px solid #d7e4e9; background: #f3f8fa;
          color: #0b5c8e; cursor: pointer; font-size: 10px; font-weight: 900; letter-spacing: .05em;
        }
        .passwordToggle:hover { background: #eaf3f7; }
        .passwordHint { margin-top: -4px; color: #71848e; font-size: 10px; line-height: 1.4; }
        .submitBtn { margin-top: 5px; min-height: 50px; border: 0; border-radius: 0; background: #8dff4f; color: #062820; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; cursor: pointer; }
        .submitBtn:disabled { opacity: .6; cursor: not-allowed; }
        .errorBox { padding: 12px 14px; border: 1px solid #e49898; background: #fff1f1; color: #8a2020; font-size: 12px; font-weight: 700; }
      `}</style>
    </main>
  );
}
