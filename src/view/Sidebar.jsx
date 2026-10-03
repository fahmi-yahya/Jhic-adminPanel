import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/index.css";
import "../css/admin-modern.css";
import { logout } from "../lib/api";
// Sesuaikan path import ini kalau lokasi file logo di project-nya beda
// (file logo sudah disiapkan di /assets/logo-smakensa.png pada output ini).
import logoSmakensa from "../assets/Logo.png";

/* ---------------- ICONS ---------------- */
const DashboardIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);

const LandingIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
  </svg>
);

const UsersIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
    <path d="M16 8.2a3.2 3.2 0 0 1 0 6.3" />
    <path d="M21.5 19c0-2.6-1.9-4.5-4.5-5.2" />
  </svg>
);

const BkkIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);

const SpmbIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m2 9 10-5 10 5-10 5-10-5Z" />
    <path d="M6 11v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
    <path d="M22 9v6" />
  </svg>
);

const BludIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M4 21V10l8-6 8 6v11" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const SettingsIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <g>
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="12"
          y1="3.2"
          x2="12"
          y2="5.6"
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </g>
  </svg>
);

const LogoutIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const DarkModeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 14.3A8.4 8.4 0 1 1 9.7 4a7 7 0 0 0 10.3 10.3Z" />
  </svg>
);

const ChevronIcon = (
  <svg
    className="chev"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const MoreIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

function CollapseIcon({ collapsed }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <line x1="9.5" y1="5" x2="9.5" y2="19" />
      {collapsed ? <path d="m14 9 3 3-3 3" /> : <path d="m16 15-3-3 3-3" />}
    </svg>
  );
}

/* ---------------- DEFAULT NAV CONFIG ---------------- */
// `module` di sini harus sama persis dengan key modul permission di
// management.jsx (MODULES: dashboard, users, berita, jurusan, lingkungan,
// prestasi, pesan, produk, bkk, pencapaian, statistik — sudah ditambahkan
// ke MODULES/ROLE_TEMPLATES di management.jsx; "spmb" masih placeholder,
// belum ada halaman/rute-nya. superadmin otomatis selalu bisa lihat
// semuanya. Item/sub-item TANPA `module` tidak pernah disembunyikan
// karena tidak ada data permission untuk itu.
export const DEFAULT_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    path: "/index",
    module: "dashboard",
  },
  {
    id: "landing",
    label: "Landing Page",
    icon: LandingIcon,
    subItems: [
      { label: "Data Berita", path: "/berita", module: "berita" },
      { label: "Data Jurusan", path: "/jurusan", module: "jurusan" },
      { label: "Data Lingkungan", path: "/lingkungan", module: "lingkungan" },
      { label: "Data Prestasi", path: "/prestasi", module: "prestasi" },
      { label: "Data Pesan", path: "/pesan", module: "pesan" },
    ],
  },
  {
    id: "bkk",
    label: "BKK",
    icon: BkkIcon,
    subItems: [
      { label: "Data Lulusan", path: "/data-lulusan", module: "bkk" },
      { label: "Data Lowongan", path: "/data-lowongan", module: "bkk" },
    ],
  },
  {
    id: "spmb",
    label: "SPMB",
    icon: SpmbIcon,
    subItems: [{ label: "Data SPMB", path: "/spmb", module: "spmb" }],
  },
  {
    id: "blud",
    label: "BLUD",
    icon: BludIcon,
    subItems: [
      { label: "Data Pesan", path: "/pesan", module: "pesan" },
      { label: "Data Pencapaian", path: "/data-pencapaian", module: "pencapaian" },
      { label: "Data Statistik", path: "/data-statistik", module: "statistik" },
      {
        label: "Data Produk & Jasa Unggulan",
        path: "/data-produk",
        module: "produk",
      },
    ],
  },
  {
    id: "users",
    label: "User Management",
    icon: UsersIcon,
    path: "/management",
    module: "users",
  },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------------- COMPONENT ---------------- */
