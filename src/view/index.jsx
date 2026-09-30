import { useCallback, useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../css/index.css";
import Sidebar from "./Sidebar.jsx";
import { apiFetch, getCurrentUser } from "../lib/api";

// Angka pada kartu Highlights dimulai dari 0, lalu animasi menghitung naik
// ke nilai aslinya begitu data dari API datang (bukan langsung loncat).
function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;

    if (start === end) {
      setDisplay(end);
      return;
    }

    const startTime = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevValue.current = end;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

// Metadata tampilan tiap kartu Highlights (ikon & label). Nilainya sendiri
// (jumlah data) diambil dari API secara dinamis, lihat state `counts` di
// bawah — bukan angka statis lagi.
const HIGHLIGHT_META = [
  {
    id: "jurusan",
    label: "Jurusan",
    // TODO: sesuaikan kalau endpoint aslinya bukan "/jurusan"
    endpoint: "/jurusan",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 9 10-5 10 5-10 5-10-5Z" />
        <path d="M6 11.3v4.8c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.8" />
        <path d="M22 9v6.5" />
      </svg>
    ),
  },
  {
    id: "berita",
    label: "Berita",
    // TODO: sesuaikan kalau endpoint aslinya bukan "/berita"
    endpoint: "/berita",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5.5" />
      </svg>
    ),
  },
  {
    id: "prestasi",
    label: "Prestasi",
    // TODO: sesuaikan kalau endpoint aslinya bukan "/prestasi"
    endpoint: "/prestasi",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8.5" r="5" />
        <path d="M8.2 12.8 7 21l5-2.6 5 2.6-1.2-8.2" />
      </svg>
    ),
  },
  {
    id: "lingkungan",
    label: "Lingkungan",
    endpoint: "/lingkungan",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5-3 8-7.5 8-12a8 8 0 0 0-16 0c0 4.5 3 9 8 12Z" />
        <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      </svg>
    ),
  },
];

// Warna & label badge untuk tiap jenis aksi di panel Activity Log.
const ACTION_META = {
  created: { text: "Ditambahkan", color: "#22c55e" },
  updated: { text: "Diubah", color: "#4c7dff" },
  deleted: { text: "Dihapus", color: "#ff3e9e" },
};

function formatLogTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Contoh bentuk data yang diharapkan dari /analytics/weekly-visitors:
// [{ week: "M1", range: "1 Sep–7 Sep", total: 120 }, ...]
// (Array kosong di awal itu wajar — diisi lewat fetchVisitorStats di bawah.)

function VisitorTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip-top">
        <span className="tooltip-date">{point.range || point.week}</span>
        {point.delta && <span className="tooltip-delta">{point.delta}</span>}
      </div>
      <div className="tooltip-pct">{point.total} pengunjung</div>
    </div>
  );
}

function VisitorDot(props) {
  const { cx, cy, index } = props;
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--card-bg)"
      stroke="#ff7a29"
      strokeWidth={2.2}
    />
  );
}

// Data contoh, dipakai sementara sebagai fallback tampilan grafik selama
// /analytics/weekly-visitors belum punya data asli (belum ada tracking
// dari landing page). Begitu ada data asli, ini otomatis tidak dipakai lagi.
const SAMPLE_VISITOR_DATA = [
  { week: "M1", range: "03 Aug–09 Aug", total: 42 },
  { week: "M2", range: "10 Aug–16 Aug", total: 58 },
  { week: "M3", range: "17 Aug–23 Aug", total: 51 },
  { week: "M4", range: "24 Aug–30 Aug", total: 67 },
  { week: "M5", range: "31 Aug–06 Sep", total: 73 },
  { week: "M6", range: "07 Sep–13 Sep", total: 64 },
  { week: "M7", range: "14 Sep–20 Sep", total: 80 },
  { week: "M8", range: "21 Sep–27 Sep", total: 91 },
];

// Data placeholder — nanti diganti hasil dari Google Analytics Data API
// (atau layanan geolocation lain) yang ngecek negara asal pengunjung web.
const LEGEND = [
  { color: "#ff7a29", label: "Indonesia", pct: "45%" },
  { color: "#4c7dff", label: "Malaysia", pct: "25%" },
  { color: "#ff3e9e", label: "Amerika Serikat", pct: "20%" },
  { color: "#33409e", label: "Lainnya", pct: "10%" },
];

const DONUT_DATA = LEGEND.map((item) => ({
  name: item.label,
  value: parseInt(item.pct, 10),
  color: item.color,
}));

const TOPIC_ICONS = [
  { bg: "#ff7a29", path: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /> },
  {
    bg: "#8a5cf6",
    path: (
      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-9 9-2 2m0-13 2 2m9 9 2 2" />
    ),
  },
  { bg: "#ff3e9e", path: <path d="M21 12a9 9 0 1 1-9-9" /> },
  { bg: "#4c7dff", path: <path d="m9 18-5-6 5-6" /> },
];

