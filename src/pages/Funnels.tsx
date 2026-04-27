import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Plus, Trash2, ArrowRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Stage {
  name: string;
  order: number;
}

const Funnels = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [funnels, setFunnels] = useState<any[]>([]);
  const [funnelLeads, setFunnelLeads] = useState<Record<string, any[]>>({});
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState("");

  const load = async () => {
    if (!user) return;
    const [{ data: fData }, { data: flData }, { data: lData }] = await Promise.all([
      supabase.from("funnels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("funnel_leads").select("*, leads(name, phone)").eq("user_id", user.id),
      supabase.from("leads").select("id, name, phone").eq("user_id", user.id),
    ]);
    setFunnels(fData || []);
    setLeads(lData || []);

    const grouped: Record<string, any[]> = {};
    (flData || []).forEach((fl: any) => {
      if (!grouped[fl.funnel_id]) grouped[fl.funnel_id] = [];
      grouped[fl.funnel_id].push(fl);
    });
    setFunnelLeads(grouped);
  };

  useEffect(() => { load(); }, [user]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("funnels").insert({
      user_id: user.id,
      name,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funil criado!" });
      setOpen(false);
      setName("");
      await load();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("funnels").delete().eq("id", id);
    toast({ title: "Funil excluído" });
    await load();
  };

  const handleAddLead = async (funnelId: string) => {
    if (!user || !selectedLead) return;
    const { error } = await supabase.from("funnel_leads").insert({
      funnel_id: funnelId,
      lead_id: selectedLead,
      user_id: user.id,
      stage_index: 0,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead adicionado ao funil!" });
      setAddLeadOpen(null);
      setSelectedLead("");
      await load();
    }
  };

  const moveLeadStage = async (flId: string, currentStage: number, maxStages: number) => {
    const newStage = Math.min(currentStage + 1, maxStages - 1);
    await supabase.from("funnel_leads").update({ stage_index: newStage, updated_at: new Date().toISOString() }).eq("id", flId);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Funis de Vendas</h2>
            <p className="text-muted-foreground">Acompanhe seus leads da captação à conversão</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="w-4 h-4 mr-2" /> Criar Funil</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Funil</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome do funil</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Funil de vendas principal" /></div>
                <p className="text-xs text-muted-foreground">Etapas padrão criadas: <strong>Lead entrou → Mensagem enviada → Conversão</strong></p>
                <Button variant="hero" className="w-full" onClick={handleCreate} disabled={!name.trim()}>Criar Funil</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Step-by-step guide */}
        <Card className="shadow-card border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Como usar os Funis — Passo a passo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-2">1</div>
                <p className="font-medium text-foreground mb-1">Crie um funil</p>
                <p className="text-xs text-muted-foreground">Clique em "Criar Funil" e dê um nome (ex: "Vendas Curso").</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-2">2</div>
                <p className="font-medium text-foreground mb-1">Cadastre leads</p>
                <p className="text-xs text-muted-foreground">Vá em <strong>Leads</strong> e adicione contatos antes (ou ao mesmo tempo).</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-2">3</div>
                <p className="font-medium text-foreground mb-1">Adicione ao funil</p>
                <p className="text-xs text-muted-foreground">Clique em "+ Lead" no funil e escolha quem entra na primeira etapa.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-2">4</div>
                <p className="font-medium text-foreground mb-1">Avance etapas</p>
                <p className="text-xs text-muted-foreground">Use "Avançar →" para mover o lead até a <strong>Conversão</strong>.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {funnels.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum funil criado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {funnels.map(funnel => {
              const stages = (funnel.stages || []) as Stage[];
              const fl = funnelLeads[funnel.id] || [];

              return (
                <Card key={funnel.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{funnel.name}</CardTitle>
                      <div className="flex gap-2">
                        <Dialog open={addLeadOpen === funnel.id} onOpenChange={(v) => { setAddLeadOpen(v ? funnel.id : null); setSelectedLead(""); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Plus className="w-3 h-3 mr-1" /> Lead</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Adicionar Lead ao Funil</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <Select value={selectedLead} onValueChange={setSelectedLead}>
                                <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                                <SelectContent>
                                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} - {l.phone}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button variant="hero" className="w-full" onClick={() => handleAddLead(funnel.id)} disabled={!selectedLead}>Adicionar</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(funnel.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stages visualization */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {stages.map((stage, i) => {
                        const count = fl.filter(f => f.stage_index === i).length;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="text-center">
                              <div className={`px-4 py-2 rounded-lg border ${i === stages.length - 1 ? "border-primary bg-primary/10" : "border-border bg-secondary/50"}`}>
                                <p className="text-xs font-medium text-foreground">{stage.name}</p>
                                <p className="text-lg font-bold text-foreground">{count}</p>
                              </div>
                            </div>
                            {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Leads in funnel */}
                    {fl.length > 0 && (
                      <div className="space-y-2">
                        {fl.map(fLead => (
                          <div key={fLead.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{fLead.leads?.name}</span>
                              <Badge variant="secondary" className="text-xs">{stages[fLead.stage_index]?.name}</Badge>
                            </div>
                            {fLead.stage_index < stages.length - 1 && (
                              <Button variant="outline" size="sm" onClick={() => moveLeadStage(fLead.id, fLead.stage_index, stages.length)}>
                                Avançar <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

export default Funnels;
