"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AttendanceRow = {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  eventName: string;
  rating: string;
  suggestion: string;
  recordDate: string;
  memberSince: string;
};

type AttendanceResponse = {
  success: boolean;
  data?: AttendanceRow[];
  error?: string | null;
};

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function csvCell(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAttendance(selectedDate = date) {
    if (!selectedDate || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/attendance?date=${encodeURIComponent(selectedDate)}`,
        { cache: "no-store" },
      );

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result = (await response.json().catch(() => null)) as AttendanceResponse | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to load attendance.");
      }

      setRows(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.info("[UMOSAN ADMIN] attendance dashboard v2 loaded");
    void fetchAttendance(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadCSV() {
    if (!rows.length) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Event",
      "Rating",
      "Suggestion",
      "Attendance Time",
      "Member Since",
      "Attendance ID",
      "Member ID",
    ];

    const data = rows.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.eventName,
      row.rating,
      row.suggestion,
      formatDateTime(row.recordDate),
      formatDate(row.memberSince),
      row.id,
      row.memberId,
    ]);

    const csv = [
      headers.map(csvCell).join(","),
      ...data.map((line) => line.map(csvCell).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `umosan-attendance-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="adminPage">
      <header className="topbar">
        <div className="brandBlock">
          <div className="logos">
            <span><img src="/images/umosan-logo.png" alt="UMOSAN logo" /></span>
            <span><img src="/images/must-logo.png" alt="MUST logo" /></span>
          </div>
          <div>
            <strong>UMOSAN — MUST</strong>
            <small>Attendance administration</small>
          </div>
        </div>
        <button className="logoutBtn" type="button" onClick={logout}>Sign out</button>
      </header>

      <section className="heroAdmin">
        <div>
          <span className="eyebrow">REPORTING</span>
          <h1>Attendance report</h1>
          <p>Review who attended on a selected date and export the report as CSV.</p>
        </div>
        <div className="metric">
          <span>Records</span>
          <strong>{loading ? "—" : rows.length}</strong>
        </div>
      </section>

      <section className="controls">
        <label>
          <span>Attendance date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="primaryBtn"
          onClick={() => fetchAttendance()}
          disabled={loading || !date}
        >
          {loading ? "Loading..." : "Fetch report"}
        </button>

        <button
          type="button"
          className="secondaryBtn"
          onClick={downloadCSV}
          disabled={!rows.length || loading}
        >
          Download CSV
        </button>
      </section>

      {error && <div className="errorBox" role="alert">{error}</div>}

      <section className="tableSection">
        <div className="tableHeading">
          <div>
            <span>Selected date</span>
            <strong>{date}</strong>
          </div>
          <small>{rows.length} {rows.length === 1 ? "record" : "records"}</small>
        </div>

        {loading ? (
          <div className="emptyState">Loading attendance…</div>
        ) : !rows.length ? (
          <div className="emptyState">No attendance records found for this date.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Event</th>
                  <th>Rating</th>
                  <th>Suggestion</th>
                  <th>Attendance time</th>
                  <th>Member since</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id || `${row.email}-${index}`}>
                    <td className="nameCell">{row.name || "—"}</td>
                    <td>{row.email ? <a href={`mailto:${row.email}`}>{row.email}</a> : "—"}</td>
                    <td>{row.phone ? <a href={`tel:${row.phone}`}>{row.phone}</a> : "—"}</td>
                    <td><span className="eventTag">{row.eventName || "—"}</span></td>
                    <td>{row.rating || "—"}</td>
                    <td className="suggestionCell">{row.suggestion || "—"}</td>
                    <td>{formatDateTime(row.recordDate)}</td>
                    <td>{formatDate(row.memberSince)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        <span>UMOSAN — MUST Chapter</span>
        <a href="https://www.baseight.com/" target="_blank" rel="noreferrer">
          Powered by Base Eight Limited ↗
        </a>
      </footer>

      <style jsx>{`
        :global(html), :global(body) { margin: 0; background: #eef4f6; }
        :global(*) { box-sizing: border-box; }
        :global(body) { font-family: Inter, Arial, sans-serif; color: #071821; }
        .adminPage { min-height: 100dvh; background: #eef4f6; }
        .topbar {
          min-height: 72px; padding: 0 clamp(18px,4vw,54px); display: flex;
          align-items: center; justify-content: space-between; background: #031827;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }
        .brandBlock { display: flex; align-items: center; gap: 16px; color: #fff; }
        .brandBlock > div:last-child { display: flex; flex-direction: column; gap: 3px; }
        .brandBlock strong { font-size: 13px; letter-spacing: .03em; }
        .brandBlock small { color: #8faab7; font-size: 10px; }
        .logos { display: flex; gap: 7px; }
        .logos span { width: 38px; height: 38px; border-radius: 50%; background: #fff; overflow: hidden; display: grid; place-items: center; }
        .logos img { width: 100%; height: 100%; object-fit: contain; }
        .logoutBtn { border: 1px solid rgba(255,255,255,.25); background: transparent; color: #fff; padding: 10px 14px; cursor: pointer; }
        .heroAdmin {
          display: flex; justify-content: space-between; gap: 28px; align-items: end;
          padding: 48px clamp(18px,5vw,72px) 38px; color: #fff;
          background: linear-gradient(120deg,#052438,#0b5c8e); border-bottom: 6px solid #8dff4f;
        }
        .eyebrow { color: #8dff4f; font-size: 10px; font-weight: 900; letter-spacing: .14em; }
        h1 { margin: 8px 0; font-size: clamp(36px,5vw,64px); line-height: .95; text-transform: uppercase; }
        .heroAdmin p { margin: 0; color: #c7d9e2; max-width: 680px; line-height: 1.6; font-size: 14px; }
        .metric { min-width: 145px; padding: 18px; border: 1px solid rgba(255,255,255,.16); background: rgba(3,24,39,.35); }
        .metric span { display: block; color: #9fb9c6; font-size: 10px; text-transform: uppercase; letter-spacing: .1em; }
        .metric strong { display: block; margin-top: 5px; color: #8dff4f; font-size: 36px; }
        .controls {
          margin: 28px auto 0; width: min(calc(100% - 36px), 1180px); padding: 18px;
          display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: end;
          background: #fff; border: 1px solid #cfe0e7;
        }
        label { display: grid; gap: 7px; }
        label span { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #415d6b; }
        input { min-height: 46px; border: 1.5px solid #9fb9c5; border-radius: 0; padding: 0 12px; font: inherit; outline: none; color: #071821; background: #fff; }
        input:focus { border-color: #0d7aa7; box-shadow: 0 0 0 3px rgba(13,122,167,.12); }
        button { font: inherit; }
        .primaryBtn, .secondaryBtn { min-height: 46px; padding: 0 18px; border: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; cursor: pointer; }
        .primaryBtn { background: #8dff4f; color: #062820; }
        .secondaryBtn { background: #031827; color: #fff; }
        .primaryBtn:disabled, .secondaryBtn:disabled { opacity: .45; cursor: not-allowed; }
        .errorBox { width: min(calc(100% - 36px),1180px); margin: 12px auto 0; padding: 13px 15px; background: #fff1f1; border: 1px solid #e09b9b; color: #8a2020; font-size: 12px; font-weight: 700; }
        .tableSection { width: min(calc(100% - 36px),1180px); margin: 18px auto 42px; background: #fff; border: 1px solid #cfe0e7; }
        .tableHeading { padding: 16px 18px; display: flex; justify-content: space-between; align-items: end; border-bottom: 1px solid #dce7eb; }
        .tableHeading div { display: flex; flex-direction: column; gap: 4px; }
        .tableHeading span, .tableHeading small { color: #6b7f89; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
        .tableHeading strong { font-size: 15px; }
        .tableWrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        th, td { text-align: left; padding: 13px 14px; border-bottom: 1px solid #e5edef; font-size: 12px; vertical-align: top; }
        th { background: #f2f7f9; color: #45606d; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
        tbody tr:hover { background: #f9fcfd; }
        td a { color: #0b5c8e; text-decoration: none; }
        td a:hover { text-decoration: underline; }
        .nameCell { font-weight: 800; color: #071821; white-space: nowrap; }
        .eventTag { display: inline-block; padding: 5px 8px; background: #efffe7; border: 1px solid #c9f9aa; color: #174c24; font-weight: 800; }
        .suggestionCell { min-width: 180px; max-width: 280px; line-height: 1.5; }
        .emptyState { min-height: 180px; display: grid; place-items: center; color: #708691; font-size: 13px; padding: 24px; text-align: center; }
        footer { padding: 20px clamp(18px,5vw,72px); display: flex; justify-content: space-between; gap: 20px; background: #061f30; border-top: 5px solid #8dff4f; font-size: 11px; }
        footer span { color: #9fb7c2; }
        footer a { color: #fff; text-decoration: none; font-weight: 700; }
        footer a:hover { color: #8dff4f; }
        @media (max-width: 760px) {
          .heroAdmin { align-items: stretch; flex-direction: column; padding-top: 34px; }
          .metric { width: 100%; }
          .controls { grid-template-columns: 1fr; }
          .primaryBtn, .secondaryBtn { width: 100%; }
          footer { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}
