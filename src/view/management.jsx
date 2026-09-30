import { useEffect, useMemo, useState } from "react";
import "../css/index.css";
import "../css/user-management.css";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
import Sidebar from "./Sidebar";

/* ---------------- ICONS ---------------- */
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
  plus: (
    <svg
      viewBox="0 0 24 24"
      fill="#fff"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edit: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  trash: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7" />
      <path d="M6 7l1 13c0 .6.5 1 1 1h8c.5 0 1-.4 1-1l1-13" />
    </svg>
  ),
  close: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  shield: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="m9.5 12 1.8 1.8L14.8 10" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19c.6-3.2 3-5 6.2-5s5.6 1.8 6.2 5" />
      <path d="M16 4.3a3.2 3.2 0 0 1 0 6.2" />
      <path d="M18.5 14.4c2.4.6 3.9 2.2 4.4 4.6" />
    </svg>
  ),
  chevDown: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  chevronLeft: (
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
  ),
  chevronRight: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  eye: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  ),
  eyeOff: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.7 13.7 0 0 1-2.9 3.6M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 10a2.7 2.7 0 0 0 3.8 3.8" />
    </svg>
  ),
  shuffle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h3.5c2 0 3 1 4 2.5l1 1.5" />
      <path d="M3 18h3.5c2 0 3-1 4-2.5l1-1.5" />
      <path d="M14.5 6h6.5M14.5 18h6.5" />
      <path d="M18.5 3l3 3-3 3M18.5 15l3 3-3 3" />
    </svg>
  ),
  copy: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M5.5 15.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5 9 17l11-11" />
    </svg>
  ),
};

/* ---------------- STATIC DATA ---------------- */
const ROLES = [
  {
    id: "superadmin",
    label: "Super Admin",
    desc: "Kelola semua data serta seluruh role & akun pengguna",
    tone: "pink",
  },
  {
    id: "admin",
    label: "Admin",
    desc: "Kelola seluruh konten dan data website",
    tone: "blue",
  },
  {
    id: "jurusan",
    label: "Jurusan",
    desc: "Hanya bisa kelola Berita, Prestasi & Produk Unggulan",
    tone: "indigo",
  },
];

const MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Manajemen Akun" },
  { id: "berita", label: "Berita" },
  { id: "jurusan", label: "Jurusan" },
  { id: "lingkungan", label: "Lingkungan" },
  { id: "prestasi", label: "Prestasi" },
  { id: "pesan", label: "Pesan" },
  { id: "produk", label: "Produk Unggulan" },
  { id: "bkk", label: "BKK" },
  { id: "spmb", label: "SPMB" },
  { id: "blud", label: "BLUD" },
];

const ROLE_TEMPLATES = {
  superadmin: Object.fromEntries(
    MODULES.map((m) => [m.id, { view: true, edit: true, del: true }]),
  ),
  admin: Object.fromEntries(
    MODULES.map((m) => [
      m.id,
      m.id === "users"
        ? { view: false, edit: false, del: false }
        : { view: true, edit: true, del: true },
    ]),
  ),
  jurusan: Object.fromEntries(
    MODULES.map((m) => [
      m.id,
      ["berita", "prestasi", "produk"].includes(m.id)
        ? { view: true, edit: true, del: false }
        : { view: false, edit: false, del: false },
    ]),
  ),
};

const emptyPermissions = Object.fromEntries(
  MODULES.map((m) => [m.id, { view: false, edit: false, del: false }]),
);

function normalizeUser(raw) {
  const permissions = JSON.parse(JSON.stringify(emptyPermissions));
  (raw.permissions || []).forEach((p) => {
    permissions[p.module] = {
      view: !!p.can_view,
      edit: !!p.can_edit,
      del: !!p.can_delete,
    };
  });
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    department: raw.department || "",
    status: raw.status,
    lastActive: raw.last_active_at
      ? new Date(raw.last_active_at).toLocaleString("id-ID")
      : "Never",
    permissions,
  };
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function accessSummary(permissions) {
  const active = MODULES.filter((m) => permissions[m.id]?.view);
  if (active.length === MODULES.length) return "Full access";
  if (active.length === 0) return "No access";
  return `${active.length} module${active.length > 1 ? "s" : ""}`;
}

const STATUS_META = {
  active: { text: "Active", cls: "status-progress" },
  inactive: { text: "Inactive", cls: "status-inactive" },
  pending: { text: "Pending", cls: "status-pending" },
};

const ROLE_META = Object.fromEntries(ROLES.map((r) => [r.id, r]));
const ADDABLE_ROLES = ROLES.filter((r) => r.id !== "superadmin");

function blankForm() {
  return {
    id: null,
    name: "",
    email: "",
    role: "",
    department: "",
    status: "active",
    permissions: JSON.parse(JSON.stringify(emptyPermissions)),
    password: "",
    requirePasswordReset: true,
  };
}