export default function KnowvioDashboard() {
  const [theme, setTheme] = useState("light");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [counts, setCounts] = useState({
    jurusan: null,
    berita: null,
    prestasi: null,
    lingkungan: null,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Data pengunjung website per minggu, dari GET /analytics/weekly-visitors.
  const [visitorStats, setVisitorStats] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [visitorError, setVisitorError] = useState("");

  const fetchVisitorStats = useCallback(() => {
    setVisitorLoading(true);
    setVisitorError("");
    apiFetch("/analytics/weekly-visitors")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setVisitorStats(list);
      })
      .catch((err) => setVisitorError(err.message))
      .finally(() => setVisitorLoading(false));
  }, []);

  useEffect(() => {
    fetchVisitorStats();
  }, [fetchVisitorStats]);

  // Perlu tahu role user yang login supaya panel Activity Log bisa
  // disembunyikan total (bukan cuma dikasih pesan error) untuk role
  // selain Super Admin.
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {
        // 401 sudah ditangani (redirect ke login) di dalam apiFetch
      })
      .finally(() => setUserLoading(false));
  }, []);

  const isSuperAdmin = currentUser?.role === "superadmin";
  // Selama role user masih dicek, jangan langsung sembunyikan panelnya —
  // tampilkan dulu (dengan skeleton loading) supaya tidak "kedip"
  // hilang-muncul begitu currentUser selesai di-fetch.
  const showActivityPanel = userLoading || isSuperAdmin;

  // Ambil aktivitas terbaru (role jurusan & admin: siapa nambah/ubah/hapus
  // data apa, jam berapa). Hanya dipanggil kalau user yang login Super Admin
  // — role lain tidak perlu request ini sama sekali.
  const fetchActivityLogs = useCallback(() => {
    if (!isSuperAdmin) return;
    setActivityLoading(true);
    setActivityError("");
    apiFetch("/activity-logs?per_page=8")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setActivityLogs(list);
      })
      .catch((err) => setActivityError(err.message))
      .finally(() => setActivityLoading(false));
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Ambil jumlah Jurusan/Berita/Prestasi dari API. Pakai allSettled supaya
  // kalau satu endpoint gagal/belum ada, dua kartu lainnya tetap tampil.
  const fetchHighlights = useCallback(() => {
    setCountsLoading(true);
    Promise.allSettled(
      HIGHLIGHT_META.map((stat) => apiFetch(stat.endpoint)),
    ).then((results) => {
      const next = {};
      results.forEach((res, i) => {
        const id = HIGHLIGHT_META[i].id;
        if (res.status !== "fulfilled") {
          next[id] = null; // gagal diambil, tampilkan "-" di kartu
          return;
        }
        const data = res.value;
        // Dukung dua bentuk respons: array polos, atau { data: [...], total }
        // (bentuk default paginate() Laravel).
        const list = Array.isArray(data) ? data : data?.data || [];
        next[id] = data?.total ?? list.length;
      });
      setCounts(next);
      setCountsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("knowvio-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch (e) {
      /* localStorage unavailable, ignore */
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("knowvio-theme", next);
    } catch (e) {
      /* localStorage unavailable, ignore */
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
  };

  const handleRefresh = () => {
    setRefreshSpin(true);
    fetchHighlights();
    setTimeout(() => setRefreshSpin(false), 520);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="knowvio-root" data-theme={theme}>
      {/* ============ SIDEBAR ============ */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={handleNavClick}
        theme={theme}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        userName={currentUser?.name || "Pengguna"}
        role={currentUser?.role}
        permissions={currentUser?.permissions}
      />

      {/* ============ MAIN ============ */}
      <main className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="welcome">
              <h1>
                Welcome Back
                {currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
                !
              </h1>
              <p>You've completed 3 lessons today — keep it up!</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" aria-label="Messages">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12a8 8 0 1 1 3.2 6.3L4 19.5l1.4-3.1A7.96 7.96 0 0 1 4 12Z" />
              </svg>
              <span className="dot"></span>
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 10a6 6 0 1 1 12 0c0 4 1.4 5.5 1.4 5.5H4.6S6 14 6 10Z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
            </button>
            <div className="search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search for Courses, Resources etc..."
              />
            </div>
            <button className="icon-btn" aria-label="More">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="19" cy="12" r="1.7" />
              </svg>
            </button>
          </div>
        </header>

        <section>
          <div className="section-head">
            <h2>Highlights</h2>
            <button className="link-btn" onClick={handleRefresh}>
              <svg
                className={refreshSpin ? "spin" : ""}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Refresh Data
            </button>
          </div>

          <div className="stats-grid">
            {HIGHLIGHT_META.map((stat) => {
              const value = counts[stat.id];
              return (
                <div className="stat-card" key={stat.id}>
                  <div className="stat-top">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <div className="stat-bottom">
                    <div className="stat-value">
                      <AnimatedNumber value={value ?? 0} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="charts-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Pengunjung Website</h3>
                <p>Jumlah pengunjung landing page per minggu.</p>
              </div>
              <div className="head-actions">
                <button
                  type="button"
                  className="sq-btn"
                  aria-label="Refresh data pengunjung"
                  onClick={fetchVisitorStats}
                >
                  <svg
                    className={visitorLoading ? "spin" : ""}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
              </div>
            </div>

            {visitorError && (
              <div className="banner-error" role="alert">
                {visitorError}
              </div>
            )}

            {!visitorError && (
              <div className="chart-wrap">
                {visitorStats.length === 0 && (
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {visitorLoading
                      ? "Memuat data pengunjung..."
                      : "Menampilkan data contoh — belum ada data pengunjung asli."}
                  </p>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      visitorStats.length > 0
                        ? visitorStats
                        : SAMPLE_VISITOR_DATA
                    }
                    margin={{ top: 10, right: 12, left: -6, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#ff7a29"
                          stopOpacity="0.38"
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff7a29"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                      tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    />
                    <Tooltip content={<VisitorTooltip />} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#ff7a29"
                      strokeWidth={3}
                      strokeLinecap="round"
                      fill="url(#areaGrad)"
                      dot={<VisitorDot />}
                      activeDot={{
                        r: 6,
                        fill: "#ff7a29",
                        stroke: "var(--card-bg)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
                </svg>
                Pengunjung per Negara
              </h3>
              <div className="head-actions">
                <button className="sq-btn" aria-label="Search">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
                <button className="sq-btn" aria-label="Next">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="donut-wrap">
              <div className="donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DONUT_DATA}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="66%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {DONUT_DATA.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <span>Total Pengunjung</span>
                  <strong>2.480</strong>
                </div>
              </div>
            </div>

            <div className="legend">
              {LEGEND.map((item) => (
                <div className="legend-item" key={item.label}>
                  <i style={{ background: item.color }}></i>
                  {item.label}: <b>{item.pct}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          {showActivityPanel && (
            <div className="panel">
              <div className="panel-head">
                <h3>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z" />
                    <path d="M12 7v5l3.5 2" />
                  </svg>
                  Activity Log
                </h3>
                <div className="head-actions">
                  <button
                    type="button"
                    className="sq-btn"
                    aria-label="Refresh activity log"
                    onClick={fetchActivityLogs}
                  >
                    <svg
                      className={activityLoading ? "spin" : ""}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </button>
                </div>
              </div>

              {activityError && (
                <div className="banner-error" role="alert">
                  {activityError}
                </div>
              )}

              {!activityError && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Pengguna</th>
                        <th>Aksi</th>
                        <th>Data</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLoading && (
                        <tr>
                          <td colSpan={4} className="um-empty">
                            Memuat aktivitas...
                          </td>
                        </tr>
                      )}
                      {!activityLoading &&
                        activityLogs.map((log) => {
                          const meta = ACTION_META[log.action] || {
                            text: log.action,
                            color: "#94a3b8",
                          };
                          return (
                            <tr key={log.id}>
                              <td>
                                <span className="task-cell">
                                  {log.user_name || "Sistem"}
                                  {log.role ? ` (${log.role})` : ""}
                                </span>
                              </td>
                              <td>
                                <span className="task-cell">
                                  <i style={{ background: meta.color }}></i>
                                  {meta.text}
                                </span>
                              </td>
                              <td>{log.description}</td>
                              <td>{formatLogTime(log.created_at)}</td>
                            </tr>
                          );
                        })}
                      {!activityLoading && activityLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="um-empty">
                            Belum ada aktivitas tercatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="panel">
            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>
              Quick Review
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              Sharpen your knowledge in 2 minutes!
            </p>

            <div className="review-search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input type="text" placeholder="Choose a topic to review..." />
            </div>
            <p className="recent-line">
              Recent: <b>Data Visualization in Python</b>
            </p>

            <div className="topic-row">
              {TOPIC_ICONS.map((topic, i) => (
                <span
                  className="topic-icon"
                  style={{ background: topic.bg }}
                  key={i}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {topic.path}
                  </svg>
                </span>
              ))}
              <svg
                className="topic-more"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </div>

            <div className="review-actions">
              <button className="btn-secondary">Practice</button>
              <button className="btn-primary">
                Start Quiz
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
