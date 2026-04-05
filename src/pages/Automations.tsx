import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Plus, Trash2, ArrowDown, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Step {
  type: "message" | "wait";
  content: string;
  delay_minutes?: number;
}

const Automations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("keyword");
  const [triggerValue, setTriggerValue] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ type: "message", content: "" }]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("automations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAutomations(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const addStep = (type: "message" | "wait") => {
    setSteps([...steps, type === "message" ? { type: "message", content: "" } : { type: "wait", content: "", delay_minutes: 5 }]);
  };

  const removeStep = (i: number) => {
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, field: string, value: any) => {
    const updated = [...steps];
    (updated[i] as any)[field] = value;
    setSteps(updated);
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("automations").insert({
      user_id: user.id,
      name,
      trigger_type: triggerType,
      trigger_value: triggerValue,
      steps: steps as any,
      is_active: false,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Automação criada!" });
      setOpen(false);
      setName("");
      setTriggerType("keyword");
      setTriggerValue("");
      setSteps([{ type: "message", content: "" }]);
      await load();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("automations").update({ is_active: !current, updated_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("automations").delete().eq("id", id);
    toast({ title: "Automação excluída" });
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Automações</h2>
            <p className="text-muted-foreground">Crie fluxos automáticos de mensagens</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="w-4 h-4 mr-2" /> Criar Automação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Automação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da automação</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas vindas" />
                </div>
                <div>
                  <Label>Gatilho</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="new_lead">Novo lead</SelectItem>
                      <SelectItem value="purchase">Compra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {triggerType === "keyword" && (
                  <div>
                    <Label>Palavra-chave</Label>
                    <Input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} placeholder="Ex: oi, preço, comprar" />
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Passos do fluxo</Label>
                  <div className="space-y-3">
                    {steps.map((step, i) => (
                      <div key={i}>
                        <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-secondary/30">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {step.type === "message" ? (
                                <Badge variant="default" className="text-xs"><Send className="w-3 h-3 mr-1" />Mensagem</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Esperar</Badge>
                              )}
                            </div>
                            {step.type === "message" ? (
                              <Textarea
                                value={step.content}
                                onChange={e => updateStep(i, "content", e.target.value)}
                                placeholder="Digite a mensagem... Use {nome} e {telefone}"
                                className="min-h-[60px]"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={step.delay_minutes || 5}
                                  onChange={e => updateStep(i, "delay_minutes", parseInt(e.target.value))}
                                  className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">minutos</span>
                              </div>
                            )}
                          </div>
                          {steps.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeStep(i)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex justify-center py-1"><ArrowDown className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => addStep("message")}>
                      <Send className="w-3 h-3 mr-1" /> Mensagem
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addStep("wait")}>
                      <Clock className="w-3 h-3 mr-1" /> Esperar
                    </Button>
                  </div>
                </div>

                <Button variant="hero" className="w-full" onClick={handleCreate} disabled={!name.trim()}>
                  Criar Automação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {automations.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma automação criada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {automations.map((auto) => {
              const stepsArr = (auto.steps || []) as Step[];
              return (
                <Card key={auto.id} className="shadow-card hover:shadow-glow transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{auto.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Gatilho: {auto.trigger_type === "keyword" ? `"${auto.trigger_value}"` : auto.trigger_type === "new_lead" ? "Novo lead" : "Compra"}
                            {" · "}{stepsArr.length} passo(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id, auto.is_active)} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(auto.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
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

export default Automations;
