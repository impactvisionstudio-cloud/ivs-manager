"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  empresa: string;
  responsavel: string;
  telefone: string;
  endereco: string;
  segmento: string;
  tempoMercado: string;
  possuiSite: string;
  possuiWhatsapp: string;
  possuiLogo: string;
  possuiIdentidade: string;
  fazAnuncios: string;
};

const initialForm: FormData = {
  empresa: "",
  responsavel: "",
  telefone: "",
  endereco: "",
  segmento: "",
  tempoMercado: "",
  possuiSite: "",
  possuiWhatsapp: "",
  possuiLogo: "",
  possuiIdentidade: "",
  fazAnuncios: "",
};

export default function AnalisePage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [resultado, setResultado] = useState<{
    pontos: number;
    urgencia: string;
    cor: string;
  } | null>(null);

  const handleChange = (campo: keyof FormData, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const calcularPontuacao = () => {
    let pontos = 0;

    if (form.possuiSite === "nao") pontos += 20;
    if (form.possuiWhatsapp === "nao") pontos += 15;
    if (form.possuiLogo === "nao") pontos += 20;
    if (form.possuiIdentidade === "nao") pontos += 25;
    if (form.fazAnuncios === "nao") pontos += 20;

    let urgencia = "Baixa urgência";
    let cor = "text-green-400";

    if (pontos >= 61) {
      urgencia = "Transformação Digital Urgente";
      cor = "text-red-400";
    } else if (pontos >= 31) {
      urgencia = "Média urgência";
      cor = "text-yellow-400";
    }

    setResultado({ pontos, urgencia, cor });
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Análise de Cliente</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados para gerar a pontuação de urgência
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={form.empresa}
                  onChange={(e) => handleChange("empresa", e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => handleChange("responsavel", e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  placeholder="Cidade / Estado"
                />
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Input
                  value={form.segmento}
                  onChange={(e) => handleChange("segmento", e.target.value)}
                  placeholder="Ex: Varejo, Serviços..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo de mercado</Label>
                <Input
                  value={form.tempoMercado}
                  onChange={(e) => handleChange("tempoMercado", e.target.value)}
                  placeholder="Ex: 5 anos"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presença Digital */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presença Digital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "possuiSite", label: "Possui site?" },
              { key: "possuiWhatsapp", label: "Possui WhatsApp comercial?" },
              { key: "possuiLogo", label: "Possui logotipo profissional?" },
              { key: "possuiIdentidade", label: "Possui identidade visual?" },
              { key: "fazAnuncios", label: "Faz anúncios pagos?" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <Label className="text-sm">{item.label}</Label>
                <select
                  className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                  value={form[item.key as keyof FormData]}
                  onChange={(e) => handleChange(item.key as keyof FormData, e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={calcularPontuacao} size="lg">
          Gerar Análise
        </Button>
      </div>

      {/* Resultado */}
      {resultado && (
        <Card className="mt-6 border-primary-600/40">
          <CardHeader>
            <CardTitle className="text-base">Resultado da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">Pontuação</p>
              <p className="text-5xl font-bold tracking-tight">{resultado.pontos}</p>
              <p className={`text-lg font-semibold ${resultado.cor}`}>
                {resultado.urgencia}
              </p>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Empresa: <strong>{form.empresa || "—"}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}