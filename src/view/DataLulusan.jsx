import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../css/index.css";
import "../css/admin-modern.css";
import "../css/LulusanPage.css";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
import Sidebar from "./Sidebar";

const Icon = {
  grad: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 10-10-5L2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
    </svg>
  ),
  upload: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  ),
  file: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
};

// Urutan & warna 4 kategori ringkasan — dipakai di stats-grid dan di
// breakdown per tahun. Samakan dengan App\Models\Lulusan::kategori() di
// backend kalau mau nambah/ubah kategori.
const KATEGORI = [
  { id: "bekerja", label: "Bekerja", color: "var(--blue)" },
  { id: "wirausaha", label: "Wirausaha", color: "var(--orange)" },
  { id: "kuliah", label: "Kuliah", color: "var(--indigo)" },
  { id: "belum_kerja", label: "Belum Kerja", color: "var(--pink)" },
];

export default function LulusanPage() {
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");

  // ---- Tabel detail per-siswa (beda dari tabel ringkasan per-tahun di
  // atas) — ambil dari GET /api/lulusan yang sudah dukung pagination di
  // LulusanController::index().
  const [rows, setRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState("");
  const [rowsPage, setRowsPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rowsMeta, setRowsMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Sama seperti halaman Berita/Jurusan/dll — akses halaman ini ikut
  // permission modul "lulusan" (daftarkan modul ini juga di MODULES
  // management.jsx kalau mau Admin/Jurusan bisa diberi akses).
  const isSuperAdmin = currentUser?.role === "superadmin";
  const modulePerms = currentUser?.permissions?.lulusan || {};
  const canView = isSuperAdmin || !!modulePerms.view;
  const canUpload = isSuperAdmin || !!modulePerms.edit;

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    setStatsError("");
    apiFetch("/lulusan/stats")
      .then(setStats)
      .catch((err) => setStatsError(err.message))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (!authChecked || !canView) return;
    fetchStats();
  }, [authChecked, canView, fetchStats]);

  const fetchRows = useCallback(() => {
    setRowsLoading(true);
    setRowsError("");
    const params = new URLSearchParams();
    if (yearFilter !== "all") params.set("tahun", yearFilter);
    params.set("page", String(rowsPage));
    params.set("per_page", String(rowsPerPage));

    apiFetch(`/lulusan?${params.toString()}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setRows(list);
        setRowsMeta({
          currentPage: data?.current_page ?? 1,
          lastPage: data?.last_page ?? 1,
          total: data?.total ?? list.length,
          from: data?.from ?? (list.length ? 1 : 0),
          to: data?.to ?? list.length,
        });
      })
      .catch((err) => setRowsError(err.message))
      .finally(() => setRowsLoading(false));
  }, [yearFilter, rowsPage, rowsPerPage]);

  useEffect(() => {
    if (!authChecked || !canView) return;
    fetchRows();
  }, [authChecked, canView, fetchRows]);

  // Balik ke halaman 1 setiap kali filter tahun ATAU jumlah baris per
  // halaman berubah, supaya tidak "nyangkut" di halaman yang jadi tidak
  // valid lagi.
  useEffect(() => {
    setRowsPage(1);
  }, [yearFilter, rowsPerPage]);

  // Daftar tahun buat filter — otomatis ngikut data yang sudah pernah
  // di-upload (bukan hardcode), diurutkan dari yang terbaru.
  const availableYears = useMemo(
    () => (stats?.per_tahun || []).map((r) => r.tahun).sort((a, b) => b - a),
    [stats],
  );

  // Reset ke "Semua Tahun" kalau tahun yang sedang dipilih ternyata sudah
  // tidak ada lagi di data (mis. belum ada upload sama sekali).
  useEffect(() => {
    if (yearFilter !== "all" && !availableYears.includes(Number(yearFilter))) {
      setYearFilter("all");
    }
  }, [availableYears, yearFilter]);

  const displayedRows = useMemo(() => {
    if (!stats) return [];
    if (yearFilter === "all") return stats.per_tahun;
    return stats.per_tahun.filter(
      (r) => String(r.tahun) === String(yearFilter),
    );
  }, [stats, yearFilter]);

  // Kartu ringkasan ikut berubah sesuai tahun yang difilter — kalau
  // "Semua Tahun", pakai total keseluruhan dari backend; kalau 1 tahun
  // dipilih, pakai angka baris tahun itu saja (tidak perlu fetch ulang,
  // datanya sudah ada di stats.per_tahun).
  const displayedTotals = useMemo(() => {
    if (!stats) return null;
    if (yearFilter === "all") return stats.total;
    const row = stats.per_tahun.find(
      (r) => String(r.tahun) === String(yearFilter),
    );
    if (!row) return stats.total;
    return KATEGORI.reduce((acc, k) => {
      acc[k.id] = row[k.id] ?? 0;
      return acc;
    }, {});
  }, [stats, yearFilter]);

  function pickFile(file) {
    if (!file) return;
    const okExt = /\.(xlsx|xls)$/i.test(file.name);
    if (!okExt) {
      setUploadError("File harus berformat .xlsx atau .xls");
      return;
    }
    setUploadError("");
    setUploadResult(null);
    setSelectedFile(file);
  }

  function openUploadModal() {
    setSelectedFile(null);
    setUploadError("");
    setUploadResult(null);
    setShowUploadModal(true);
  }

  function closeUploadModal() {
    setShowUploadModal(false);
  }

  async function handleUpload() {
    if (!selectedFile || !canUpload) return;
    setUploading(true);
    setUploadError("");
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await apiFetch("/lulusan/import", {
        method: "POST",
        body: formData,
      });
      setUploadResult(res);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchStats(); // refresh angka & daftar tahun setelah import sukses
      setRowsPage(1);
      fetchRows(); // refresh tabel detail per-siswa juga
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="knowvio-root" data-theme={theme}>
      <Sidebar
        activeNav="lulusan"
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

          {!authChecked ? (
            <div className="um-empty">Memuat data akun kamu...</div>
          ) : !canView ? (
            <section className="panel um-locked">
              <div className="um-locked-icon">{Icon.grad}</div>
              <h2>Akses dibatasi</h2>
              <p>
                Kamu belum diberi akses ke halaman Data Lulusan. Hubungi{" "}
                <strong>Super Admin</strong> untuk minta akses.
              </p>
            </section>
          ) : (
            <>
              <div className="panel-head">
                <div>
                  <h3>Data Lulusan (Tracer Study)</h3>
                  <p>
                    Upload file excel per tahun lulus untuk melihat sebaran
                    Bekerja, Wirausaha, Kuliah, dan Belum Kerja.
                  </p>
                </div>
                {canUpload && (
                  <div className="panel-head-right">
                    <button className="btn-primary" onClick={openUploadModal}>
                      {Icon.upload} Upload Data
                    </button>
                  </div>
                )}
              </div>

              {/* ---- Stats Grid ---- */}
              {statsError && (
                <div className="banner-error" role="alert">
                  {statsError}
                </div>
              )}

              {statsLoading ? (
                <div className="um-empty">Memuat statistik...</div>
              ) : stats ? (
                <>
                  <div className="stats-grid">
                    {KATEGORI.map((k) => (
                      <div className="stat-card" key={k.id}>
                        <div className="stat-top">
                          <span
                            className="topic-icon"
                            style={{ background: k.color }}
                          >
                            {Icon.grad}
                          </span>
                          <span>{k.label}</span>
                        </div>
                        <div className="stat-bottom">
                          <div className="stat-value">
                            {displayedTotals?.[k.id] ?? 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ---- Filter tahun — otomatis ngikut tahun yang sudah di-upload ---- */}
                  {availableYears.length > 0 && (
                    <div className="toolbar" style={{ marginTop: "16px" }}>
                      <div className="filter-group">
                        <span className="filter-label">Tahun</span>
                        <button
                          className={`filter-chip${yearFilter === "all" ? " active" : ""}`}
                          onClick={() => setYearFilter("all")}
                        >
                          Semua Tahun
                        </button>
                        {availableYears.map((y) => (
                          <button
                            key={y}
                            className={`filter-chip${String(yearFilter) === String(y) ? " active" : ""}`}
                            onClick={() => setYearFilter(y)}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---- Breakdown per tahun ---- */}
                  <div className="table-wrap" style={{ marginTop: "16px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Tahun Lulus</th>
                          <th>Total Lulusan</th>
                          {KATEGORI.map((k) => (
                            <th key={k.id}>{k.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2 + KATEGORI.length}
                              className="empty-row-text"
                            >
                              {stats.per_tahun.length === 0
                                ? 'Belum ada data. Klik "Upload Data" di atas dulu.'
                                : "Tidak ada data untuk tahun ini."}
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((row) => (
                            <tr key={row.tahun}>
                              <td>
                                <span className="task-cell">{row.tahun}</span>
                              </td>
                              <td>{row.total_lulusan}</td>
                              {KATEGORI.map((k) => (
                                <td key={k.id}>{row[k.id] ?? 0}</td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ---- Tabel Detail Lulusan (per-siswa, dengan pagination) ---- */}
                  <div className="panel-head" style={{ marginTop: "24px" }}>
                    <div>
                      <h3>Daftar Lulusan</h3>
                      <p>Data per siswa dari hasil import excel.</p>
                    </div>
                  </div>

                  {rowsError && (
                    <div className="banner-error" role="alert">
                      {rowsError}
                    </div>
                  )}

                  <div className="table-wrap" style={{ marginTop: "12px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>NISN</th>
                          <th>Nama</th>
                          <th>Tahun Lulus</th>
                          <th>Kompetensi Keahlian</th>
                          <th>Usia</th>
                          <th>Jenis Kelamin</th>
                          <th>Status Aktivitas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsLoading && (
                          <tr>
                            <td colSpan={7} className="empty-row-text">
                              Memuat data...
                            </td>
                          </tr>
                        )}
                        {!rowsLoading && rows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="empty-row-text">
                              Tidak ada data lulusan untuk filter ini.
                            </td>
                          </tr>
                        )}
                        {!rowsLoading &&
                          rows.map((r) => (
                            <tr key={r.id}>
                              <td>{r.nisn || "-"}</td>
                              <td>
                                <span className="task-cell">
                                  {r.nama || "-"}
                                </span>
                              </td>
                              <td>{r.tahun_lulus}</td>
                              <td>{r.komp_keahlian || "-"}</td>
                              {/* Tabel `lulusans` tidak punya kolom usia/tanggal
                                  lahir, jadi ini akan selalu kosong sampai
                                  kolomnya ditambahkan di backend. */}
                              <td>{r.usia ?? "Tidak tersedia"}</td>
                              <td>{r.jenis_kelamin || "-"}</td>
                              <td>{r.status_aktifitas || "-"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className="pagination-footer"
                    style={{ marginTop: "12px" }}
                  >
                    <div className="pagination-perpage">
                      <span>Tampilkan</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setRowsPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>lulusan per halaman</span>
                    </div>
                    <span className="um-pagination-info">
                      {rowsMeta.total > 0
                        ? `Menampilkan ${rowsMeta.from}–${rowsMeta.to} dari ${rowsMeta.total} lulusan`
                        : "Tidak ada data"}
                    </span>
                    <div className="um-pagination-controls">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setRowsPage((p) => Math.max(1, p - 1))}
                        disabled={rowsMeta.currentPage <= 1 || rowsLoading}
                      >
                        Previous
                      </button>
                      <span className="um-pagination-page">
                        Page {rowsMeta.currentPage} of{" "}
                        {Math.max(1, rowsMeta.lastPage)}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          setRowsPage((p) => Math.min(rowsMeta.lastPage, p + 1))
                        }
                        disabled={
                          rowsMeta.currentPage >= rowsMeta.lastPage ||
                          rowsLoading
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </main>

      {/* ---- Modal Upload Data ---- */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={closeUploadModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head" style={{ marginBottom: "16px" }}>
              <h3>Upload Data Lulusan</h3>
              <button className="sq-btn" onClick={closeUploadModal}>
                ✕
              </button>
            </div>

            <div
              className={`upload-dropzone${dragOver ? " drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              {Icon.upload}
              <p className="upload-title">
                {selectedFile
                  ? selectedFile.name
                  : "Seret file excel ke sini, atau klik untuk pilih file"}
              </p>
              <p className="upload-hint">
                Format file sama seperti template "Tahun_Lulus_XXXX.xlsx" (sheet
                "Data Responden"). Maks. 10MB.
              </p>

              <div className="upload-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {Icon.file} Pilih File
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!selectedFile || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "Mengunggah..." : "Upload & Import"}
                </button>
              </div>

              {uploadError && (
                <div className="banner-error" role="alert">
                  {uploadError}
                </div>
              )}
              {uploadResult && (
                <div className="banner-success" role="status">
                  {uploadResult.message}
                </div>
              )}
            </div>

            {uploadResult && (
              <div className="review-actions" style={{ marginTop: "14px" }}>
                <button className="btn-secondary" onClick={closeUploadModal}>
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
