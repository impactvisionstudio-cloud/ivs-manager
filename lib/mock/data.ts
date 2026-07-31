import type {
  Client, Project, CrmDeal, Transaction, Equipment, Contract, AgendaEvent, NotificationItem, User,
} from "@/types";

export const mockUsers: User[] = [
  { id: "u1", name: "Daniel Gomes", email: "daniel@ivs.studio", role: "gestor", createdAt: "2023-02-10" },
  { id: "u2", name: "Eduardo Lobato", email: "eduardo@ivs.studio", role: "administrador", createdAt: "2023-03-01" },

];

export const mockClients: Client[] = [
  { id: "c1", name: "Ana Beatriz", company: "Grupo Nortis", email: "ana@nortis.com", phone: "(11) 98888-1234", status: "ativo", totalBilled: 84500, createdAt: "2024-01-12" },
  { id: "c2", name: "João Ferreira", company: "Vórtice Bebidas", email: "joao@vortice.com", phone: "(21) 97777-5566", status: "ativo", totalBilled: 132000, createdAt: "2023-11-03" },
  { id: "c3", name: "Patrícia Nunes", company: "Clínica Vitalis", email: "patricia@vitalis.med", phone: "(31) 96666-7788", status: "prospect", totalBilled: 0, createdAt: "2024-05-20" },
  { id: "c4", name: "Marcelo Tavares", company: "Construtora Amplo", email: "marcelo@amplo.eng", phone: "(41) 95555-9911", status: "ativo", totalBilled: 251000, createdAt: "2023-08-18" },
  { id: "c5", name: "Renata Costa", company: "Bloom Cosméticos", email: "renata@bloom.com", phone: "(51) 94444-2233", status: "inativo", totalBilled: 45300, createdAt: "2023-04-02" },
];

export const mockProjects: Project[] = [
  { id: "p1", title: "Campanha institucional 2026", clientId: "c1", clientName: "Grupo Nortis", status: "producao", progress: 62, deadline: "2026-08-15", team: ["u3", "u4"], budget: 38000 },
  { id: "p2", title: "Comercial linha verão", clientId: "c2", clientName: "Vórtice Bebidas", status: "pos_producao", progress: 85, deadline: "2026-08-05", team: ["u4", "u5"], budget: 52000 },
  { id: "p3", title: "Vídeos institucionais - unidades", clientId: "c4", clientName: "Construtora Amplo", status: "planejamento", progress: 10, deadline: "2026-09-30", team: ["u3", "u6"], budget: 71000 },
  { id: "p4", title: "Conteúdo redes sociais - agosto", clientId: "c1", clientName: "Grupo Nortis", status: "revisao", progress: 95, deadline: "2026-07-31", team: ["u6", "u5"], budget: 12500 },
  { id: "p5", title: "Documentário 10 anos", clientId: "c2", clientName: "Vórtice Bebidas", status: "entregue", progress: 100, deadline: "2026-06-20", team: ["u3", "u4", "u5"], budget: 96000 },
];

export const mockDeals: CrmDeal[] = [
  { id: "d1", title: "Rebranding institucional", clientName: "Clínica Vitalis", value: 45000, stage: "orcamento", owner: "Rafael Souza", updatedAt: "2026-07-22" },
  { id: "d2", title: "Série de vídeos de produto", clientName: "Bloom Cosméticos", value: 28000, stage: "novo_lead", owner: "Marina Alves", updatedAt: "2026-07-25" },
  { id: "d3", title: "Cobertura evento anual", clientName: "Grupo Nortis", value: 18000, stage: "negociacao", owner: "Rafael Souza", updatedAt: "2026-07-20" },
  { id: "d4", title: "Campanha lançamento", clientName: "Vórtice Bebidas", value: 63000, stage: "fechado", owner: "Marina Alves", updatedAt: "2026-07-10" },
  { id: "d5", title: "Vídeos treinamento interno", clientName: "Construtora Amplo", value: 22000, stage: "reuniao", owner: "Rafael Souza", updatedAt: "2026-07-24" },
  { id: "d6", title: "Pós-venda pacote anual", clientName: "Vórtice Bebidas", value: 15000, stage: "pos_venda", owner: "Marina Alves", updatedAt: "2026-07-18" },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", type: "receita", description: "Parcela 2/3 - Campanha institucional", category: "Serviços", amount: 12666, date: "2026-07-25", status: "pago", clientName: "Grupo Nortis" },
  { id: "t2", type: "despesa", description: "Aluguel de equipamento RED", category: "Equipamento", amount: 3200, date: "2026-07-24", status: "pago" },
  { id: "t3", type: "receita", description: "Entrada - Comercial verão", category: "Serviços", amount: 26000, date: "2026-07-22", status: "pago", clientName: "Vórtice Bebidas" },
  { id: "t4", type: "despesa", description: "Freelancer - motion graphics", category: "Equipe", amount: 2800, date: "2026-07-20", status: "pendente" },
  { id: "t5", type: "receita", description: "Parcela final - Documentário", category: "Serviços", amount: 32000, date: "2026-07-15", status: "atrasado", clientName: "Vórtice Bebidas" },
  { id: "t6", type: "despesa", description: "Licenças software edição", category: "Software", amount: 890, date: "2026-07-10", status: "pago" },
];

