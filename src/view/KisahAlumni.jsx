import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/LingkunganPage.css";
import "../css/admin-modern.css";
import { apiFetch, APP_BASE, getCurrentUser, logout } from "../lib/api";
import Sidebar from "./Sidebar";

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
  star: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
};

const AVATAR_CLASSES = [
  "avatar-a",
  "avatar-b",
  "avatar-c",
  "avatar-d",
  "avatar-e",
  "avatar-f",
];

const STATUS_META = {
  pending: { label: "Menunggu", cls: "status-progress" },
  approved: { label: "Disetujui", cls: "status-success" },
  rejected: { label: "Ditolak", cls: "status-danger" },
};

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Menunggu" },
  { id: "approved", label: "Disetujui" },
  { id: "rejected", label: "Ditolak" },
];

function imageUrl(path) {
  return path ? `${APP_BASE}/storage/${path}` : null;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KisahAlumniPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchKisah = () => {
    setLoading(true);
    setError("");
    // Ambil semua sekali (paginate Laravel), filter/cari/halaman diurus di sini.
    apiFetch("/kisah-alumni?per_page=500")
      .then((data) => setItems(Array.isArray(data) ? data : data?.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKisah();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "bkk" (sama dengan permission di backend).
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.bkk?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.bkk?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.bkk?.del;

  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (i.nama || "").toLowerCase().includes(q) ||
        (i.jabatan || "").toLowerCase().includes(q) ||
        (i.jurusan || "").toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const updateStatus = async (item, status) => {
    if (
      status === "rejected" &&
      !window.confirm(`Tolak kisah dari "${item.nama}"?`)
    )
      return;
    setBusyId(item.id);
    setError("");
    try {
      await apiFetch(`/kisah-alumni/${item.id}/status`, {
        method: "PUT",
        body: { status },
      });
      setItems((list) =>
        list.map((i) => (i.id === item.id ? { ...i, status } : i)),
      );
      setDetail((d) => (d && d.id === item.id ? { ...d, status } : d));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus kisah dari "${item.nama}"?`)) return;
    try {
      await apiFetch(`/kisah-alumni/${item.id}`, { method: "DELETE" });
      setItems((list) => list.filter((i) => i.id !== item.id));
      setDetail(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderAvatar = (item, idx) =>
    imageUrl(item.foto) ? (
      <img
        src={imageUrl(item.foto)}
        alt={item.nama}
        className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
        style={{ objectFit: "cover" }}
      />
    ) : (
      <div className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}>
        {item.nama?.slice(0, 2).toUpperCase()}
      </div>
    );

  const StatusPill = ({ status }) => {
    const m = STATUS_META[status] || {
      label: status,
      cls: "status-neutral",
    };
    return <span className={`status-pill ${m.cls}`}>{m.label}</span>;
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
        <div className="panel kisah-panel page-modern">
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

          {error && (
            <div className="banner-error" role="alert">
              {error}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                {Icon.star}
                <span>Total Kisah</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{counts.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.clock}
                <span>Menunggu Persetujuan</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{counts.pending}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.check}
                <span>Disetujui</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{counts.approved}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.x}
                <span>Ditolak</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{counts.rejected}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>Seleksi Kisah Sukses Alumni</h3>
              <p>
                Tinjau kisah yang dikirim alumni. Hanya yang disetujui yang
                tampil di landing BKK.
              </p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama, jurusan, atau jabatan..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Status</span>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-chip${statusFilter === f.id ? " active" : ""}`}
                  onClick={() => {
                    setStatusFilter(f.id);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alumni</th>
                  <th>Kisah</th>
                  <th>Dikirim</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-row-text">
                      Memuat data...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row-text">
                      Tidak ada kisah pada filter ini.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          {renderAvatar(item, idx)}
                          <div>
                            <div className="user-name">{item.nama}</div>
                            <div className="user-email">
                              Alumni {item.jurusan} {item.tahun_lulus} ·{" "}
                              {item.jabatan}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="desc-cell">
                        <div
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.kisah}
                        </div>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <StatusPill status={item.status} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-secondary"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => setDetail(item)}
                          >
                            Tinjau
                          </button>
                          {canDelete && (
                            <button
                              className="btn-outline"
                              onClick={() => handleDelete(item)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-footer">
            <div className="pagination-perpage">
              <span>Tampilkan</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>kisah per halaman</span>
            </div>
            <div className="pagination-pages">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn${p === currentPage ? " active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>

          {/* Modal Tinjau Kisah */}
          {detail && (
            <div className="modal-backdrop" onClick={() => setDetail(null)}>
              <div
                className="modal-card"
                style={{ maxWidth: 560 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="panel-head" style={{ marginBottom: "16px" }}>
                  <h3>Tinjau Kisah</h3>
                  <button className="sq-btn" onClick={() => setDetail(null)}>
                    ✕
                  </button>
                </div>

                <div className="user-cell" style={{ marginBottom: 14 }}>
                  {renderAvatar(detail, 0)}
                  <div>
                    <div className="user-name">{detail.nama}</div>
                    <div className="user-email">
                      Alumni {detail.jurusan} {detail.tahun_lulus}
                    </div>
                    <div className="user-email">{detail.jabatan}</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <StatusPill status={detail.status} />
                  </div>
                </div>

                {imageUrl(detail.foto) && (
                  <img
                    src={imageUrl(detail.foto)}
                    alt={detail.nama}
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 12,
                      marginBottom: 14,
                    }}
                  />
                )}

                <p
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  "{detail.kisah}"
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 10,
                  }}
                >
                  Dikirim {formatDate(detail.created_at)}
                  {detail.user
                    ? ` oleh ${detail.user.name} (${detail.user.email})`
                    : ""}
                </p>

                <div className="review-actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDetail(null)}
                  >
                    Tutup
                  </button>
                  {canEdit && detail.status !== "rejected" && (
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={busyId === detail.id}
                      onClick={() => updateStatus(detail, "rejected")}
                    >
                      Tolak
                    </button>
                  )}
                  {canEdit && detail.status !== "approved" && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busyId === detail.id}
                      onClick={() => updateStatus(detail, "approved")}
                    >
                      {busyId === detail.id ? "Memproses..." : "Setujui"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}