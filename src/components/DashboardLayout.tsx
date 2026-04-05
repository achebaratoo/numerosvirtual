import { ReactNode, useState } from "react";
import { Phone, LayoutDashboard, Smartphone, Bell, Settings, LogOut, Menu, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Smartphone, label: "Gerar Número", path: "/dashboard/generate" },
  { icon: Bell, label: "Notificações", path: "/dashboard/notifications" },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const avatarUrl = profile?.avatar_url || undefined;
  const initials = (profile?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-2 h-16 border-b border-sidebar-border", sidebarCollapsed ? "px-3 justify-center" : "px-6")}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">NumeroVirtual</span>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>
        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:block p-2 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!sidebarCollapsed && "Recolher"}
          </button>
        </div>
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              sidebarCollapsed ? "justify-center px-2" : "px-3"
            )}
            title={sidebarCollapsed ? "Sair" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {menuItems.find((m) => m.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{profile?.name || user?.email}</span>
            <Avatar className="w-9 h-9 cursor-pointer" onClick={() => navigate("/dashboard/settings")}>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
