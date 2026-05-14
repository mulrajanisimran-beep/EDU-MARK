import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const ADMIN = { username: "admin", password: "admin123", role: "admin", name: "Principal" };

const TEACHERS = [
  { username: "t_math",    password: "math123",    subject: "Mathematics", emoji: "📐", color: "#f59e0b", idx: 0 },
  { username: "t_science", password: "sci123",     subject: "Science",     emoji: "🔬", color: "#10b981", idx: 1 },
  { username: "t_english", password: "eng123",     subject: "English",     emoji: "📖", color: "#3b82f6", idx: 2 },
  { username: "t_history", password: "his123",     subject: "History",     emoji: "🏛️", color: "#8b5cf6", idx: 3 },
  { username: "t_geo",     password: "geo123",     subject: "Geography",   emoji: "🌍", color: "#06b6d4", idx: 4 },
  { username: "t_physics", password: "phy123",     subject: "Physics",     emoji: "⚡", color: "#f97316", idx: 5 },
  { username: "t_chem",    password: "chem123",    subject: "Chemistry",   emoji: "🧪", color: "#ec4899", idx: 6 },
  { username: "t_comp",    password: "comp123",    subject: "Computer",    emoji: "💻", color: "#14b8a6", idx: 7 },
];

const ALL_USERS = [ADMIN, ...TEACHERS];

const INIT_STUDENTS = [
  { id: 1, name: "Ahmed Ali",     wa: "+923001234567" },
  { id: 2, name: "Sara Khan",     wa: "+923012345678" },
  { id: 3, name: "Bilal Hussain", wa: "+923021234567" },
  { id: 4, name: "Fatima Noor",   wa: "+923031234567" },
  { id: 5, name: "Usman Tariq",   wa: "+923041234567" },
  { id: 6, name: "Ayesha Malik",  wa: "+923051234567" },
];

const MAX_MARKS = 20;
const PASS_MARK = 10;