export const mockEquipments: Equipment[] = [
  { id: "e1", name: "Câmera RED Komodo 6K", category: "Câmera", status: "em_uso", serialNumber: "RK-2291", value: 68000 },
  { id: "e2", name: "Drone DJI Inspire 3", category: "Drone", status: "disponivel", serialNumber: "DJ-1183", value: 42000 },
  { id: "e3", name: "Kit iluminação Aputure 600d", category: "Iluminação", status: "disponivel", serialNumber: "AP-6600", value: 15000 },
  { id: "e4", name: "Gimbal DJI RS4 Pro", category: "Estabilização", status: "manutencao", serialNumber: "RS-4402", value: 9800 },
  { id: "e5", name: "Microfone Sennheiser MKH416", category: "Áudio", status: "disponivel", serialNumber: "SE-4160", value: 4200 },
];

export const mockContracts: Contract[] = [
  { id: "ct1", title: "Contrato anual - Grupo Nortis", clientName: "Grupo Nortis", status: "assinado", value: 96000, signedAt: "2026-01-15", expiresAt: "2027-01-15" },
  { id: "ct2", title: "Comercial linha verão", clientName: "Vórtice Bebidas", status: "assinado", value: 52000, signedAt: "2026-05-02" },
  { id: "ct3", title: "Rebranding institucional", clientName: "Clínica Vitalis", status: "enviado", value: 45000 },
  { id: "ct4", title: "Vídeos institucionais - unidades", clientName: "Construtora Amplo", status: "rascunho", value: 71000 },
];

export const mockEvents: AgendaEvent[] = [
  { id: "ev1", title: "Gravação - Campanha Nortis", start: "2026-07-28T09:00:00", end: "2026-07-28T13:00:00", type: "gravacao", clientName: "Grupo Nortis", team: ["u3", "u4"] },
  { id: "ev2", title: "Reunião de briefing - Vitalis", start: "2026-07-28T15:00:00", end: "2026-07-28T16:00:00", type: "reuniao", clientName: "Clínica Vitalis" },
  { id: "ev3", title: "Entrega final - Documentário", start: "2026-07-29T18:00:00", end: "2026-07-29T18:30:00", type: "entrega", clientName: "Vórtice Bebidas" },
  { id: "ev4", title: "Reunião de equipe", start: "2026-07-30T10:00:00", end: "2026-07-30T11:00:00", type: "interno" },
  { id: "ev5", title: "Gravação drone - Construtora Amplo", start: "2026-08-01T07:00:00", end: "2026-08-01T12:00:00", type: "gravacao", clientName: "Construtora Amplo", team: ["u4"] },
];

export const mockNotifications: NotificationItem[] = [
  { id: "n1", title: "Pagamento atrasado", description: "Documentário 10 anos - parcela final vencida", read: false, createdAt: "2026-07-27T08:00:00", type: "danger" },
  { id: "n2", title: "Prazo se aproximando", description: "Conteúdo redes sociais vence em 3 dias", read: false, createdAt: "2026-07-27T07:00:00", type: "warning" },
  { id: "n3", title: "Contrato assinado", description: "Comercial linha verão foi assinado", read: true, createdAt: "2026-07-25T10:00:00", type: "success" },
  { id: "n4", title: "Novo lead", description: "Bloom Cosméticos entrou no funil", read: true, createdAt: "2026-07-24T14:00:00", type: "info" },
];

export const revenueByMonth = [
  { month: "Fev", receita: 0, despesa: 0 },
  { month: "Mar", receita: 0, despesa: 0 },
  { month: "Abr", receita: 0, despesa: 0 },
  { month: "Mai", receita: 0, despesa: 0 },
  { month: "Jun", receita: 0, despesa: 0 },
  { month: "Jul", receita: 0, despesa: 0 },
];

export const projectsByStatus = [
  { name: "Planejamento", value: 4, color: "#a78bfa" },
  { name: "Produção", value: 6, color: "#7C3AED" },
  { name: "Pós-produção", value: 3, color: "#A855F7" },
  { name: "Revisão", value: 2, color: "#c4b5fd" },
  { name: "Entregue", value: 8, color: "#4c1d95" },
];
