import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/BeritaPage.css";
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
  news: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9a1 1 0 0 1 1-1h3" />
      <path d="M10 6h6M10 10h6M10 14h4" />
    </svg>
  ),
  eye: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

// Bangun URL gambar dari path relatif yang disimpan backend (mis.
// "imgBerita/xxx.jpg") ke URL publik lewat symlink `storage/` Laravel.
// PENTING: symlink itu harus sudah dibuat sekali lewat `php artisan storage:link`,
// kalau belum, gambar tidak akan muncul (404).
function imageUrl(path) {
  return path ? `${APP_BASE}/storage/${path}` : null;
}

export default function BeritaPage() {
  const [showModal, setShowModal] = useState(false);
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(4);

  const fetchBerita = () => {
    setLoading(true);
    setError("");
    apiFetch("/berita")
      .then((data) =>
        setBeritaList(Array.isArray(data) ? data : data?.data || []),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBerita();
    getCurrentUser()
      .then((u) => {
        setCurrentUserName(u?.name || "");
        setCurrentUser(u);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "berita". Selama currentUser belum kebaca (authChecked
  // masih false), ketiganya default false — tombol Tambah/Hapus baru
  // muncul setelah data user beneran ada, bukan sebelum itu.
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.berita?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.berita?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.berita?.del;

  // Sidebar memang menyembunyikan link ke halaman ini kalau tidak ada
  // akses, tapi itu cuma sembunyiin menu — kalau org buka URL-nya
  // langsung, halaman ini tetap harus nolak sendiri.
  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  // Backend belum punya kolom "kategori" (lihat validasi storeBerita di
  // LandingPageController) — nilai ini tetap dikirim tiap submit supaya
  // begitu kolomnya ditambahkan nanti, filter ini otomatis jalan. Sampai
  // saat itu, semua berita akan tampil sebagai "Umum".
  const stats = useMemo(() => {
    const total = beritaList.length;
    const totalViews = beritaList.reduce((sum, b) => sum + (b.views || 0), 0);
    const prestasi = beritaList.filter((b) => b.kategori === "Prestasi").length;
    return { total, totalViews, prestasi };
  }, [beritaList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return beritaList.filter((b) => {
      const matchQuery = !q || (b.judul_berita || "").toLowerCase().includes(q);
      const matchKategori =
        kategoriFilter === "all" || b.kategori === kategoriFilter;
      return matchQuery && matchKategori;
    });
  }, [beritaList, query, kategoriFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // Form-nya "uncontrolled" — tiap input punya `name` yang sama persis
      // dengan field yang divalidasi LandingPageController::storeBerita,
      // jadi FormData(e.target) sudah otomatis cocok tanpa state manual.
      const formData = new FormData(e.target);
      await apiFetch("/berita", { method: "POST", body: formData });
      setShowModal(false);
      fetchBerita();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus berita "${item.judul_berita}"?`)) return;
    try {
      await apiFetch(`/berita/${item.id}`, { method: "DELETE" });
      fetchBerita();
    } catch (err) {
      setError(err.message);
    }
  }

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
        <div className="berita-container page-modern">
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
                {Icon.news}
                <span>Total Berita</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.eye}
                <span>Total Views</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.totalViews}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.news}
                <span>Kategori Prestasi</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.prestasi}</div>
              </div>
            </div>
          </div>

          {/* Top Header */}
          <div className="panel-head">
            <div>
              <h3>Kelola Berita & Artikel</h3>
              <p>
                Publikasikan pengumuman dan liputan kegiatan terbaru sekolah.
              </p>
            </div>
            {canEdit && (
              <button
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tulis Berita Baru
              </button>
            )}
          </div>

          <div className="toolbar">
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari judul berita..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Kategori</span>
              {["all", "Kegiatan", "Prestasi", "Pengumuman"].map((id) => (
                <button
                  key={id}
                  className={`filter-chip${kategoriFilter === id ? " active" : ""}`}
                  onClick={() => {
                    setKategoriFilter(id);
                    setPage(1);
                  }}
                >
                  {id === "all" ? "Semua" : id}
                </button>
              ))}
            </div>
          </div>

          {/* Grid List Berita */}
          <div className="berita-grid">
            {loading ? (
              <p className="empty-row-text">Memuat berita...</p>
            ) : paginated.length === 0 ? (
              <p className="empty-row-text">Tidak ada berita yang cocok.</p>
            ) : (
              paginated.map((item) => (
                <div key={item.id} className="berita-card">
                  <div className="berita-thumb">
                    {imageUrl(item.image) ? (
                      <img src={imageUrl(item.image)} alt={item.judul_berita} />
                    ) : (
                      <div className="berita-thumb-placeholder">
                        {Icon.news}
                      </div>
                    )}
                    <span className="berita-badge">
                      {item.kategori || "Umum"}
                    </span>
                  </div>
                  <div className="berita-content">
                    <div className="berita-meta">
                      <span>{item.tanggal_terbit}</span>
                      <span>•</span>
                      <span>{item.views || 0} views</span>
                    </div>
                    <h4 className="berita-title">{item.judul_berita}</h4>
                    <p className="berita-desc">{item.deskripsi}</p>
                    <div className="berita-footer">
                      <span className="author-name">By {item.penulis}</span>
                      <div className="card-actions">
                        {canDelete && (
                          <button
                            className="sq-btn btn-danger-sq"
                            title="Hapus"
                            onClick={() => handleDelete(item)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
              <span>berita per halaman</span>
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

          {/* Modal Form */}
          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="panel-head">
                  <h3>Tambah Berita Baru</h3>
                  <button
                    className="sq-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="custom-form">
                  {formError && (
                    <div className="banner-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <input
                    type="text"
                    name="penulis"
                    placeholder="Nama Penulis"
                    className="custom-input"
                    defaultValue={currentUserName}
                    required
                  />
                  <input
                    type="text"
                    name="judul_berita"
                    placeholder="Judul Berita / Artikel"
                    className="custom-input"
                    required
                  />
                  <select
                    name="kategori"
                    className="custom-input"
                    defaultValue="Kegiatan"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Prestasi">Prestasi</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                  <input
                    type="date"
                    name="tanggal_terbit"
                    className="custom-input"
                    required
                  />
                  <textarea
                    name="deskripsi"
                    placeholder="Isi berita secara rinci..."
                    className="custom-input"
                    rows="4"
                    required
                  />
                  <label className="file-label">
                    <span>Upload Banner Gambar:</span>
                    <input
                      type="file"
                      name="image"
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
                      {submitting ? "Menyimpan..." : "Terbitkan Berita"}
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
