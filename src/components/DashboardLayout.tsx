import { ReactNode, useEffect, useState } from "react";
import { MessageSquare, LayoutDashboard, Wifi, Bot, Users, Send, BarChart3, Bell, Settings, LogOut, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Wifi, label: "WhatsApp", path: "/dashboard/whatsapp" },
  { icon: Bot, label: "Automações", path: "/dashboard/automations" },
  { icon: Users, label: "Leads", path: "/dashboard/leads" },
  { icon: Send, label: "Mensagens", path: "/dashboard/messages" },
  { icon: BarChart3, label: "Funis", path: "/dashboard/funnels" },
  { icon: Bell, label: "Notificações", path: "/dashboard/notifications" },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Initial unread count
    const loadUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    loadUnread();

    // Realtime subscription on notifications inserts
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; description: string; type: string };
          toast({
            title: `🔔 ${n.title}`,
            description: n.description,
          });
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const avatarUrl = profile?.avatar_url || undefined;
  const initials = (profile?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-2 h-16 border-b border-sidebar-border", sidebarCollapsed ? "px-3 justify-center" : "px-6")}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">ZapFlow</span>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
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
          })}
        </nav>
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
