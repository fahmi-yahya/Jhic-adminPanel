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
  box: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
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
const KATEGORI_OPTIONS = ["Produk", "Jasa"];

function imageUrl(path) {
  return path ? `${APP_BASE}/storage/${path}` : null;
}

export default function ProdukPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchList = () => {
    setLoading(true);
    setError("");
    apiFetch("/produk")
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
    !!currentUser?.permissions?.produk?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.produk?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.produk?.del;

  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const stats = useMemo(() => {
    const total = list.length;
    const produk = list.filter((p) => p.kategori === "Produk").length;
    const jasa = list.filter((p) => p.kategori === "Jasa").length;
    return { total, produk, jasa };
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      const matchQuery = !q || (p.nama_produk || "").toLowerCase().includes(q);
      const matchKategori =
        kategoriFilter === "all" || p.kategori === kategoriFilter;
      return matchQuery && matchKategori;
    });
  }, [list, query, kategoriFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const formData = new FormData(e.target);
      await apiFetch("/produk", { method: "POST", body: formData });
      setShowModal(false);
      fetchList();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus "${item.nama_produk}"?`)) return;
    try {
      await apiFetch(`/produk/${item.id}`, { method: "DELETE" });
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
                {Icon.box}
                <span>Total</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.box}
                <span>Produk</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.produk}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.box}
                <span>Jasa</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.jasa}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>Produk & Jasa Unggulan</h3>
              <p>Katalog produk/jasa hasil karya siswa yang ditawarkan BLUD.</p>
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
                  Tambah Produk/Jasa
                </button>
              )}
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama produk/jasa..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Kategori</span>
              {["all", ...KATEGORI_OPTIONS].map((id) => (
                <button
                  key={id}
                  className={`filter-chip${kategoriFilter === id ? " active" : ""}`}
                  onClick={() => setKategoriFilter(id)}
                >
                  {id === "all" ? "Semua" : id}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produk/Jasa</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-row-text">
                      Memuat data...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-row-text">
                      Belum ada produk/jasa.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          {imageUrl(item.gambar) ? (
                            <img
                              src={imageUrl(item.gambar)}
                              alt={item.nama_produk}
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                            >
                              {item.nama_produk?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="user-name">{item.nama_produk}</div>
                            <div className="user-email">{item.deskripsi}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${item.kategori === "Jasa" ? "status-progress" : "status-neutral"}`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td>{item.harga || "-"}</td>
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
                  <h3>Tambah Produk/Jasa</h3>
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
                    name="nama_produk"
                    placeholder="Nama Produk/Jasa"
                    className="custom-input"
                    required
                  />
                  <select
                    name="kategori"
                    className="custom-input"
                    defaultValue="Produk"
                    style={{ marginTop: "10px" }}
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="deskripsi"
                    placeholder="Deskripsi"
                    className="custom-input"
                    rows="3"
                    required
                    style={{ marginTop: "10px" }}
                  />
                  <input
                    type="text"
                    name="harga"
                    placeholder="Harga (opsional, mis. Rp 150.000 / Hubungi kami)"
                    className="custom-input"
                    style={{ marginTop: "10px" }}
                  />
                  <label className="file-label" style={{ marginTop: "10px" }}>
                    <span>Gambar (opsional):</span>
                    <input
                      type="file"
                      name="gambar"
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
