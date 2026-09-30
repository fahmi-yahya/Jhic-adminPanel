import React, { useRef, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import "../css/login.css";
import logoSmakensa from "../assets/Logo.png";
import loginPhoto1 from "../assets/login-foto-1.jpeg";
import loginPhoto2 from "../assets/login-foto-2.jpeg";
import loginPhoto3 from "../assets/login-foto-3.jpeg";
import loginPhoto4 from "../assets/login-foto-4.jpeg";
import { login } from "../lib/api"; // sesuaikan path ke lokasi api.js kamu

const SLIDES = [loginPhoto1, loginPhoto2, loginPhoto3, loginPhoto4];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [remember, setRemember] = useState(false);

  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function HandleKetik(e) {
    const value = e.target.value;
    const name = e.target.name;

    setData({
      ...data,
      [name]: value,
    });
  }

  async function HandleLogin(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!captchaToken) {
      setErrorMessage("Silakan centang CAPTCHA terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      // login() dari lib/api.js mengurus fetch, cookie CSRF Sanctum, dan
      // parsing pesan error dari backend. Sesi login disimpan browser
      // lewat cookie httpOnly (bukan localStorage) — jadi TIDAK ada token
      // yang perlu/bisa disimpan manual di sini. Cookie itu otomatis ikut
      // terkirim di setiap request berikutnya lewat `credentials: "include"`.
      await login(data.email, data.password, captchaToken, remember);
      window.location.href = "/index";
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Terjadi kesalahan saat login.");
      // Token captcha v2 sekali pakai & sudah tidak valid setelah gagal —
      // reset juga tampilan widget-nya, supaya centang lama tidak menipu
      // (secara visual tetap kelihatan tercentang padahal tokennya mati).
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="login-page">
      {/* LEFT: LOGIN FORM */}
      <div className="login-left">
        <div className="login-logo-row">
          <img
            src={logoSmakensa}
            alt="Logo SMKN 1 Bondowoso"
            className="login-logo"
          />
        </div>

        <div className="login-heading-block">
          <h1 className="login-heading">Selamat Datang Kembali</h1>
          <p className="login-subtitle">
            Masuk ke akun SMAKENSA untuk melanjutkan aktivitas belajarmu.
          </p>
        </div>

        <div className="login-form-block">
          {errorMessage && (
            <div
              style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}
            >
              {errorMessage}
            </div>
          )}

          <form className="login-form" onSubmit={HandleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="Masukkan email"
                className="form-input"
                name="email"
                value={data.email}
                onChange={HandleKetik}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  className="form-input password-input"
                  name="password"
                  value={data.password}
                  onChange={HandleKetik}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="icon-sm" />
                  ) : (
                    <Eye className="icon-sm" />
                  )}
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat saya
              </label>
            </div>

            {/* ReCAPTCHA v2 dengan Site Key milikmu */}
            <div className="form-group" style={{ margin: "15px 0" }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: PHOTO SHOWCASE */}
      <div className="login-right">
        {SLIDES.map((src, index) => (
          <img
            key={index}
            src={src}
            alt=""
            className="login-slide"
            style={{ opacity: index === activeSlide ? 1 : 0 }}
          />
        ))}
        <div className="login-gradient-overlay" />

        <div className="login-caption">
          <h2 className="login-caption-title">
            Membentuk Karakter,
            <br />
            Membangun Masa Depan.
          </h2>
          <p className="login-caption-text">
            SMKN 1 Bondowoso mencetak lulusan yang siap kerja, unggul, dan
            berkarakter melalui pembelajaran berbasis kompetensi.
          </p>
          <div className="login-dots">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                className={`login-dot ${
                  index === activeSlide ? "login-dot-active" : ""
                }`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
