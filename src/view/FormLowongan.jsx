import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import "../css/FormLowonganBkk.css";

const TIPE_PEKERJAAN_OPTIONS = [
  "Tetap",
  "Kontrak",
  "Paruh Waktu",
  "Magang",
  "Freelance",
];

export default function FormLowonganBkk() {
  const initialFormData = {
    nama_perusahaan: "",
    penanggung_jawab: "",
    email: "",
    no_telepon: "",
    alamat_perusahaan: "",
    deskripsi_perusahaan: "",
    posisi_dibutuhkan: "",
    tipe_pekerjaan: "Tetap",
    kualifikasi: "",
    gaji: "",
    batas_lamar: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      await apiFetch("/bkk", {
        method: "POST",
        body: formData,
      });

      setSuccessMessage(
        "Pengajuan lowongan berhasil dikirim! Menunggu verifikasi dari pihak BKK.",
      );
      setFormData(initialFormData);
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        alert(
          error.message ||
            "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bkk-form-container">
      <h2 className="bkk-form-title">Form Formulir Lowongan Kerja BKK</h2>
      <p className="bkk-form-subtitle">
        Isi data perusahaan dan detail lowongan kerja di bawah ini. Pengajuan
        Anda akan diverifikasi oleh tim BKK.
      </p>

      {/* Alert Sukses */}
      {successMessage && <div className="alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        {/* BAGIAN 1: INFORMASI PERUSAHAAN */}
        <div className="form-section">
          <h3 className="section-title">1. Informasi Perusahaan</h3>

          <div className="form-grid">
            {/* Nama Perusahaan */}
            <div className="form-group">
              <label className="form-label">Nama Perusahaan *</label>
              <input
                type="text"
                name="nama_perusahaan"
                value={formData.nama_perusahaan}
                onChange={handleChange}
                className={`form-control ${errors.nama_perusahaan ? "is-invalid" : ""}`}
                placeholder="PT. Example Indonesia"
              />
              {errors.nama_perusahaan && (
                <span className="error-text">{errors.nama_perusahaan[0]}</span>
              )}
            </div>

            {/* Penanggung Jawab */}
            <div className="form-group">
              <label className="form-label">Penanggung Jawab / HRD *</label>
              <input
                type="text"
                name="penanggung_jawab"
                value={formData.penanggung_jawab}
                onChange={handleChange}
                className={`form-control ${errors.penanggung_jawab ? "is-invalid" : ""}`}
                placeholder="Nama Penanggung Jawab"
              />
              {errors.penanggung_jawab && (
                <span className="error-text">{errors.penanggung_jawab[0]}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder="hrd@perusahaan.com"
              />
              {errors.email && (
                <span className="error-text">{errors.email[0]}</span>
              )}
            </div>

            {/* No Telepon */}
            <div className="form-group">
              <label className="form-label">No. Telepon / WhatsApp *</label>
              <input
                type="text"
                name="no_telepon"
                value={formData.no_telepon}
                onChange={handleChange}
                className={`form-control ${errors.no_telepon ? "is-invalid" : ""}`}
                placeholder="081234567890"
              />
              {errors.no_telepon && (
                <span className="error-text">{errors.no_telepon[0]}</span>
              )}
            </div>
          </div>

          {/* Alamat Perusahaan */}
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label className="form-label">Alamat Perusahaan</label>
            <textarea
              name="alamat_perusahaan"
              rows="2"
              value={formData.alamat_perusahaan}
              onChange={handleChange}
              className="form-control"
              placeholder="Alamat lengkap perusahaan..."
            ></textarea>
          </div>

          {/* Deskripsi Perusahaan */}
          <div className="form-group">
            <label className="form-label">Deskripsi Perusahaan</label>
            <textarea
              name="deskripsi_perusahaan"
              rows="3"
              value={formData.deskripsi_perusahaan}
              onChange={handleChange}
              className="form-control"
              placeholder="Profil singkat perusahaan..."
            ></textarea>
          </div>
        </div>

        {/* BAGIAN 2: DETAIL LOWONGAN */}
        <div className="form-section">
          <h3 className="section-title">2. Detail Lowongan Pekerjaan</h3>

          <div className="form-grid">
            {/* Posisi Dibutuhkan */}
            <div className="form-group">
              <label className="form-label">Posisi Dibutuhkan *</label>
              <input
                type="text"
                name="posisi_dibutuhkan"
                value={formData.posisi_dibutuhkan}
                onChange={handleChange}
                className={`form-control ${errors.posisi_dibutuhkan ? "is-invalid" : ""}`}
                placeholder="Contoh: Web Developer, Staff Admin"
              />
              {errors.posisi_dibutuhkan && (
                <span className="error-text">
                  {errors.posisi_dibutuhkan[0]}
                </span>
              )}
            </div>

            {/* Tipe Pekerjaan */}
            <div className="form-group">
              <label className="form-label">Tipe Pekerjaan *</label>
              <select
                name="tipe_pekerjaan"
                value={formData.tipe_pekerjaan}
                onChange={handleChange}
                className={`form-control ${errors.tipe_pekerjaan ? "is-invalid" : ""}`}
              >
                {TIPE_PEKERJAAN_OPTIONS.map((tipe) => (
                  <option key={tipe} value={tipe}>
                    {tipe}
                  </option>
                ))}
              </select>
              {errors.tipe_pekerjaan && (
                <span className="error-text">{errors.tipe_pekerjaan[0]}</span>
              )}
            </div>

            {/* Gaji */}
            <div className="form-group">
              <label className="form-label">Gaji (Opsional)</label>
              <input
                type="text"
                name="gaji"
                value={formData.gaji}
                onChange={handleChange}
                className="form-control"
                placeholder="Contoh: Rp 3.000.000 - Rp 5.000.000 / Negosiasi"
              />
            </div>

            {/* Batas Lamar */}
            <div className="form-group">
              <label className="form-label">Batas Akhir Pelamaran</label>
              <input
                type="date"
                name="batas_lamar"
                value={formData.batas_lamar}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          {/* Kualifikasi */}
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label className="form-label">Kualifikasi / Persyaratan *</label>
            <textarea
              name="kualifikasi"
              rows="4"
              value={formData.kualifikasi}
              onChange={handleChange}
              className={`form-control ${errors.kualifikasi ? "is-invalid" : ""}`}
              placeholder="Sebutkan persyaratannya, misalnya:&#10;- Minimal SMK/D3/S1&#10;- Menguasai React JS&#10;- Mampu bekerja dalam tim"
            ></textarea>
            {errors.kualifikasi && (
              <span className="error-text">{errors.kualifikasi[0]}</span>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Mengirim..." : "Kirim Pengajuan Lowongan"}
          </button>
        </div>
      </form>
    </div>
  );
}
