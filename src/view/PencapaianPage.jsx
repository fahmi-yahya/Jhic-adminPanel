import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
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
  handshake: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 0 0 3-3" />
      <path d="M3 4h8" />
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

function imageUrl(path) {
  return path ? `${APP_BASE}/storage/${path}` : null;
}

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

export default function PencapaianPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchList = () => {
    setLoading(true);
    setError("");
    apiFetch("/pencapaian")
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
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pencapaian?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pencapaian?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pencapaian?.del;

  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        (p.jurusan_terkait || "").toLowerCase().includes(q) ||
        (p.nama_mitra || "").toLowerCase().includes(q),
    );
  }, [list, query]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const formData = new FormData(e.target);
      await apiFetch("/pencapaian", { method: "POST", body: formData });
      setShowModal(false);
      fetchList();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (
      !window.confirm(
        `Hapus kerja sama "${item.jurusan_terkait} x ${item.nama_mitra}"?`,
      )
    )
      return;
    try {
      await apiFetch(`/pencapaian/${item.id}`, { method: "DELETE" });
      fetchList();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="knowvio-root" data-theme={theme}>
      <Sidebar
        activeNav="blud"
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

          {error && (
            <div className="banner-error" role="alert">
              {error}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                {Icon.handshake}
                <span>Total Kerja Sama</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{list.length}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>Pencapaian & Kerja Sama</h3>
              <p>
                Daftar MOU/kerja sama jurusan dengan mitra (perusahaan,
                instansi).
              </p>
            </div>
            <div className="panel-head-right">
              {canEdit && (
                <button
                  className="btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah Kerja Sama
                </button>
              )}
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari jurusan atau nama mitra..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mitra</th>
                  <th>Jurusan Terkait</th>
                  <th>Deskripsi</th>
                  <th>Tanggal</th>
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row-text">
                      Belum ada data kerja sama.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          {imageUrl(item.logo_mitra) ? (
                            <img
                              src={imageUrl(item.logo_mitra)}
                              alt={item.nama_mitra}
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                            >
                              {item.nama_mitra?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="user-name">{item.nama_mitra}</span>
                        </div>
                      </td>
                      <td>{item.jurusan_terkait}</td>
                      <td className="desc-cell">{item.deskripsi}</td>
                      <td>{formatDate(item.tanggal_kerjasama)}</td>
                      <td>
                        {canDelete && (
                          <button
                            className="btn-outline"
                            onClick={() => handleDelete(item)}
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="panel-head" style={{ marginBottom: "16px" }}>
                  <h3>Tambah Kerja Sama</h3>
                  <button
                    className="sq-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  {formError && (
                    <div className="banner-error" role="alert">
                      {formError}
                    </div>
                  )}
                  <input
                    type="text"
                    name="jurusan_terkait"
                    placeholder="Jurusan Terkait (mis. RPL)"
                    className="custom-input"
                    required
                  />
                  <input
                    type="text"
                    name="nama_mitra"
                    placeholder="Nama Mitra (mis. UBIG, Kominfo)"
                    className="custom-input"
                    required
                    style={{ marginTop: "10px" }}
                  />
                  <textarea
                    name="deskripsi"
                    placeholder="Deskripsi kerja sama"
                    className="custom-input"
                    rows="4"
                    required
                    style={{ marginTop: "10px" }}
                  />
                  <input
                    type="date"
                    name="tanggal_kerjasama"
                    className="custom-input"
                    style={{ marginTop: "10px" }}
                  />
                  <label className="file-label" style={{ marginTop: "10px" }}>
                    <span>Logo Mitra (opsional):</span>
                    <input
                      type="file"
                      name="logo_mitra"
                      accept="image/*"
                      className="file-input"
                    />
                  </label>
                  <div className="review-actions" style={{ marginTop: "14px" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