const REMARKS = [
  { min: 19, max: 20, label: "Outstanding",  emoji: "🌟", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { min: 17, max: 18, label: "Excellent",    emoji: "🏆", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  { min: 15, max: 16, label: "Very Good",    emoji: "😊", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  { min: 13, max: 14, label: "Good",         emoji: "👍", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  { min: 10, max: 12, label: "Satisfactory", emoji: "📘", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  { min:  7, max:  9, label: "Needs Work",   emoji: "⚠️", color: "#fb923c", bg: "rgba(251,146,60,0.15)"  },
  { min:  0, max:  6, label: "Fail",         emoji: "❌", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
];

function getRemark(mark) {
  if (mark === "" || mark === undefined || mark === null) return null;
  const n = Number(mark);
  return REMARKS.find(r => n >= r.min && n <= r.max) || REMARKS[REMARKS.length - 1];
}

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("en-PK", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});

// ─── STORAGE — uses localStorage so data persists across sessions ─────────
const KEYS = { marks: "em_marks", students: "em_students", sent: "em_sent" };

function useLocalStorage(key, init) {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : init;
    } catch { return init; }
  });

  const save = useCallback((val) => {
    setData(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [data, save];
}

// ─── WHATSAPP LINK BUILDER ────────────────────────────────────────────────
function buildWALink(student, subjectName, emoji, mark, date) {
  const num = student.wa.replace(/\D/g, "");
  const remark = getRemark(mark);
  const msg =
    `Dear%20${encodeURIComponent(student.name)}%2C%0A%0A` +
    `${encodeURIComponent(emoji)}%20*${encodeURIComponent(subjectName)}%20Marks%20Report*%0A` +
    `%F0%9F%93%85%20*Date%3A*%20${encodeURIComponent(fmtDate(date))}%0A` +
    `%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%0A` +
    `*Marks%20Obtained%3A*%20${mark}%2F${MAX_MARKS}%0A` +
    `*Remarks%3A*%20${encodeURIComponent((remark?.emoji || "") + " " + (remark?.label || ""))}%0A` +
    `%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%E2%80%94%0A` +
    `_Sent%20by%20${encodeURIComponent(subjectName)}%20Teacher_%20%F0%9F%8E%93`;
  return `https://wa.me/${num}?text=${msg}`;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("em_user") || "null"); } catch { return null; }
  });
  const [loginInput, setLoginInput] = useState({ u: "", p: "" });
  const [loginErr, setLoginErr]   = useState("");
  const [tab, setTab]             = useState("marks");
  const [selDate, setSelDate]     = useState(today());
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [newStudent, setNewStudent] = useState({ name: "", wa: "" });

  const [students, saveStudents] = useLocalStorage(KEYS.students, INIT_STUDENTS);
  const [marks,    saveMarks]    = useLocalStorage(KEYS.marks,    {});
  const [sent,     saveSent]     = useLocalStorage(KEYS.sent,     {});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── AUTH ──
  const login = () => {
    const found = ALL_USERS.find(u => u.username === loginInput.u && u.password === loginInput.p);
    if (found) {
      setUser(found);
      sessionStorage.setItem("em_user", JSON.stringify(found));
      setLoginErr("");
    } else {
      setLoginErr("Invalid username or password.");
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("em_user");
    setLoginInput({ u: "", p: "" });
    setTab("marks");
  };

  // ── MARK HELPERS ──
  const getMark = (subIdx, studentId, date) => marks[subIdx]?.[studentId]?.[date] ?? "";

  const setMark = (subIdx, studentId, date, val) => {
    if (val !== "" && (isNaN(val) || Number(val) < 0 || Number(val) > MAX_MARKS)) return;
    setSaving(true);
    saveMarks(prev => ({
      ...prev,
      [subIdx]: {
        ...(prev[subIdx] || {}),
        [studentId]: { ...(prev[subIdx]?.[studentId] || {}), [date]: val }
      }
    }));
    setTimeout(() => setSaving(false), 400);
  };

  const markSent  = (subIdx, studentId, date) =>
    saveSent(prev => ({ ...prev, [`${subIdx}-${studentId}-${date}`]: true }));
  const isSent    = (subIdx, studentId, date) => !!sent[`${subIdx}-${studentId}-${date}`];

  // ── STUDENT HELPERS ──
  const addStudent = () => {
    if (!newStudent.name.trim() || !newStudent.wa.trim()) return;
    saveStudents(prev => [...prev, { id: Date.now(), name: newStudent.name.trim(), wa: newStudent.wa.trim() }]);
    setNewStudent({ name: "", wa: "" });
    showToast("Student added!");
  };
  const removeStudent = (id) => {
    saveStudents(prev => prev.filter(s => s.id !== id));
    showToast("Student removed.", "warn");
  };

  // ════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (!user) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080c14", fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)"
      }} />
      <div style={{
        width: 380, background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
        padding: "40px 36px", backdropFilter: "blur(20px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", position: "relative", zIndex: 1
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1, color: "#fff" }}>EduMarks</div>
          <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>School Marks Management System</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Username</label>
          <input value={loginInput.u} onChange={e => setLoginInput(p => ({ ...p, u: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && login()} placeholder="e.g. t_math or admin" style={INP} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={LBL}>Password</label>
          <input type="password" value={loginInput.p}
            onChange={e => setLoginInput(p => ({ ...p, p: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && login()} placeholder="••••••••" style={INP} />
        </div>
        {loginErr && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14, textAlign: "center" }}>{loginErr}</div>}
        <button onClick={login} style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff",
          fontWeight: 800, fontSize: 15, boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
        }}>Sign In</button>

        <div style={{
          marginTop: 28, padding: "16px", borderRadius: 12,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Credentials
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.9 }}>
            <strong style={{ color: "#fbbf24" }}>Admin:</strong> admin / admin123<br />
            {TEACHERS.map(t => (
              <span key={t.username}>
                <strong style={{ color: t.color }}>{t.subject}:</strong> {t.username} / {t.password}<br />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const isAdmin = user.role === "admin";
  const teacher = isAdmin ? null : TEACHERS.find(t => t.username === user.username);
  const tabs = isAdmin
    ? [{ id: "overview", icon: "📊", label: "Overview" }, { id: "students", icon: "👥", label: "Students" }, { id: "credentials", icon: "🔑", label: "Teacher Logins" }]
    : [{ id: "marks", icon: "✏️", label: "Enter Marks" }, { id: "send", icon: "📲", label: "Send WhatsApp" }, { id: "history", icon: "📅", label: "History" }];

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e2e8f0", fontFamily: "'Georgia', serif", paddingBottom: 40 }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px", display: "flex", alignItems: "center", height: 58,
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)"
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: "#fff" }}>🎓 EduMarks</div>
        {!isAdmin && teacher && (
          <div style={{
            marginLeft: 18, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: `${teacher.color}22`, color: teacher.color, border: `1px solid ${teacher.color}44`
          }}>{teacher.emoji} {teacher.subject} Teacher</div>
        )}
        {isAdmin && (
          <div style={{
            marginLeft: 18, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)"
          }}>⭐ Admin / Principal</div>
        )}
        {saving && <div style={{ marginLeft: 14, fontSize: 12, color: "#60a5fa" }}>💾 Saving…</div>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{user.name || user.username}</span>
          <button onClick={logout} style={{
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700
          }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13, transition: "all 0.15s",
              background: tab === t.id
                ? (isAdmin ? "linear-gradient(135deg,#d97706,#fbbf24)" : `linear-gradient(135deg,${teacher?.color},${teacher?.color}cc)`)
                : "rgba(255,255,255,0.06)",
              color: tab === t.id ? "#fff" : "#6b7280",
              boxShadow: tab === t.id ? `0 4px 18px ${isAdmin ? "rgba(251,191,36,0.3)" : teacher?.color + "44"}` : "none"
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ── Remarks Legend ── */}
        {!isAdmin && tab === "marks" && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16,
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
          }}>
            <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 700, alignSelf: "center", marginRight: 4, textTransform: "uppercase", letterSpacing: 1 }}>Remarks:</span>
            {REMARKS.map(r => (
              <span key={r.label} style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                background: r.bg, color: r.color, border: `1px solid ${r.color}44`
              }}>{r.emoji} {r.label} ({r.min}{r.min !== r.max ? `–${r.max}` : ""})</span>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════
            TEACHER: ENTER MARKS
        ════════════════════════════════════ */}
        {!isAdmin && tab === "marks" && (
          <div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <label style={LBL}>📅 Date</label>
                <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={INP2} />
              </div>
              <div style={{
                marginLeft: "auto", padding: "10px 20px", borderRadius: 12,
                background: `${teacher.color}18`, border: `1px solid ${teacher.color}44`,
                color: teacher.color, fontSize: 13, fontWeight: 700
              }}>{teacher.emoji} {teacher.subject} · {fmtDate(selDate)}</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "50px 1fr 140px 110px 160px",
                padding: "12px 20px", background: "rgba(255,255,255,0.04)",
                fontSize: 11, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1
              }}>
                <div>#</div><div>Student</div>
                <div style={{ textAlign: "center" }}>WhatsApp</div>
                <div style={{ textAlign: "center" }}>Mark /{MAX_MARKS}</div>
                <div style={{ textAlign: "center" }}>Remarks</div>
              </div>
              {students.map((s, si) => {
                const m = getMark(teacher.idx, s.id, selDate);
                const hasM = m !== "" && m !== undefined;
                const remark = getRemark(m);
                return (
                  <div key={s.id} style={{
                    display: "grid", gridTemplateColumns: "50px 1fr 140px 110px 160px",
                    padding: "14px 20px", alignItems: "center",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    background: si % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"
                  }}>
                    <div style={{ color: teacher.color, fontWeight: 800 }}>{si + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#25D366" }}>{s.wa}</div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 11, color: "#4b5563" }}>{s.wa}</div>
                    <div style={{ textAlign: "center" }}>
                      <input type="number" min="0" max={MAX_MARKS} value={m}
                        onChange={e => setMark(teacher.idx, s.id, selDate, e.target.value)}
                        placeholder="—"
                        style={{
                          width: 64, textAlign: "center", padding: "9px 6px",
                          background: hasM ? `${teacher.color}20` : "rgba(255,255,255,0.07)",
                          border: hasM ? `2px solid ${teacher.color}66` : "1.5px solid rgba(255,255,255,0.12)",
                          borderRadius: 10, color: "#e2e8f0", fontWeight: 800, fontSize: 16, outline: "none",
                        }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {remark
                        ? <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: remark.bg, color: remark.color, display: "inline-flex", alignItems: "center", gap: 5 }}>{remark.emoji} {remark.label}</span>
                        : <span style={{ color: "#374151", fontSize: 12 }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>
              💡 Marks save instantly. Go to <strong style={{ color: teacher.color }}>Send WhatsApp</strong> to notify students.
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            TEACHER: SEND WHATSAPP
        ════════════════════════════════════ */}
        {!isAdmin && tab === "send" && (
          <div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <label style={LBL}>📅 Date</label>
                <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={INP2} />
              </div>
              <div style={{
                padding: "10px 20px", borderRadius: 12,
                background: `${teacher.color}18`, border: `1px solid ${teacher.color}44`,
                color: teacher.color, fontSize: 13, fontWeight: 700
              }}>{teacher.emoji} {teacher.subject} · {fmtDate(selDate)}</div>
            </div>
            <div style={{
              background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.2)",
              borderRadius: 12, padding: "12px 18px", fontSize: 13, color: "#34d399", marginBottom: 16
            }}>
              📲 Click Send to open WhatsApp Web with a pre-filled <strong>{teacher.subject}</strong> marks message.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {students.map((s, si) => {
                const m = getMark(teacher.idx, s.id, selDate);
                const hasM = m !== "" && m !== undefined;
                const remark = getRemark(m);
                const waLink = hasM ? buildWALink(s, teacher.subject, teacher.emoji, m, selDate) : "#";
                const alreadySent = isSent(teacher.idx, s.id, selDate);
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "16px 20px"
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg,${teacher.color},#6366f1)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 900, fontSize: 18
                    }}>{s.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#25D366" }}>{s.wa}</div>
                      {hasM && (
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 700,
                            background: `${teacher.color}20`, color: teacher.color, border: `1px solid ${teacher.color}44`
                          }}>{teacher.emoji} {teacher.subject}: {m}/{MAX_MARKS}</span>
                          {remark && <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 700, background: remark.bg, color: remark.color }}>{remark.emoji} {remark.label}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <a href={hasM ? waLink : "#"} target="_blank" rel="noopener noreferrer"
                        onClick={() => hasM && markSent(teacher.idx, s.id, selDate)}
                        style={{
                          padding: "10px 22px", borderRadius: 12, textDecoration: "none",
                          fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                          background: alreadySent ? "rgba(37,211,102,0.15)" : hasM ? "linear-gradient(135deg,#128C7E,#25D366)" : "rgba(255,255,255,0.06)",
                          color: hasM ? "#fff" : "#374151",
                          border: alreadySent ? "1.5px solid #25D366" : "none",
                          opacity: hasM ? 1 : 0.4, pointerEvents: hasM ? "auto" : "none",
                          boxShadow: hasM && !alreadySent ? "0 4px 16px rgba(37,211,102,0.3)" : "none"
                        }}>
                        {alreadySent ? "✅ Sent!" : hasM ? "📲 Send WhatsApp" : "⚠️ No mark"}
                      </a>
                      {!hasM && <div style={{ fontSize: 10, color: "#4b5563" }}>Enter mark first</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            TEACHER: HISTORY
        ════════════════════════════════════ */}
        {!isAdmin && tab === "history" && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: teacher.color, marginBottom: 16 }}>
              {teacher.emoji} {teacher.subject} — Marks History
            </div>
            {(() => {
              const subMarks = marks[teacher.idx] || {};
              const allDates = [...new Set(
                Object.values(subMarks).flatMap(byDate => Object.keys(byDate).filter(d => byDate[d] !== ""))
              )].sort((a, b) => b.localeCompare(a));
              if (!allDates.length) return (
                <div style={{ color: "#374151", textAlign: "center", padding: 48, fontSize: 14 }}>
                  No marks recorded yet. Enter marks in the Enter Marks tab.
                </div>
              );
              return allDates.map(d => {
                const studentsWithMarks = students.filter(s => subMarks[s.id]?.[d] !== undefined && subMarks[s.id]?.[d] !== "");
                if (!studentsWithMarks.length) return null;
                const avg = studentsWithMarks.reduce((a, s) => a + Number(subMarks[s.id][d]), 0) / studentsWithMarks.length;
                return (
                  <div key={d} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontWeight: 800, color: teacher.color }}>{fmtDate(d)}</span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{studentsWithMarks.length} students</span>
                      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: avg >= PASS_MARK ? "#34d399" : "#f87171" }}>Avg: {avg.toFixed(1)}/{MAX_MARKS}</span>
                    </div>
                    <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {studentsWithMarks.map(s => {
                        const remark = getRemark(subMarks[s.id][d]);
                        return (
                          <div key={s.id} style={{ padding: "6px 14px", borderRadius: 10, fontSize: 13, background: `${teacher.color}15`, border: `1px solid ${teacher.color}33`, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontWeight: 700 }}>{s.name}</span>
                            <span style={{ fontWeight: 900, color: remark?.color }}>{subMarks[s.id][d]}</span>
                            {remark && <span style={{ fontSize: 11 }}>{remark.emoji} {remark.label}</span>}
                            {isSent(teacher.idx, s.id, d) && <span style={{ fontSize: 11 }}>✅</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ════════════════════════════════════
            ADMIN: OVERVIEW
        ════════════════════════════════════ */}
        {isAdmin && tab === "overview" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: "#9ca3af" }}>All subject marks — read-only view for all teachers</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <label style={LBL}>📅 Date</label>
                <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={INP2} />
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px", minWidth: 780 }}>
                <thead>
                  <tr>
                    <th style={TH}>#</th>
                    <th style={{ ...TH, textAlign: "left" }}>Student</th>
                    {TEACHERS.map(t => (
                      <th key={t.idx} style={{ ...TH, fontSize: 11 }}>
                        <div style={{ color: t.color }}>{t.emoji}</div>{t.subject.slice(0, 5)}.
                      </th>
                    ))}
                    <th style={TH}>Avg/{MAX_MARKS}</th>
                    <th style={TH}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, si) => {
                    const ms = TEACHERS.map(t => {
                      const v = marks[t.idx]?.[s.id]?.[selDate];
                      return v !== undefined && v !== "" ? Number(v) : null;
                    });
                    const filled = ms.filter(v => v !== null);
                    const avg = filled.length > 0 ? filled.reduce((a, v) => a + v, 0) / filled.length : null;
                    const overallRemark = avg !== null ? getRemark(Math.round(avg)) : null;
                    return (
                      <tr key={s.id}>
                        <td style={TD}><span style={{ color: "#fbbf24", fontWeight: 800 }}>{si + 1}</span></td>
                        <td style={{ ...TD, textAlign: "left" }}>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "#25D366" }}>{s.wa}</div>
                        </td>
                        {TEACHERS.map(t => {
                          const v = marks[t.idx]?.[s.id]?.[selDate];
                          const hasV = v !== undefined && v !== "";
                          const r = hasV ? getRemark(v) : null;
                          return (
                            <td key={t.idx} style={TD}>
                              {hasV ? <div><div style={{ fontWeight: 700, color: t.color }}>{v}</div>{r && <div style={{ fontSize: 10, color: r.color }}>{r.emoji}</div>}</div>
                                : <span style={{ color: "#1f2937" }}>—</span>}
                            </td>
                          );
                        })}
                        <td style={TD}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: avg !== null && avg >= PASS_MARK ? "#34d399" : avg !== null ? "#f87171" : "#374151" }}>
                            {avg !== null ? avg.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td style={TD}>
                          {overallRemark
                            ? <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: overallRemark.bg, color: overallRemark.color, whiteSpace: "nowrap" }}>{overallRemark.emoji} {overallRemark.label}</span>
                            : <span style={{ color: "#374151" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ADMIN: STUDENTS
        ════════════════════════════════════ */}
        {isAdmin && tab === "students" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, flex: "0 0 290px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18, color: "#fbbf24" }}>➕ Add Student</div>
              <label style={LBL}>Full Name</label>
              <input value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Zara Ahmed" style={{ ...INP, marginBottom: 12 }} />
              <label style={LBL}>WhatsApp Number</label>
              <input value={newStudent.wa} onChange={e => setNewStudent(p => ({ ...p, wa: e.target.value }))}
                placeholder="+923001234567" style={INP} />
              <button onClick={addStudent} disabled={!newStudent.name.trim() || !newStudent.wa.trim()} style={{
                marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#d97706,#fbbf24)", color: "#fff", fontWeight: 800, fontSize: 14,
                opacity: (!newStudent.name.trim() || !newStudent.wa.trim()) ? 0.45 : 1
              }}>Add Student</button>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#fbbf24" }}>👥 All Students ({students.length})</div>
              {students.map((s, si) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${TEACHERS[si % 8].color},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{s.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#25D366" }}>{s.wa}</div>
                  </div>
                  <button onClick={() => removeStudent(s.id)} style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ADMIN: CREDENTIALS
        ════════════════════════════════════ */}
        {isAdmin && tab === "credentials" && (
          <div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>Share these with each teacher. They only see their own subject.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {TEACHERS.map(t => (
                <div key={t.idx} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${t.color}33`, borderRadius: 14, padding: "18px 20px", borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, color: t.color, fontSize: 15, marginBottom: 10 }}>{t.subject}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 2.1 }}>
                    <span style={{ color: "#6b7280" }}>Username:</span>&nbsp;
                    <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 5, color: "#e2e8f0", fontFamily: "monospace" }}>{t.username}</code><br />
                    <span style={{ color: "#6b7280" }}>Password:</span>&nbsp;
                    <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 5, color: "#e2e8f0", fontFamily: "monospace" }}>{t.password}</code>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 13, color: "#fbbf24" }}>
              ⭐ <strong>Admin Login:</strong>&nbsp;
              <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 7px", borderRadius: 4 }}>admin</code> /&nbsp;
              <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 7px", borderRadius: 4 }}>admin123</code>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "warn" ? "#7c2d12" : "#14532d",
          border: `1px solid ${toast.type === "warn" ? "#ea580c" : "#16a34a"}`,
          color: "#fff", padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 700,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 999
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

const LBL = { fontSize: 11, color: "#6b7280", display: "block", marginBottom: 5, fontFamily: "'Segoe UI',sans-serif", textTransform: "uppercase", letterSpacing: 0.8 };
const INP = { width: "100%", padding: "10px 13px", borderRadius: 9, boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "'Segoe UI',sans-serif" };
const INP2 = { padding: "9px 13px", borderRadius: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", fontSize: 13, outline: "none" };
const TH = { padding: "10px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#4b5563", background: "transparent", border: "none", textTransform: "uppercase", letterSpacing: 0.5 };
const TD = { padding: "12px 10px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "none" };
