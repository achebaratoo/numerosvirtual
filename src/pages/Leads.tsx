import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  novo: "bg-accent text-accent-foreground",
  em_conversa: "bg-primary text-primary-foreground",
  cliente: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  cliente: "Cliente",
};

const Leads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("novo");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLeads(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const handleCreate = async () => {
    if (!user || !name.trim() || !phone.trim()) return;
    const { error } = await supabase.from("leads").insert({
      user_id: user.id,
      name,
      phone,
      email: email || null,
      status,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead adicionado!" });
      setOpen(false);
      setName(""); setPhone(""); setEmail(""); setStatus("novo");
      await load();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    toast({ title: "Lead removido" });
    await load();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Leads</h2>
            <p className="text-muted-foreground">Gerencie seus contatos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="w-4 h-4 mr-2" /> Adicionar Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do contato" /></div>
                <div><Label>Telefone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-9999" /></div>
                <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="em_conversa">Em conversa</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="hero" className="w-full" onClick={handleCreate} disabled={!name.trim() || !phone.trim()}>
                  Adicionar Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum lead encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.phone}</TableCell>
                    <TableCell>
                      <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                        <SelectTrigger className="w-[140px] h-8">
                          <Badge className={statusColors[lead.status] || ""}>{statusLabels[lead.status] || lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="em_conversa">Em conversa</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leads;