function generateTempPassword() {
  const words = [
    "Nebula",
    "Cahaya",
    "Elang",
    "Zamrud",
    "Kompas",
    "Meteor",
    "Garuda",
    "Rimba",
    "Samudra",
    "Aksara",
    "Kilat",
    "Harmoni",
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  const symbols = ["!", "@", "#", "$", "%"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  return `${word}${digits}${symbol}`;
}

/* ---------------- PAGE ---------------- */
export default function UserManagementPage() {
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  /* STATE PAGINASI */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isSuperAdmin = currentUser?.role === "superadmin";
  const userPerms = currentUser?.permissions?.users || {};
  const canViewAccounts = isSuperAdmin || !!userPerms.view;
  const canEditAccounts = isSuperAdmin || !!userPerms.edit;
  const canDeleteAccounts = isSuperAdmin || !!userPerms.del;
  const canManagePermissions = isSuperAdmin;

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        setAuthChecked(true);
      })
      .catch((err) => {
        if (err.status !== 401) {
          setPageError(err.message);
          setAuthChecked(true);
        }
      });
  }, []);

  useEffect(() => {
    if (!authChecked || !canViewAccounts) return;
    setLoadingUsers(true);
    setPageError("");
    apiFetch("/users")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setUsers(list.map(normalizeUser));
      })
      .catch((err) => setPageError(err.message))
      .finally(() => setLoadingUsers(false));
  }, [authChecked, canViewAccounts]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const pending = users.filter((u) => u.status === "pending").length;
    return [
      { id: "total", label: "Total Users", value: total, icon: Icon.users },
      { id: "active", label: "Active Users", value: active, icon: Icon.shield },
      { id: "admins", label: "Admins", value: admins, icon: Icon.shield },
      {
        id: "pending",
        label: "Pending Invites",
        value: pending,
        icon: Icon.users,
      },
    ];
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  // Reset ke halaman 1 saat pencarian atau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [query, roleFilter, statusFilter]);

  /* PERHITUNGAN DATA PAGINASI */
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Koreksi otomatis jika halaman aktif melebihi total halaman (misal setelah hapus data)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  function openAdd() {
    setForm(blankForm());
    setShowPassword(false);
    setResettingPassword(false);
    setPasswordCopied(false);
    setPasswordError("");
    setSaveError("");
    setDrawerOpen(true);
  }

  function openEdit(user) {
    setForm({
      ...user,
      permissions: JSON.parse(JSON.stringify(user.permissions)),
      password: "",
      requirePasswordReset: true,
    });
    setShowPassword(false);
    setResettingPassword(false);
    setPasswordCopied(false);
    setPasswordError("");
    setSaveError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleGeneratePassword() {
    setForm((f) => ({ ...f, password: generateTempPassword() }));
    setShowPassword(true);
    setPasswordCopied(false);
    setPasswordError("");
  }

  async function handleCopyPassword() {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  async function removeUser(id) {
    if (!canDeleteAccounts) return;
    if (!window.confirm("Hapus akun ini? Tindakan ini tidak bisa dibatalkan."))
      return;
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setPageError(err.message);
    }
  }

  function pickRole(roleId) {
    if (!canManagePermissions) return;
    setForm((f) => ({
      ...f,
      role: roleId,
      permissions: JSON.parse(JSON.stringify(ROLE_TEMPLATES[roleId])),
    }));
  }

  function togglePermission(moduleId, key) {
    if (!canManagePermissions) return;
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [moduleId]: {
          ...f.permissions[moduleId],
          [key]: !f.permissions[moduleId][key],
        },
      },
    }));
  }

  async function saveUser(e) {
    e.preventDefault();
    if (!canEditAccounts) return;
    if (!form.name.trim() || !form.email.trim() || !form.role) return;

    const needsPassword = !form.id || resettingPassword;
    if (needsPassword) {
      if (!form.password || form.password.length < 8) {
        setPasswordError("Password sementara minimal 8 karakter.");
        return;
      }
    }
    setPasswordError("");
    setSaveError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      department: form.role === "jurusan" ? form.department : "",
      status: form.status,
      permissions: form.permissions,
      ...(needsPassword && {
        password: form.password,
        require_password_reset: form.requirePasswordReset,
      }),
    };

    setSaving(true);
    try {
      if (form.id) {
        const updated = await apiFetch(`/users/${form.id}`, {
          method: "PUT",
          body: payload,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === form.id ? normalizeUser(updated) : u)),
        );
      } else {
        const created = await apiFetch("/users", {
          method: "POST",
          body: payload,
        });
        setUsers((prev) => [...prev, normalizeUser(created)]);
      }
      setDrawerOpen(false);
    } catch (err) {
      setSaveError(err.message || "Gagal menyimpan akun.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="knowvio-root" data-theme={theme}>
      {/* ============ SIDEBAR ============ */}
      <Sidebar
        activeNav="users"
        theme={theme}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
        userName={currentUser?.name}
        role={currentUser?.role}
        permissions={currentUser?.permissions}
        onLogoutClick={logout}
      />

      {/* ============ MAIN ============ */}
      <main className="main">
        <header className="topbar">
          <div className="welcome">
            <h1>User Management</h1>
            <p>Manage who can access Knowvio and what they can do here.</p>
          </div>
          <div className="topbar-right">
            {canEditAccounts && (
              <button className="btn-primary um-add-btn" onClick={openAdd}>
                {Icon.plus}
                <p className="apa">Add User</p>
              </button>
            )}
          </div>
        </header>

        {pageError && (
          <div className="banner-error" role="alert">
            {pageError}
          </div>
        )}

        {!authChecked ? (
          <section className="panel um-locked">
            <p>Memuat data akun kamu...</p>
          </section>
        ) : canViewAccounts ? (
          <>
            <section>
              <div className="stats-grid">
                {stats.map((s) => (
                  <div className="stat-card" key={s.id}>
                    <div className="stat-top">
                      {s.icon}
                      <span>{s.label}</span>
                    </div>
                    <div className="stat-bottom">
                      <div className="stat-value">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel um-panel">
              <div className="um-toolbar">
                <div className="search um-search">
                  {Icon.search}
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <span className="filter-label">Role</span>
                  {["all", ...ROLES.map((r) => r.id)].map((id) => (
                    <button
                      key={id}
                      className={`filter-chip${roleFilter === id ? " active" : ""}`}
                      onClick={() => setRoleFilter(id)}
                    >
                      {id === "all" ? "All" : ROLE_META[id].label}
                    </button>
                  ))}
                </div>

                <div className="filter-group">
                  <span className="filter-label">Status</span>
                  {["all", "active", "inactive", "pending"].map((id) => (
                    <button
                      key={id}
                      className={`filter-chip${statusFilter === id ? " active" : ""}`}
                      onClick={() => setStatusFilter(id)}
                    >
                      {id === "all" ? "All" : STATUS_META[id].text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Access</th>
                      <th>Status</th>
                      <th>Last Active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <div className={`avatar role-avatar-${u.role}`}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="user-name">{u.name}</div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge role-${u.role}`}>
                            {ROLE_META[u.role].label}
                          </span>
                          {u.department && (
                            <div className="role-department">
                              {u.department}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="access-chip">
                            {accessSummary(u.permissions)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${STATUS_META[u.status].cls}`}
                          >
                            {STATUS_META[u.status].text}
                          </span>
                          {u.pendingPasswordReset && (
                            <div className="role-department">
                              Temp. password aktif
                            </div>
                          )}
                        </td>
                        <td>{u.lastActive}</td>
                        <td>
                          <div className="row-actions">
                            {canEditAccounts && (
                              <button
                                className="sq-btn"
                                aria-label="Edit user"
                                onClick={() => openEdit(u)}
                              >
                                {Icon.edit}
                              </button>
                            )}
                            {canDeleteAccounts && (
                              <button
                                className="sq-btn sq-btn-danger"
                                aria-label="Remove user"
                                onClick={() => removeUser(u.id)}
                              >
                                {Icon.trash}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="um-empty">
                          No users match your search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ============ PAGINASI ============ */}
              {totalItems > 0 && (
                <div className="pagination-wrap">
                  <div className="pagination-info">
                    Showing{" "}
                    <strong>
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        totalItems,
                      )}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(currentPage * itemsPerPage, totalItems)}
                    </strong>{" "}
                    of <strong>{totalItems}</strong> entries
                  </div>

                  <div className="pagination-controls">
                    <div className="per-page-select">
                      <span>Per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="pagination-buttons">
                      <button
                        className="sq-btn"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        aria-label="Previous Page"
                      >
                        {Icon.chevronLeft}
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          return (
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1
                          );
                        })
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <span
                              key={p}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              {prev && p - prev > 1 && (
                                <span className="pagination-dots">...</span>
                              )}
                              <button
                                className={`page-btn${currentPage === p ? " active" : ""}`}
                                onClick={() => setCurrentPage(p)}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}

                      <button
                        className="sq-btn"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        aria-label="Next Page"
                      >
                        {Icon.chevronRight}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="panel um-locked">
            <div className="um-locked-icon">{Icon.shield}</div>
            <h2>Akses dibatasi</h2>
            <p>
              Kamu belum diberi akses ke halaman Manajemen Akun. Hubungi{" "}
              <strong>Super Admin</strong> untuk minta akses.
            </p>
          </section>
        )}
      </main>

      {/* ============ ADD / EDIT DRAWER ============ */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <form
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveUser}
          >
            <div className="drawer-header">
              <div>
                <h2>{form.id ? "Edit User" : "Add New User"}</h2>
                <p>
                  Set who this person is and what they're allowed to access.
                </p>
              </div>
              <button
                type="button"
                className="sq-btn"
                aria-label="Close"
                onClick={closeDrawer}
              >
                {Icon.close}
              </button>
            </div>

            <div className="drawer-body">
              <div className="form-row">
                <div
                  className={`avatar drawer-avatar${form.role ? ` role-avatar-${form.role}` : ""}`}
                >
                  {form.name ? initials(form.name) : "?"}
                </div>
                <div className="form-grid">
                  <label className="form-group">
                    <span className="form-label">Full name</span>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="form-group">
                    <span className="form-label">Email address</span>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <span className="form-label">Role</span>
                {!form.id && (
                  <p className="role-hint">
                    Sebagai Super Admin, kamu hanya bisa membuat akun baru
                    dengan role <strong>Admin</strong> atau{" "}
                    <strong>Jurusan</strong>.
                  </p>
                )}
                {!canManagePermissions && (
                  <p className="role-hint">
                    Hanya Super Admin yang bisa mengubah role & hak akses
                    pengguna.
                  </p>
                )}
                <div className="role-grid">
                  {(form.id ? ROLES : ADDABLE_ROLES).map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      disabled={!canManagePermissions}
                      className={`role-card role-card-${r.tone}${form.role === r.id ? " selected" : ""}`}
                      onClick={() => pickRole(r.id)}
                    >
                      <span className="role-dot"></span>
                      <span className="role-card-label">{r.label}</span>
                      <span className="role-card-desc">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.role === "jurusan" && (
                <label className="form-group">
                  <span className="form-label">Nama jurusan</span>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="mis. RPL, TKJ, Multimedia"
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                  />
                </label>
              )}

              <div className="form-section">
                <div className="password-head">
                  <span className="form-label">Temporary password</span>
                  {form.id && !resettingPassword && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setResettingPassword(true);
                        setForm((f) => ({ ...f, password: "" }));
                      }}
                    >
                      Reset password
                    </button>
                  )}
                </div>

                {(!form.id || resettingPassword) && (
                  <>
                    <div className="password-field">
                      <input
                        className="form-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        value={form.password}
                        onChange={(e) => {
                          setPasswordError("");
                          setForm((f) => ({ ...f, password: e.target.value }));
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-icon-btn"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? Icon.eyeOff : Icon.eye}
                      </button>
                      <button
                        type="button"
                        className="password-icon-btn"
                        aria-label="Generate password"
                        onClick={handleGeneratePassword}
                      >
                        {Icon.shuffle}
                      </button>
                      <button
                        type="button"
                        className="password-icon-btn"
                        aria-label="Copy password"
                        onClick={handleCopyPassword}
                        disabled={!form.password}
                      >
                        {passwordCopied ? Icon.check : Icon.copy}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="password-error">{passwordError}</p>
                    )}
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.requirePasswordReset}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            requirePasswordReset: e.target.checked,
                          }))
                        }
                      />
                      <span>Minta ganti password saat login pertama</span>
                    </label>
                    <p className="password-hint">
                      Bagikan password ini ke pengguna secara langsung/aman
                      (jangan lewat chat publik). Password ini hanya berlaku
                      sementara.
                    </p>
                  </>
                )}
              </div>

              <div className="form-section">
                <span className="form-label">Access permissions</span>
                <div
                  className={`perm-table${!canManagePermissions ? " perm-table-readonly" : ""}`}
                >
                  <div className="perm-row perm-row-head">
                    <span>Module</span>
                    <span>View</span>
                    <span>Edit</span>
                    <span>Delete</span>
                  </div>
                  {MODULES.map((m) => (
                    <div className="perm-row" key={m.id}>
                      <span className="perm-module">{m.label}</span>
                      {["view", "edit", "del"].map((key) => (
                        <button
                          type="button"
                          key={key}
                          disabled={!canManagePermissions}
                          className={`perm-toggle${form.permissions[m.id][key] ? " on" : ""}`}
                          aria-pressed={form.permissions[m.id][key]}
                          onClick={() => togglePermission(m.id, key)}
                        >
                          <span className="switch-mini"></span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <span className="form-label">Account status</span>
                <div className="status-toggle-row">
                  {["active", "inactive", "pending"].map((id) => (
                    <button
                      type="button"
                      key={id}
                      className={`filter-chip${form.status === id ? " active" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, status: id }))}
                    >
                      {STATUS_META[id].text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeDrawer}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !canEditAccounts || !form.name || !form.email || !form.role
                }
              >
                {form.id ? "Save Changes" : "Add User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
