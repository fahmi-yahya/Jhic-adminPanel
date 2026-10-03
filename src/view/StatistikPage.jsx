import React, { useEffect, useState } from "react";
import "../css/index.css";
import "../css/admin-modern.css";
import { apiFetch } from "../lib/api";

const FIELDS = [
  { key: "jumlah_client", label: "Jumlah Client" },
  { key: "siswa_terlibat", label: "Siswa Terlibat" },
  { key: "produk_jasa", label: "Produk & Jasa" },
  { key: "jurusan_terlibat", label: "Jurusan Terlibat" },
  { key: "project", label: "Project" },
];

export default function StatistikPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/statistik")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key, value) {
    setSaved(false);
    setData((d) => ({ ...d, [key]: value === "" ? "" : Number(value) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(
        FIELDS.map((f) => [f.key, Number(data[f.key]) || 0]),
      );
      const updated = await apiFetch("/statistik", {
        method: "PUT",
        body: payload,
      });
      setData(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
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

      <div className="panel-head">
        <div>
          <h3>Statistik BLUD</h3>
          <p>Angka ini yang tampil di kartu statistik landing page.</p>
        </div>
      </div>

      {loading ? (
        <p className="empty-row-text">Memuat data...</p>
      ) : (
        <form onSubmit={handleSave} style={{ marginTop: "18px" }}>
          <div className="stats-grid">
            {FIELDS.map((f) => (
              <label className="form-group" key={f.key}>
                <span className="form-label">{f.label}</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={data?.[f.key] ?? 0}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="review-actions" style={{ marginTop: "18px" }}>
            {saved && (
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--am-ok, #1f8a4c)",
                  alignSelf: "center",
                }}
              >
                Tersimpan.
              </span>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