export default function Sidebar({
  navItems = DEFAULT_NAV_ITEMS,
  activeNav,
  onNavigate,
  onSubItemClick,
  theme = "light",
  onToggleTheme,
  showSettings = false,
  showLogout = true,
  onSettingsClick,
  // Default-nya langsung logout() dari api.js — jadi tombol Logout selalu
  // berfungsi di semua halaman yang pakai Sidebar ini, walau halaman itu
  // lupa nge-pass prop onLogoutClick. Kalau suatu halaman butuh perilaku
  // custom (mis. konfirmasi dulu), tinggal override dengan prop ini.
  onLogoutClick = logout,
  // Default-nya cuma placeholder kalau halaman pemanggil lupa nge-pass
  // nama user yang login. Idealnya tiap halaman kirim userName={currentUser?.name}
  // dari data /api/me, bukan mengandalkan default ini.
  userName = "Pengguna",
  userInitials,
  onProfileMoreClick,
  collapsed: collapsedProp,
  onToggleCollapse,
  // Role & permission user yang sedang login (dari /api/me, sudah
  // dinormalisasi ke bentuk { moduleId: { view, edit, del } }).
  // superadmin selalu melihat semua menu. Kalau `permissions` tidak dikirim
  // sama sekali (mis. halaman yang belum tersambung ke auth), semua menu
  // tetap tampil apa adanya supaya tidak merusak halaman yang sudah ada.
  role,
  permissions,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedId, setExpandedId] = useState(
    () => navItems.find((item) => item.subItems)?.id ?? null,
  );

  const collapsed = collapsedProp ?? internalCollapsed;

  const canView = (module) => {
    if (!module) return true; // item ini belum dipetakan ke modul permission apa pun
    if (role === "superadmin") return true;
    if (!permissions) return true; // belum ada data permission dikirim ke Sidebar
    return !!permissions[module]?.view;
  };

  const visibleNavItems = navItems
    .map((item) => {
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter((sub) =>
          canView(typeof sub === "object" ? sub.module : undefined),
        );
        // Group tanpa module sendiri (mis. "Landing Page") cuma boleh
        // tampil kalau minimal 1 sub-halamannya bisa diakses. Kalau semua
        // sub-item disembunyikan, judul grup-nya ikut disembunyikan juga
        // — bukan nampilin judul kosong tanpa isi.
        if (visibleSubItems.length === 0) return null;
        return { ...item, subItems: visibleSubItems };
      }
      return canView(item.module) ? item : null;
    })
    .filter(Boolean);

  const currentActive =
    activeNav ??
    visibleNavItems.find((item) => item.path === location.pathname)?.id;

  const toggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse(!collapsed);
    else setInternalCollapsed((prev) => !prev);
  };

  const handleNavClick = (item) => {
    onNavigate?.(item.id);
    if (item.path) {
      navigate(item.path);
    }
    if (item.subItems) {
      setExpandedId((prev) => (prev === item.id ? null : item.id));
    }
  };

  const handleSubItemClick = (parentId, sub) => {
    const subLabel = typeof sub === "string" ? sub : sub.label;
    const subPath = typeof sub === "object" ? sub.path : null;

    if (subPath) {
      navigate(subPath);
    }
    onSubItemClick?.(parentId, subLabel);
  };

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="brand">
        <img src={logoSmakensa} alt="SMAKENSA" className="brand-logo" />
        <span className="brand-name nav-label">SMAKENSA</span>
        <button
          className={`brand-collapse${collapsed ? " active" : ""}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={toggleCollapse}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className="nav">
        {visibleNavItems.map((item) => (
          <div key={item.id}>
            <button
              className={`nav-item${currentActive === item.id ? " active" : ""}${
                item.subItems && expandedId === item.id ? " expanded" : ""
              }`}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
              {item.subItems && ChevronIcon}
            </button>
            {item.subItems && expandedId === item.id && (
              <div className="sub-nav">
                {item.subItems.map((sub) => {
                  const label = typeof sub === "string" ? sub : sub.label;
                  const path = typeof sub === "object" ? sub.path : null;
                  const isSubActive = path && location.pathname === path;

                  return (
                    <button
                      className={`sub-item${isSubActive ? " active" : ""}`}
                      key={label}
                      onClick={() => handleSubItemClick(item.id, sub)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="foot-links">
        <button className="foot-row" onClick={onToggleTheme}>
          {DarkModeIcon}
          <span className="nav-label">Dark Mode</span>
          <span className={`switch${theme === "dark" ? " on" : ""}`}></span>
        </button>
        {showSettings && (
          <button className="foot-row" onClick={onSettingsClick}>
            {SettingsIcon}
            <span className="nav-label">Settings</span>
          </button>
        )}
        {showLogout && (
          <button className="foot-row" onClick={onLogoutClick}>
            {LogoutIcon}
            <span className="nav-label">Logout</span>
          </button>
        )}
      </div>

      <div className="sidebar-spacer"></div>
      <div className="sidebar-divider"></div>
      <div className="profile-row">
        <div className="avatar">{userInitials || getInitials(userName)}</div>
        <span className="profile-name">{userName}</span>
        <button
          className="profile-more"
          aria-label="More"
          onClick={onProfileMoreClick}
        >
          {MoreIcon}
        </button>
      </div>
    </aside>
  );
}
