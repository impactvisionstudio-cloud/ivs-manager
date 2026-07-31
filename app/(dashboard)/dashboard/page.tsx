"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, FolderKanban, Clock, AlertCircle, Calendar as CalendarIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  mockClients, mockProjects, mockEvents, mockNotifications, revenueByMonth, projectsByStatus,
} from "@/lib/mock/data";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";

const kpis = [
  { label: "Receita do mês", value: formatCurrency(102000), delta: "+12,4%", up: true, icon: TrendingUp },
  { label: "Clientes ativos", value: String(mockClients.filter((c) => c.status === "ativo").length), delta: "+2 este mês", up: true, icon: Users },
  { label: "Projetos em andamento", value: String(mockProjects.filter((p) => p.status !== "entregue").length), delta: "4 no prazo", up: true, icon: FolderKanban },
  { label: "Pendências financeiras", value: formatCurrency(32000), delta: "1 em atraso", up: false, icon: AlertCircle },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const todayEvents = mockEvents.slice(0, 3);

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo da agência hoje, {formatDate(new Date(), { day: "2-digit", month: "long" })}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="animate-fade-in">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight">{kpi.value}</p>
                  <div className={cn("mt-1.5 flex items-center gap-1 text-xs", kpi.up ? "text-success" : "text-danger")}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.delta}
                  </div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/15 text-primary-400">
                  <kpi.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Receita vs. Despesa</CardTitle>
              <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 18%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 6% 8%)", border: "1px solid hsl(240 5% 18%)", borderRadius: 12 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="receita" stroke="#7C3AED" fill="url(#colorReceita)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="url(#colorDespesa)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projetos por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectsByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {projectsByStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240 6% 8%)", border: "1px solid hsl(240 5% 18%)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {projectsByStatus.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Agenda de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {todayEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600/15 text-primary-400">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.clientName ?? "Interno"}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{formatDate(ev.start, { hour: "2-digit", minute: "2-digit" })}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{ev.type}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendências e notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {mockNotifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    n.type === "danger" && "bg-danger",
                    n.type === "warning" && "bg-warning",
                    n.type === "success" && "bg-success",
                    n.type === "info" && "bg-info"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projetos recentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Projeto</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Progresso</th>
                  <th className="pb-2 font-medium">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {mockProjects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium">{p.title}</td>
                    <td className="py-3 text-muted-foreground">{p.clientName}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">{p.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(p.deadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
