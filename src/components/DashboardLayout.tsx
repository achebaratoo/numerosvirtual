import { ReactNode, useEffect, useState } from "react";
import { MessageSquare, LayoutDashboard, Wifi, Bot, Users, Send, BarChart3, Bell, Settings, LogOut, Menu, PanelLeftClose, PanelLeft, ShieldCheck, Server } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const baseMenu = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Wifi, label: "WhatsApp", path: "/dashboard/whatsapp" },
  { icon: Bot, label: "Automações", path: "/dashboard/automations" },
  { icon: Users, label: "Leads", path: "/dashboard/leads" },
  { icon: Send, label: "Mensagens", path: "/dashboard/messages" },
  { icon: BarChart3, label: "Funis", path: "/dashboard/funnels" },
  { icon: Bell, label: "Notificações", path: "/dashboard/notifications" },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

const adminMenu = [
  { icon: ShieldCheck, label: "Usuários", path: "/admin/users" },
  { icon: Server, label: "Integração Servidor", path: "/admin/integration" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    loadUnread();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; description: string; type: string };
          toast({ title: `🔔 ${n.title}`, description: n.description });
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const avatarUrl = profile?.avatar_url || undefined;
  const initials = (profile?.name || user?.email || "U").charAt(0).toUpperCase();

  const allItems = [...baseMenu, ...(isAdmin ? adminMenu : [])];
  const currentLabel = allItems.find((m) => m.path === location.pathname)?.label || "Dashboard";

  const renderItem = (item: typeof baseMenu[0], opts?: { isAdmin?: boolean }) => {
    const active = location.pathname === item.path;
    const isNotif = item.path === "/dashboard/notifications";
    return (
      <button
        key={item.path}
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
          if (isNotif) setUnreadCount(0);
        }}
        title={sidebarCollapsed ? item.label : undefined}
        className={cn(
          "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
          sidebarCollapsed ? "justify-center px-2" : "px-3",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
        {isNotif && unreadCount > 0 && (
          <span className={cn(
            "bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5",
            sidebarCollapsed && "absolute top-1 right-1 min-w-4 h-4 text-[10px]"
          )}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 lg:h-screen inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-300 lg:translate-x-0 shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-2 h-16 border-b border-sidebar-border shrink-0", sidebarCollapsed ? "px-3 justify-center" : "px-6")}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">ZapFlow</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {baseMenu.map((item) => renderItem(item))}

          {isAdmin && (
            <>
              <div className={cn("mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60", sidebarCollapsed && "text-center px-0")}>
                {sidebarCollapsed ? "—" : "Área Admin"}
              </div>
              {adminMenu.map((item) => renderItem(item, { isAdmin: true }))}
            </>
          )}
        </nav>

        <div className="hidden lg:block p-2 border-t border-sidebar-border shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSidebarCollapsed((v) => !v);
            }}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!sidebarCollapsed && <span>Recolher</span>}
          </button>
        </div>

        <div className="p-2 border-t border-sidebar-border shrink-0">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{profile?.name || user?.email}</span>
            <Avatar className="w-9 h-9 cursor-pointer" onClick={() => navigate("/dashboard/settings")}>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
