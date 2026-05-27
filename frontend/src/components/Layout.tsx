import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Bell,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { Button } from "./ui";
import logo from "../assets/logo.png";
import badgeRS from "../assets/badgeRS.png";
import Logo_V_GLAMP from "../assets/Logo_V-GLAMP.png";    

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Briefcase, label: "Processos", path: "/processos" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: Bell, label: "Alertas", path: "/alertas" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: FileText, label: "Contratos", path: "/contratos" },
];

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div
        className="border-b border-slate-800 flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{
          minHeight: collapsed ? 64 : 96,
          padding: collapsed ? "12px 8px" : "8px 16px",
        }}
      >
        {collapsed ? (
          <img
            src={logo}
            alt="Logo"
            className="w-9 h-9 object-contain brightness-150"
          />
        ) : (
          <img
            src={logo}
            alt="Logo"
            className="h-24 w-auto object-contain brightness-150 contrast-150"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                navigate(item.path);
                onNavigate?.();
              }}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-sm ${
                collapsed ? "justify-center gap-0" : "gap-3"
              } ${
                isActive
                  ? "bg-blue-950 text-white shadow-md"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                style={{
                  maxWidth: collapsed ? 0 : 160,
                  opacity: collapsed ? 0 : 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          title={collapsed ? "Sair" : undefined}
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 text-sm ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            style={{
              maxWidth: collapsed ? 0 : 160,
              opacity: collapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease",
            }}
          >
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel =
    menuItems.find((m) => m.path === location.pathname)?.label || "Dashboard";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        {/* ── Sidebar Desktop ── */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 relative bg-slate-900 border-r border-slate-800 shadow-xl"
          style={{
            width: collapsed ? 64 : 256,
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <SidebarContent collapsed={collapsed} />

          {/* Botão toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="absolute -right-3.5 top-20 z-20 w-7 h-7 rounded-full bg-blue-900 hover:bg-blue-700 border-2 border-slate-900 flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronLeft
              className="w-3.5 h-3.5 text-white transition-transform duration-300"
              style={{
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </aside>

        {/* ── Sidebar Mobile — overlay ── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className="fixed top-0 left-0 h-full w-64 bg-slate-900 shadow-2xl z-50 flex flex-col lg:hidden"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Botão fechar mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white z-10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarContent
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              {/* Botão menu mobile — agora abre o sidebar */}
              <button
                className="lg:hidden text-white p-1 rounded hover:bg-slate-700 transition-colors"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-white">
                {currentLabel}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white font-semibold text-sm">
                {user.nome ? user.nome[0].toUpperCase() : "A"}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-white">
                  {user.nome || "Administrador"}
                </p>
                <p className="text-xs text-slate-400">{user.email || ""}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="ml-1 flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto bg-transparent">{children}</main>

          <footer className="bg-slate-900 border-t border-slate-700">
            <div className="px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">

              {/* Direitos */}

              <p className="text-xs text-slate-500 text-center lg:text-left"> © {new Date().getFullYear()} 
                <span className="text-slate-300 font-medium"> Rute Santos Advocacia </span>. Todos os direitos reservados.
              </p>

              {/* Desenvolvedor */}
              <div className="flex items-center gap-3">

                {/* Seção V-GLAMP com logo */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Desenvolvido por:<img src={Logo_V_GLAMP}  alt="V-GLAMP - Programando o Futuro"
                style={{ height: '28px', objectFit: 'contain' }}/>
              </span> |
              <span>Contato: (11) 94340-3631</span>
               
              </div>

              {/* Badge */}
              <div className="flex items-center gap-2">
                <img src={badgeRS} alt="Badge RS" className="h-10 w-auto object-contain drop-shadow-sm"/>
                <span className="text-xs text-slate-500"> Agenda Jurídica v1.0.0 </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
