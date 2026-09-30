import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/JurusanPage.css";
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
  book: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
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

export default function JurusanPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [jurusanList, setJurusanList] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchJurusan = () => {
    setLoading(true);
    setError("");
    apiFetch("/jurusan")
      .then((data) =>
        setJurusanList(Array.isArray(data) ? data : data?.data || []),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJurusan();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "jurusan". Selama currentUser belum kebaca
  // (authChecked masih false), ketiganya default false — tombol
  // Tambah/Hapus baru muncul setelah data user beneran ada.
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.jurusan?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.jurusan?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.jurusan?.del;

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
    if (!q) return jurusanList;
    return jurusanList.filter((j) =>
      (j.nama_jurusan || "").toLowerCase().includes(q),
    );
  }, [jurusanList, query]);

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
      // Input punya `name` yang cocok dengan validasi
      // LandingPageController::storeJurusan (nama_jurusan, deskripsi,
      // img_jurusan) — jadi cukup kirim FormData(e.target) apa adanya.
      const formData = new FormData(e.target);
      await apiFetch("/jurusan", { method: "POST", body: formData });
      setShowModal(false);
      fetchJurusan();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus jurusan "${item.nama_jurusan}"?`)) return;
    try {
      await apiFetch(`/jurusan/${item.id}`, { method: "DELETE" });
      fetchJurusan();
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
        <div className="panel jurusan-panel page-modern">
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
                {Icon.book}
                <span>Total Jurusan</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{jurusanList.length}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>Kelola Jurusan</h3>
              <p>Daftar kompetensi keahlian dan jurusan di sekolah.</p>
            </div>
            <div className="panel-head-right">
              <span className="count-chip">{filtered.length} Jurusan</span>
              {canEdit && (
                <button
                  className="btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  + Tambah Jurusan
                </button>
              )}
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama jurusan..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jurusan</th>
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
                      Belum ada data jurusan.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          {imageUrl(item.img_jurusan) ? (
                            <img
                              src={imageUrl(item.img_jurusan)}
                              alt={item.nama_jurusan}
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                            >
                              {item.nama_jurusan?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="user-name">{item.nama_jurusan}</div>
                          </div>
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
              <span>jurusan per halaman</span>
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

          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="panel-head">
                  <h3>Tambah Jurusan</h3>
                  <button
                    className="sq-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="jurusan-form">
                  {formError && (
                    <div className="banner-error" role="alert">
                      {formError}
                    </div>
                  )}
                  <input
                    type="text"
                    name="nama_jurusan"
                    placeholder="Nama Jurusan"
                    className="custom-input"
                    required
                  />
                  <textarea
                    name="deskripsi"
                    placeholder="Deskripsi Jurusan"
                    className="custom-input"
                    rows="4"
                    required
                  />
                  <label className="file-label">
                    <span>Foto Jurusan:</span>
                    <input
                      type="file"
                      name="img_jurusan"
                      accept="image/*"
                      className="file-input"
                      required
                    />
                  </label>
                  <div className="review-actions">
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
                      {submitting ? "Menyimpan..." : "Simpan Jurusan"}
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
