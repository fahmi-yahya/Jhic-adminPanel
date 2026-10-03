import React, { useCallback, useEffect, useState } from "react";
import "../css/index.css";
import "../css/admin-modern.css";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
import Sidebar from "./Sidebar";

const formatTanggal = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const FILTERS = [
  { key: "", label: "Semua" },
  { key: "0", label: "Belum dibaca" },
  { key: "1", label: "Sudah dibaca" },
];

const Icon = {
  search: (
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
  ),
  mail: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

export default function PesanBludPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Debounce pencarian 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pesan?.view;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pesan?.del;

  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, per_page: 10 });
      if (query) params.set("search", query);
      if (filter !== "") params.set("dibaca", filter);
      const json = await apiFetch(`/pesan?${params}`);
      setRows(json.data || []);
      setMeta({
        current_page: json.current_page,
        last_page: json.last_page,
        total: json.total,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openMessage = async (row) => {
    setSelected(row);
    if (!row.dibaca) {
      try {
        await apiFetch(`/pesan/${row.id}/baca`, { method: "PUT" });
        setRows((rs) =>
          rs.map((r) => (r.id === row.id ? { ...r, dibaca: true } : r)),
        );
        setSelected({ ...row, dibaca: true });
      } catch {
        /* gagal menandai dibaca tidak perlu mengganggu pengguna */
      }
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Hapus pesan dari ${row.nama_lengkap}?`)) return;
    try {
      await apiFetch(`/pesan/${row.id}`, { method: "DELETE" });
      setSelected(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="knowvio-root" data-theme={theme}>
      <Sidebar
        activeNav="landing"
        theme={theme}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
        userName={currentUser?.name}
        role={currentUser?.role}
        permissions={currentUser?.permissions}
        onLogoutClick={logout}
      />

      <main className="main">
        <div className="panel page-modern">
          <button
            type="button"
            className="link-btn back-btn"
            onClick={() => window.history.back()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali
          </button>

          <div className="panel-head">
            <div>
              <h3>Pesan Masuk</h3>
              <p>{meta.total} pesan dari formulir kontak landing page</p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama, email, atau isi pesan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group" style={{ marginTop: "12px" }}>
            <span className="filter-label">Status Dibaca</span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip${filter === f.key ? " active" : ""}`}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && (
            <div
              className="banner-error"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              {error}
            </div>
          )}

          <div
            className="pesan-layout"
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "minmax(300px, 400px) 1fr",
              gap: "16px",
            }}
          >
            {/* Daftar pesan */}
            <div
              className="pesan-list"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                background: "var(--bg-card, #fff)",
              }}
            >
              {loading && (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  Memuat…
                </div>
              )}
              {!loading && rows.length === 0 && (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  Belum ada pesan.
                </div>
              )}
              {!loading &&
                rows.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openMessage(r)}
                    className={`pesan-item${selected?.id === r.id ? " active" : ""}`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: 0,
                      borderBottom: "1px solid #f0f0f0",
                      background:
                        selected?.id === r.id ? "#fff4ec" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#ff8c00",
                          flexShrink: 0,
                          opacity: r.dibaca ? 0 : 1,
                        }}
                      />
                      <strong
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.nama_lengkap}
                      </strong>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatTanggal(r.created_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginLeft: "16px",
                        marginBottom: "2px",
                      }}
                    >
                      {r.alamat_email}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#374151",
                        marginLeft: "16px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.pesan}
                    </div>
                  </button>
                ))}

              {meta.last_page > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                  }}
                >
                  <button
                    className="btn-outline"
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹ Sebelumnya
                  </button>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {meta.current_page} / {meta.last_page}
                  </span>
                  <button
                    className="btn-outline"
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya ›
                  </button>
                </div>
              )}
            </div>

            {/* Detail pesan */}
            <div
              className="pesan-detail"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                background: "var(--bg-card, #fff)",
                minHeight: "300px",
              }}
            >
              {!selected ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: "14px",
                    paddingTop: "60px",
                  }}
                >
                  Pilih pesan untuk membaca isinya.
                </div>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                    {selected.nama_lengkap}
                  </h3>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "16px",
                    }}
                  >
                    {selected.alamat_email} ·{" "}
                    {formatTanggal(selected.created_at)}
                  </div>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                      fontSize: "15px",
                      margin: 0,
                      marginBottom: "20px",
                      color: "#1a1a1a",
                    }}
                  >
                    {selected.pesan}
                  </p>
                  <div className="review-actions">
                    <a
                      href={`mailto:${selected.alamat_email}?subject=${encodeURIComponent(
                        "Re: Pesan Anda ke BLUD SMKN 1 Bondowoso",
                      )}`}
                      className="btn-primary"
                    >
                      Balas lewat email
                    </a>
                    {canDelete && (
                      <button
                        className="btn-outline"
                        onClick={() => remove(selected)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
