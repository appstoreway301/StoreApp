import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, MapPin, Truck, Tags, Menu, LogOut, Sun, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logoMonogram from "../assets/Frente.png";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, short: "DASHBOARD" },
  { label: "Productos", path: "/admin/products", icon: Package, short: "PRODUCTOS" },
  { label: "Stock", path: "/admin/stock", icon: Tags, short: "STOCK" },
  { label: "Sucursales", path: "/admin/branches", icon: MapPin, short: "SUCURSALES" },
  { label: "Envíos", path: "/admin/shipments", icon: Truck, short: "ENVÍOS" },
];

/* ---------- Header ---------- */
function AdminHeader() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 hidden lg:flex items-center justify-between px-6 h-16"
      style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}
    >
      <div className="flex items-center gap-8">
        <span className="font-display font-black text-lg tracking-widest text-white">
          KONG MONTOYA
        </span>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e85d04")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          >
            INICIO
          </Link>
          <Link
            to="/products"
            className="text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e85d04")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          >
            PRODUCTOS
          </Link>
          <Link
            to="/about"
            className="text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e85d04")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          >
            NOSOTROS
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="transition-colors"
          style={{ color: "#666" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e85d04")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <button className="relative transition-colors" style={{ color: "#666" }}>
          <Bell className="w-4 h-4" />
          <span
            className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[8px] font-black rounded-full"
            style={{ background: "#e85d04", color: "#fff" }}
          >
            10
          </span>
        </button>

        <div className="flex items-center gap-2 cursor-pointer pl-3 border-l" style={{ borderColor: "#1a1a1a" }}>
          <div
            className="w-7 h-7 flex items-center justify-center rounded-full font-display font-black text-xs"
            style={{ background: "#e85d04", color: "#fff" }}
          >
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <span className="text-xs font-semibold text-white">{user?.name || "Administrador"}</span>
          <ChevronDown className="w-3 h-3" style={{ color: "#666" }} />
        </div>
      </div>
    </header>
  );
}

/* ---------- Footer (SIN MARQUEE) ---------- */
function AdminFooter() {
  const currentYear = new Date().getFullYear();

  const footerLink = (label, to) => (
    <li>
      <Link
        to={to}
        className="text-sm transition-colors"
        style={{ color: "#a0a0a0" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a0a0a0")}
      >
        {label}
      </Link>
    </li>
  );

  const footerSpan = (label) => (
    <li>
      <span
        className="text-sm transition-colors cursor-pointer"
        style={{ color: "#a0a0a0" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a0a0a0")}
      >
        {label}
      </span>
    </li>
  );

  const footerAnchor = (label, href) => (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm transition-colors"
        style={{ color: "#a0a0a0" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a0a0a0")}
      >
        {label}
      </a>
    </li>
  );

  return (
    <footer style={{ background: "#0a0a0a", borderTop: "1px solid #161616" }}>
      <div className="px-6 md:px-12 lg:px-16 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12 max-w-6xl">
          <div className="md:col-span-1">
            <Link to="/" className="block mb-3">
              <span className="font-display font-black text-base tracking-widest" style={{ color: "#ffffff" }}>
                KONG MONTOYA
              </span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: "#707070" }}>
              Streetwear para los que pelean. Cada prenda es un round ganado.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "#a0a0a0" }}>
              Explorar
            </h4>
            <ul className="space-y-2.5">
              {footerLink("Tienda", "/products")}
              {footerLink("Camisetas", "/products?category=tshirts")}
              {footerLink("Hoodies", "/products?category=hoodies")}
              {footerLink("Accesorios", "/products?category=accessories")}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "#a0a0a0" }}>
              Soporte
            </h4>
            <ul className="space-y-2.5">
              {footerLink("Mis Pedidos", "/orders")}
              {footerSpan("Envíos")}
              {footerSpan("Devoluciones")}
              {footerSpan("Preguntas frecuentes")}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "#a0a0a0" }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {footerSpan("Privacidad")}
              {footerSpan("Términos")}
              {footerSpan("Cookies")}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "#a0a0a0" }}>
              Redes
            </h4>
            <ul className="space-y-2.5">
              {footerAnchor("Instagram", "https://www.instagram.com/kongmontoya_store/")}
              {footerAnchor("TikTok", "https://www.tiktok.com/@kongmontoya_store444/")}
              {footerAnchor("Facebook", "https://www.facebook.com/profile.php?id=61588394711104")}
            </ul>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-6 gap-2"
          style={{ borderTop: "1px solid #161616" }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#555" }}>
            © {currentYear} KONG MONTOYA. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: "#555" }}>
            Stay Hungry. LA PELEA NUNCA TERMINA.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Layout ---------- */
export default function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: 64, background: "#0d0d0d", borderRight: "1px solid #1a1a1a" }}
      >
        <Link
          to="/admin"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center h-16 border-b"
          style={{ borderColor: "#1a1a1a" }}
        >
          {/* CAMBIADO: K por logo */}
          <img 
            src={logoMonogram} 
            alt="Kong Montoya" 
            className="w-8 h-8 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>

        <nav className="flex-1 flex flex-col items-center py-4 gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={item.label}
                className="relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-all duration-150"
                style={{
                  borderLeft: active ? "3px solid #e85d04" : "3px solid transparent",
                  background: active ? "rgba(232,93,4,0.1)" : "transparent",
                }}
              >
                <item.icon className="w-5 h-5 transition-colors" style={{ color: active ? "#e85d04" : "#555" }} />
                <span
                  className="text-[8px] uppercase tracking-widest font-bold"
                  style={{ color: active ? "#e85d04" : "#444" }}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-center pb-5 border-t" style={{ borderColor: "#1a1a1a" }}>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="mt-4 flex items-center justify-center w-10 h-10 transition-colors"
            style={{ color: "#444" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e85d04")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#0a0a0a" }}>
        <AdminHeader />

        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 px-4 h-14 flex items-center justify-between border-b"
          style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: "#e85d04" }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-black text-sm tracking-widest" style={{ color: "#e85d04" }}>
            KONG MONTOYA
          </span>
          <div className="w-5" />
        </header>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 md:p-6 lg:p-10">
            <Outlet />
          </div>
          <AdminFooter />
        </main>
      </div>
    </div>
  );
}