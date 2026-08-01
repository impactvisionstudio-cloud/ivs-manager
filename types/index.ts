export type Role =
  | "administrador"
  | "gestor"
  | "editor"
  | "designer"
  | "videomaker"
  | "social_media"
  | "financeiro";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  editor: "Editor",
  designer: "Designer",
  videomaker: "Videomaker",
  social_media: "Social Media",
  financeiro: "Financeiro",
};

export type Permission =
  | "dashboard.view"
  | "agenda.manage"
  | "clientes.manage"
  | "crm.manage"
  | "equipe.manage"
  | "financeiro.view"
  | "financeiro.manage"
  | "contratos.manage"
  | "ia.use"
  | "admin.access";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  administrador: [
    "dashboard.view", "agenda.manage", "clientes.manage", "crm.manage",
    "equipe.manage", "financeiro.view", "financeiro.manage",
    "contratos.manage", "ia.use", "admin.access",
  ],
  gestor: [
    "dashboard.view", "agenda.manage", "clientes.manage", "crm.manage",
    "equipe.manage", "financeiro.view", "contratos.manage", "ia.use",
  ],
  editor: ["dashboard.view", "agenda.manage", "ia.use"],
  designer: ["dashboard.view", "agenda.manage", "ia.use"],
  videomaker: ["dashboard.view", "agenda.manage", "ia.use"],
  social_media: ["dashboard.view", "agenda.manage", "clientes.manage", "ia.use"],
  financeiro: ["dashboard.view", "financeiro.view", "financeiro.manage", "contratos.manage", "clientes.manage"],
};

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  avatarUrl?: string;
  status: "ativo" | "inativo" | "prospect";
  totalBilled: number;
  createdAt: string;
  notes?: string;
}

export type ProjectStatus = "planejamento" | "producao" | "pos_producao" | "revisao" | "entregue";

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  team: string[];
  budget: number;
  thumbnail?: string;
}

export type CrmStage =
  | "novo_lead" | "contato" | "reuniao" | "orcamento" | "negociacao"
  | "fechado" | "producao" | "entrega" | "pos_venda";

export interface CrmDeal {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage: CrmStage;
  owner: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: "receita" | "despesa";
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "pago" | "pendente" | "atrasado";
  clientName?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: "disponivel" | "em_uso" | "manutencao";
  serialNumber: string;
  value: number;
}

export interface Contract {
  id: string;
  title: string;
  clientName: string;
  clientDocument?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceDescription?: string;
  paymentType?: "integral" | "entrada";
  status: "rascunho" | "enviado" | "assinado" | "expirado";
  value: number;
  signedAt?: string;
  expiresAt?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "reuniao" | "gravacao" | "entrega" | "interno";
  clientName?: string;
  team?: string[];
  allDay?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type: "info" | "warning" | "success" | "danger";
}