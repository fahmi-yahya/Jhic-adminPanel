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
  building: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
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

export default function LingkunganPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [lingkunganList, setLingkunganList] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchLingkungan = () => {
    setLoading(true);
    setError("");
    apiFetch("/lingkungan")
      .then((data) =>
        setLingkunganList(Array.isArray(data) ? data : data?.data || []),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLingkungan();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "lingkungan". Selama currentUser belum kebaca
  // (authChecked masih false), ketiganya default false — tombol
  // Tambah/Hapus baru muncul setelah data user beneran ada.
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.lingkungan?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.lingkungan?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.lingkungan?.del;

  // Sidebar menyembunyikan link ke halaman ini kalau tidak ada akses, tapi
  // itu cuma sembunyiin menu — kalau org buka URL-nya langsung, halaman
  // ini tetap harus nolak sendiri.
  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lingkunganList;
    return lingkunganList.filter((l) =>
      (l.nama_lingkungan || "").toLowerCase().includes(q),
    );
  }, [lingkunganList, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // name pada tiap input cocok dengan validasi
      // LandingPageController::storeLingkungan.
      const formData = new FormData(e.target);
      await apiFetch("/lingkungan", { method: "POST", body: formData });
      setShowModal(false);
      fetchLingkungan();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus data "${item.nama_lingkungan}"?`)) return;
    try {
      await apiFetch(`/lingkungan/${item.id}`, { method: "DELETE" });
      fetchLingkungan();
    } catch (err) {
      setError(err.message);
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
        <div className="panel lingkungan-panel page-modern">
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
                {Icon.building}
                <span>Total Fasilitas</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{lingkunganList.length}</div>
              </div>
            </div>
          </div>

          {/* Header Halaman */}
          <div className="panel-head">
            <div>
              <h3>Kelola Lingkungan & Fasilitas</h3>
              <p>Daftar fasilitas, sarana, dan prasarana lingkungan sekolah.</p>
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
                  Tambah Fasilitas
                </button>
              )}
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama fasilitas..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Tabel Data Lingkungan */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fasilitas / Lingkungan</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="empty-row-text">
                      Memuat data...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-row-text">
                      Belum ada data lingkungan/fasilitas. Klik tombol Tambah di
                      atas.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          {imageUrl(item.img_lingkungan) ? (
                            <img
                              src={imageUrl(item.img_lingkungan)}
                              alt={item.nama_lingkungan}
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                            >
                              {item.nama_lingkungan?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="task-cell">
                            {item.nama_lingkungan}
                          </span>
                        </div>
                      </td>
                      <td className="desc-cell">{item.deskripsi}</td>
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
              <span>fasilitas per halaman</span>
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

          {/* Modal Form Tambah Lingkungan */}
          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="panel-head" style={{ marginBottom: "16px" }}>
                  <h3>Tambah Fasilitas / Lingkungan</h3>
                  <button
                    className="sq-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="lingkungan-form">
                  {formError && (
                    <div className="banner-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <input
                    type="text"
                    name="nama_lingkungan"
                    placeholder="Nama Fasilitas / Lingkungan"
                    className="custom-input"
                    required
                  />

                  <textarea
                    name="deskripsi"
                    placeholder="Deskripsi Fasilitas"
                    className="custom-input"
                    rows="4"
                    required
                  />

                  <label className="file-label">
                    <span>Foto Fasilitas / Lingkungan:</span>
                    <input
                      type="file"
                      name="img_lingkungan"
                      accept="image/*"
                      className="file-input"
                      required
                    />
                  </label>

                  <div className="review-actions" style={{ marginTop: "12px" }}>
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
                      {submitting ? "Menyimpan..." : "Simpan Data"}
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
