import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/PrestasiPage.css";
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
  trophy: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3a2 2 0 0 1-2 4M7 5H4a2 2 0 0 0 2 4" />
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

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function tingkatFromLomba(lomba = "") {
  const l = lomba.toLowerCase();
  if (l.includes("nasional")) return { text: "Nasional", cls: "status-danger" };
  if (l.includes("provinsi"))
    return { text: "Provinsi", cls: "status-progress" };
  return { text: "Kabupaten", cls: "status-neutral" };
}

function imageUrl(path) {
  return path ? `${APP_BASE}/storage/${path}` : null;
}

export default function PrestasiPage() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [prestasiList, setPrestasiList] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchPrestasi = () => {
    setLoading(true);
    setError("");
    apiFetch("/prestasi")
      .then((data) =>
        setPrestasiList(Array.isArray(data) ? data : data?.data || []),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrestasi();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "prestasi". Selama currentUser belum kebaca
  // (authChecked masih false), ketiganya default false — tombol
  // Tambah/Hapus baru muncul setelah data user beneran ada.
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.prestasi?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.prestasi?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.prestasi?.del;

  // Sidebar menyembunyikan link ke halaman ini kalau tidak ada akses, tapi
  // itu cuma sembunyiin menu — kalau org buka URL-nya langsung, halaman
  // ini tetap harus nolak sendiri.
  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const stats = useMemo(() => {
    const total = prestasiList.length;
    const nasional = prestasiList.filter((p) =>
      (p.lomba_diikuti || "").toLowerCase().includes("nasional"),
    ).length;
    const tahunIni = prestasiList.filter((p) =>
      (p.tanggal_terbit || "").startsWith("2026"),
    ).length;
    return { total, nasional, tahunIni };
  }, [prestasiList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prestasiList;
    return prestasiList.filter(
      (p) =>
        (p.judul_prestasi || "").toLowerCase().includes(q) ||
        (p.nama_siswa || "").toLowerCase().includes(q) ||
        (p.lomba_diikuti || "").toLowerCase().includes(q),
    );
  }, [prestasiList, query]);

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
      // name tiap input cocok dengan validasi
      // LandingPageController::storePrestasi.
      const formData = new FormData(e.target);
      await apiFetch("/prestasi", { method: "POST", body: formData });
      setShowModal(false);
      fetchPrestasi();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus prestasi "${item.judul_prestasi}"?`)) return;
    try {
      await apiFetch(`/prestasi/${item.id}`, { method: "DELETE" });
      fetchPrestasi();
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
        <div className="panel prestasi-panel page-modern">
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
                {Icon.trophy}
                <span>Total Prestasi</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.trophy}
                <span>Tingkat Nasional</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.nasional}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                {Icon.trophy}
                <span>Prestasi Tahun 2026</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.tahunIni}</div>
              </div>
            </div>
          </div>

          {/* Header Halaman */}
          <div className="panel-head">
            <div>
              <h3>Kelola Prestasi</h3>
              <p>Daftar pencapaian dan kejuaraan yang diraih oleh siswa.</p>
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
                  Tambah Prestasi
                </button>
              )}
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari judul, nama siswa, atau lomba..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Tabel Data Prestasi */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prestasi</th>
                  <th>Siswa</th>
                  <th>Tingkat</th>
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
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row-text">
                      Belum ada data prestasi. Klik tombol Tambah Prestasi di
                      atas.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => {
                    const tingkat = tingkatFromLomba(item.lomba_diikuti);
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="task-cell">
                            {item.judul_prestasi}
                          </span>
                          <div className="user-email">{item.lomba_diikuti}</div>
                        </td>
                        <td>
                          <div className="user-cell">
                            {imageUrl(item.img_prestasi) ? (
                              <img
                                src={imageUrl(item.img_prestasi)}
                                alt={item.nama_siswa}
                                className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                              >
                                {initials(item.nama_siswa)}
                              </div>
                            )}
                            <span>{item.nama_siswa}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${tingkat.cls}`}>
                            {tingkat.text}
                          </span>
                        </td>
                        <td>{item.tanggal_terbit}</td>
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
                    );
                  })
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
              <span>prestasi per halaman</span>
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

          {/* Modal Form Tambah Prestasi */}
          {showModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="panel-head" style={{ marginBottom: "16px" }}>
                  <h3>Tambah Data Prestasi</h3>
                  <button
                    className="sq-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="prestasi-form">
                  {formError && (
                    <div className="banner-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <input
                    type="text"
                    name="judul_prestasi"
                    placeholder="Judul Prestasi"
                    className="custom-input"
                    required
                  />

                  <input
                    type="text"
                    name="nama_siswa"
                    placeholder="Nama Siswa / Tim"
                    className="custom-input"
                    required
                  />

                  <input
                    type="text"
                    name="lomba_diikuti"
                    placeholder="Lomba yang Diikuti"
                    className="custom-input"
                    required
                  />

                  <input
                    type="date"
                    name="tanggal_terbit"
                    className="custom-input"
                    required
                  />

                  <label className="file-label">
                    <span>Foto Prestasi / Penyerahan Juara:</span>
                    <input
                      type="file"
                      name="img_prestasi"
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
                      {submitting ? "Menyimpan..." : "Simpan Prestasi"}
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
