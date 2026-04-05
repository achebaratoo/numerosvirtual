import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Copy, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ddds = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92"];

const GenerateNumber = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNumbers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("generated_numbers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNumbers(data);
  };

  useEffect(() => {
    loadNumbers();
  }, [user]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    const ddd = ddds[Math.floor(Math.random() * ddds.length)];
    const n1 = Math.floor(Math.random() * 9000 + 1000);
    const n2 = Math.floor(Math.random() * 9000 + 1000);
    const phoneNumber = `(${ddd}) 9${n1}-${n2}`;

    const { error } = await supabase.from("generated_numbers").insert({
      user_id: user.id,
      phone_number: phoneNumber,
      ddd,
      status: "active",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Número gerado!", description: phoneNumber });
      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Número gerado",
        description: `Número ${phoneNumber} gerado com sucesso`,
        type: "success",
      });
    }
    await loadNumbers();
    setLoading(false);
  };

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number.replace(/\D/g, ""));
    toast({ title: "Copiado!", description: "Número copiado para a área de transferência." });
  };

  const simulateCode = async (id: string, phoneNumber: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from("generated_numbers").update({ code }).eq("id", id);
    await supabase.from("notifications").insert({
      user_id: user!.id,
      title: "Código recebido",
      description: `SMS com código ${code} recebido no número ${phoneNumber}`,
      type: "success",
    });
    toast({ title: "📩 SMS Recebido!", description: `Código de verificação: ${code}` });
    await loadNumbers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gerador de Número Virtual</h2>
          <p className="text-muted-foreground mt-1">
            Gere um número para receber códigos de verificação SMS
          </p>
        </div>

        <Card className="shadow-glow border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <Button variant="hero" size="lg" className="px-8" onClick={handleGenerate} disabled={loading}>
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Gerar Novo Número"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">O número ficará ativo por 10 minutos</p>
          </CardContent>
        </Card>

        {numbers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Números Gerados</h3>
            {numbers.map((num) => (
              <Card key={num.id} className="shadow-card animate-fade-in">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-semibold text-foreground">{num.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Gerado às {new Date(num.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={num.status === "active" ? "default" : "secondary"}>
                        {num.status === "active" ? "Ativo" : "Expirado"}
                      </Badge>
                      <Button variant="outline" size="icon" onClick={() => handleCopy(num.phone_number)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {num.code ? (
                    <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">
                        Código recebido: <span className="font-mono font-bold text-accent">{num.code}</span>
                      </span>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => simulateCode(num.id, num.phone_number)}>
                      Simular recebimento de SMS
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GenerateNumber;
