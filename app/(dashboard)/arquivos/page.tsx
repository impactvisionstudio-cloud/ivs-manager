"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileVideo, FileImage, Upload } from "lucide-react";
import { mockProjects } from "@/lib/mock/data";

const files = [
  { name: "Roteiro_final_v3.pdf", project: mockProjects[0].title, icon: FileText, size: "1.2 MB" },
  { name: "Corte_bruto_01.mp4", project: mockProjects[1].title, icon: FileVideo, size: "842 MB" },
  { name: "Storyboard.png", project: mockProjects[2].title, icon: FileImage, size: "4.6 MB" },
  { name: "Briefing_cliente.pdf", project: mockProjects[0].title, icon: FileText, size: "320 KB" },
  { name: "Making_of.mp4", project: mockProjects[4].title, icon: FileVideo, size: "1.1 GB" },
];

export default function ArquivosPage() {
  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Arquivos</h1>
          <p className="text-sm text-muted-foreground">Central de arquivos por projeto e cliente</p>
        </div>
        <Button><Upload className="h-4 w-4" /> Enviar arquivo</Button>
      </div>

      <div className="space-y-2">
        {files.map((f) => (
          <Card key={f.name} className="transition-colors hover:border-primary-600/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600/15 text-primary-400">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.project}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{f.size}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
