"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { ROLE_LABELS } from "@/types";
import { initials, formatDate } from "@/lib/utils";

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
            <p className="text-xs text-muted-foreground">Membro desde {formatDate(user.createdAt)}</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Informações pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input defaultValue={user.name} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input defaultValue={user.email} type="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input defaultValue={ROLE_LABELS[user.role]} disabled />
            </div>
            <Button>Salvar alterações</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
