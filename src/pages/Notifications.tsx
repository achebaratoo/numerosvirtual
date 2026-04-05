import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, any> = {
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
};

const typeColors: Record<string, string> = {
  success: "text-accent",
  warning: "text-destructive",
  info: "text-primary",
};

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Notificação excluída" });
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins} min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
          </div>
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {notifications.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma notificação ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type] || Info;
              return (
                <Card key={n.id} className="shadow-card hover:shadow-glow transition-shadow animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${typeColors[n.type] || "text-primary"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors p-1"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
