import React, { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/PesanPage.css";
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
      <path d="m22 6-10 7L2 6" />
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

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PesanPage() {
  const [pesanList, setPesanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchPesan = () => {
    setLoading(true);
    setError("");
    apiFetch("/pesan")
      .then((data) =>
        setPesanList(Array.isArray(data) ? data : data?.data || []),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPesan();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Hak akses modul "pesan". Selama currentUser belum kebaca
  // (authChecked masih false), ketiganya default false — tombol
  // Tambah/Hapus baru muncul setelah data user beneran ada.
  const canView =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pesan?.view;
  const canEdit =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pesan?.edit;
  const canDelete =
    currentUser?.role === "superadmin" ||
    !!currentUser?.permissions?.pesan?.del;

  // Sidebar menyembunyikan link ke halaman ini kalau tidak ada akses, tapi
  // itu cuma sembunyiin menu — kalau org buka URL-nya langsung, halaman
  // ini tetap harus nolak sendiri.
  useEffect(() => {
    if (authChecked && !canView) {
      window.location.href = "/index";
    }
  }, [authChecked, canView]);

  const stats = useMemo(() => ({ total: pesanList.length }), [pesanList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pesanList;
    return pesanList.filter(
      (p) =>
        (p.nama_lengkap || "").toLowerCase().includes(q) ||
        (p.alamat_email || "").toLowerCase().includes(q) ||
        (p.pesan || "").toLowerCase().includes(q),
    );
  }, [pesanList, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus pesan dari "${item.nama_lengkap}"?`)) return;
    try {
      await apiFetch(`/pesan/${item.id}`, { method: "DELETE" });
      fetchPesan();
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
        <div className="panel pesan-panel page-modern">
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
                {Icon.mail}
                <span>Total Pesan</span>
              </div>
              <div className="stat-bottom">
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h3>Pesan Masuk</h3>
              <p>Daftar pesan pertanyaan dari formulir kontak landing page.</p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: "16px" }}>
            <div className="search">
              {Icon.search}
              <input
                type="text"
                placeholder="Cari nama, email, atau isi pesan..."
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
                  <th>Pengirim</th>
                  <th>Pesan</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-row-text">
                      Memuat pesan...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-row-text">
                      Tidak ada pesan yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className="user-cell">
                          <div
                            className={`avatar ${AVATAR_CLASSES[idx % AVATAR_CLASSES.length]}`}
                          >
                            {initials(item.nama_lengkap)}
                          </div>
                          <div>
                            <div className="user-name">{item.nama_lengkap}</div>
                            <div className="user-email">
                              {item.alamat_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="desc-cell">{item.pesan}</td>
                      <td>{formatDate(item.created_at)}</td>
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
              <span>pesan per halaman</span>
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
        </div>
      </main>
    </div>
  );
}
