import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, ShieldOff, Search, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, name, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const adminSet = new Set((roles || []).map((r: any) => r.user_id));
    const merged: UserRow[] = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      is_admin: adminSet.has(p.id),
    }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (u: UserRow) => {
    if (u.id === user?.id && u.is_admin) {
      toast({ title: "Ação bloqueada", description: "Você não pode remover o próprio admin", variant: "destructive" });
      return;
    }
    if (u.is_admin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Admin removido" });
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Promovido a admin" });
    }
    await load();
  };

  const filtered = users.filter(u => (u.name || "").toLowerCase().includes(search.toLowerCase()));
  const adminCount = users.filter(u => u.is_admin).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Visualize e gerencie todos os usuários do sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Usuários totais</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground">Administradores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{users.length - adminCount}</p>
                <p className="text-xs text-muted-foreground">Usuários comuns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Lista de usuários</CardTitle>
            <div className="relative mt-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário encontrado</p>
            ) : (
              <div className="space-y-2">
                {filtered.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{u.name || "Sem nome"}</p>
                          {u.is_admin && <Badge className="bg-primary text-primary-foreground"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">Cadastrado em {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <Button
                      variant={u.is_admin ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleAdmin(u)}
                    >
                      {u.is_admin ? <><ShieldOff className="w-4 h-4 mr-1" /> Remover admin</> : <><Shield className="w-4 h-4 mr-1" /> Tornar admin</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
