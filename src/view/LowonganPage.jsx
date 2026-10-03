import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/BkkPage.css";
import "../css/admin-modern.css";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
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
  briefcase: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
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
      <path d="M4 12.5 9 17l11-11" />
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
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

const STATUS_META = {
  pending: { text: "Menunggu Verifikasi", cls: "status-progress" },
  approved: { text: "Disetujui", cls: "status-neutral" },
  rejected: { text: "Ditolak", cls: "status-danger" },
};

function formatDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function BkkPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [detail, setDetail] = useState(null);
  const [acting, setActing] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchList = () => {
    setLoading(true);
    setError("");
    apiFetch("/bkk")
      .then((data) => setList(Array.isArray(data) ? data : data?.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const canView =
    currentUser?.role === "superadmin" || !!currentUser?.permissions?.bkk?.view;
  const canEdit =
    currentUser?.role === "superadmin" || !!currentUser?.permissions?.bkk?.edit;

  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const stats = useMemo(() => {
    const total = list.length;
    const pending = list.filter((l) => l.status === "pending").length;
    const approved = list.filter((l) => l.status === "approved").length;
    return { total, pending, approved };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((l) => {
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchQuery =
        !q ||
        (l.nama_perusahaan || "").toLowerCase().includes(q) ||
        (l.posisi_dibutuhkan || "").toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [list, query, statusFilter]);

  function openDetail(item) {
    setDetail(item);
    setCatatan(item.catatan_verifikasi || "");
  }

  async function handleReview(status) {
    if (!detail) return;
    if (
      status === "rejected" &&
      !window.confirm(`Tolak pengajuan dari "${detail.nama_perusahaan}"?`)
    )
      return;
    setActing(true);
    try {
      const updated = await apiFetch(`/bkk/${detail.id}/status`, {
        method: "PUT",
        body: { status, catatan_verifikasi: catatan },
      });
      setList((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setDetail(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus pengajuan dari "${item.nama_perusahaan}"?`))
      return;
    try {
      await apiFetch(`/bkk/${item.id}`, { method: "DELETE" });
      setList((prev) => prev.filter((l) => l.id !== item.id));
      if (detail?.id === item.id) setDetail(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="knowvio-root" data-theme={theme}>
      <Sidebar
        activeNav="bkk"
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
        <div className="panel bkk-panel page-modern">
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
                {Icon.briefcase}
                <span>Total Pengajuan</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.briefcase}
                <span>Menunggu Verifikasi</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.pending}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.check}
                <span>Disetujui</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.approved}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>BKK — Verifikasi Lowongan Kerja</h3>
              <p>
                Cek apakah perusahaan penyedia lowongan benar-benar ada sebelum
                disetujui.
              </p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama perusahaan atau posisi..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Status</span>
              {["pending", "approved", "rejected", "all"].map((id) => (
                <button
                  key={id}
                  className={`filter-chip${statusFilter === id ? " active" : ""}`}
                  onClick={() => setStatusFilter(id)}
                >
                  {id === "all" ? "Semua" : STATUS_META[id].text}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Perusahaan</th>
                  <th>Posisi</th>
                  <th>Tipe</th>
                  <th>Batas Lamar</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-row-text">
                      Memuat data...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row-text">
                      Tidak ada pengajuan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-name">{item.nama_perusahaan}</div>
                        <div className="user-email">
                          {item.penanggung_jawab} · {item.email}
                        </div>
                      </td>
                      <td className="task-cell">{item.posisi_dibutuhkan}</td>
                      <td>
                        <span
                          className={`tipe-badge tipe-${(item.tipe_pekerjaan || "").toLowerCase().replace(" ", "-")}`}
                        >
                          {item.tipe_pekerjaan}
                        </span>
                      </td>
                      <td>{formatDate(item.batas_lamar)}</td>
                      <td>
                        <span
                          className={`status-pill ${STATUS_META[item.status]?.cls || ""}`}
                        >
                          {STATUS_META[item.status]?.text || item.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {canEdit && (
                            <button
                              className="btn-outline"
                              onClick={() => openDetail(item)}
                            >
                              Detail
                            </button>
                          )}
                          <button
                            className="btn-outline"
                            onClick={() => handleDelete(item)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal detail + verifikasi */}
          {detail && (
            <div className="modal-backdrop" onClick={() => setDetail(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="panel-head" style={{ marginBottom: "16px" }}>
                  <h3>Detail Pengajuan</h3>
                  <button className="sq-btn" onClick={() => setDetail(null)}>
                    {Icon.x}
                  </button>
                </div>

                <div className="bkk-detail-grid">
                  <div>
                    <span>Perusahaan</span>
                    <p>{detail.nama_perusahaan}</p>
                  </div>
                  <div>
                    <span>Penanggung Jawab</span>
                    <p>{detail.penanggung_jawab}</p>
                  </div>
                  <div>
                    <span>Email</span>
                    <p>{detail.email}</p>
                  </div>
                  <div>
                    <span>No. Telepon</span>
                    <p>{detail.no_telepon}</p>
                  </div>
                  <div className="span-2">
                    <span>Alamat Perusahaan</span>
                    <p>{detail.alamat_perusahaan || "-"}</p>
                  </div>
                  <div className="span-2">
                    <span>Deskripsi Perusahaan</span>
                    <p>{detail.deskripsi_perusahaan || "-"}</p>
                  </div>
                  <div>
                    <span>Posisi</span>
                    <p>{detail.posisi_dibutuhkan}</p>
                  </div>
                  <div>
                    <span>Tipe Pekerjaan</span>
                    <p>{detail.tipe_pekerjaan}</p>
                  </div>
                  <div>
                    <span>Gaji</span>
                    <p>{detail.gaji || "-"}</p>
                  </div>
                  <div>
                    <span>Batas Lamar</span>
                    <p>{formatDate(detail.batas_lamar)}</p>
                  </div>
                  <div className="span-2">
                    <span>Kualifikasi</span>
                    <p>{detail.kualifikasi}</p>
                  </div>
                </div>

                {canEdit && (
                  <>
                    <label className="form-group" style={{ marginTop: "12px" }}>
                      <span className="form-label">
                        Catatan verifikasi (internal, opsional)
                      </span>
                      <textarea
                        className="custom-input"
                        rows="3"
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="mis. sudah dicek lewat telepon, perusahaan terkonfirmasi aktif"
                      />
                    </label>

                    <div
                      className="review-actions"
                      style={{ marginTop: "14px" }}
                    >
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={acting}
                        onClick={() => handleReview("rejected")}
                      >
                        {Icon.x} Tolak
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={acting}
                        onClick={() => handleReview("approved")}
                      >
                        {Icon.check} Setujui
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
