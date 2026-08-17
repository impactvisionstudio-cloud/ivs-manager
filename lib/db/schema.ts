import {
  pgTable, pgEnum, uuid, text, timestamp, numeric, integer, boolean, jsonb, date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", [
  "administrador", "gestor", "editor", "designer", "videomaker", "social_media", "financeiro",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planejamento", "producao", "pos_producao", "revisao", "entregue",
]);

export const crmStageEnum = pgEnum("crm_stage", [
  "novo_lead", "contato", "reuniao", "orcamento", "negociacao", "fechado", "producao", "entrega", "pos_venda",
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["receita", "despesa"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pago", "pendente", "atrasado"]);
export const equipmentStatusEnum = pgEnum("equipment_status", ["disponivel", "em_uso", "manutencao"]);
export const contractStatusEnum = pgEnum("contract_status", ["rascunho", "enviado", "assinado", "expirado"]);
export const clientStatusEnum = pgEnum("client_status", ["ativo", "inativo", "prospect"]);
export const eventTypeEnum = pgEnum("event_type", ["reuniao", "gravacao", "entrega", "interno"]);
export const teamNoteStatusEnum = pgEnum("team_note_status", ["pendente", "em_andamento", "concluido"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: uuid("auth_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("editor"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  avatarUrl: text("avatar_url"),
  status: clientStatusEnum("status").notNull().default("prospect"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
});

// ── Diagnóstico comercial ──────────────────────────────────────────────
export const diagnostics = pgTable("diagnostics", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  responsible: text("responsible"),
  phone: text("phone"),
  address: text("address"),
  segment: text("segment"),
  city: text("city"),
  marketTime: text("market_time"),
  consultant: text("consultant"),
  protocol: text("protocol").notNull(),
  answers: jsonb("answers").notNull().default([]),
  opportunities: jsonb("opportunities").notNull().default([]),
  score: integer("score").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  status: projectStatusEnum("status").notNull().default("planejamento"),
  progress: integer("progress").notNull().default(0),
  deadline: timestamp("deadline"),
  budget: numeric("budget", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectMembers = pgTable("project_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
});

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").references(() => contracts.id).notNull(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const crmDeals = pgTable("crm_deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  value: numeric("value", { precision: 12, scale: 2 }).default("0"),
  stage: crmStageEnum("stage").notNull().default("novo_lead"),
  ownerId: uuid("owner_id").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: transactionStatusEnum("status").notNull().default("pendente"),
  clientId: uuid("client_id").references(() => clients.id),
  projectId: uuid("project_id").references(() => projects.id),
  contractId: uuid("contract_id").references(() => contracts.id),
});

export const equipments = pgTable("equipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  status: equipmentStatusEnum("status").notNull().default("disponivel"),
  serialNumber: text("serial_number"),
  value: numeric("value", { precision: 12, scale: 2 }).default("0"),
});

export const equipmentReservations = pgTable("equipment_reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  equipmentId: uuid("equipment_id").references(() => equipments.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  userId: uuid("user_id").references(() => users.id),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
});

export const contractPaymentTypeEnum = pgEnum("contract_payment_type", ["integral", "entrada"]);

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  clientName: text("client_name").notNull().default(""),
  clientDocument: text("client_document"),
  clientAddress: text("client_address"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  serviceDescription: text("service_description"),
  paymentType: contractPaymentTypeEnum("payment_type"),
  status: contractStatusEnum("status").notNull().default("rascunho"),
  value: numeric("value", { precision: 12, scale: 2 }).default("0"),
  fileUrl: text("file_url"),
  signedAt: timestamp("signed_at"),
  expiresAt: timestamp("expires_at"),
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  clientId: uuid("client_id").references(() => clients.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agendaEvents = pgTable("agenda_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  type: eventTypeEnum("type").notNull().default("interno"),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  clientId: uuid("client_id").references(() => clients.id),
  projectId: uuid("project_id").references(() => projects.id),
  createdBy: uuid("created_by").references(() => users.id),
});

export const agendaAttendees = pgTable("agenda_attendees", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => agendaEvents.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull().default("Nova conversa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => aiConversations.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Equipe ──────────────────────────────────────────────────────────────
export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  avatarUrl: text("avatar_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamNotes = pgTable("team_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  assigneeId: uuid("assignee_id").references(() => teamMembers.id),
  status: teamNoteStatusEnum("status").notNull().default("pendente"),
  clientId: uuid("client_id").references(() => clients.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── IVS AI ──────────────────────────────────────────────────────────────
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  niche: text("niche").notNull(),
  observations: text("observations"),
  postIdeas: jsonb("post_ideas"),
  painPoints: jsonb("pain_points"),
  differentiators: jsonb("differentiators"),
  visualIdentitySuggestions: jsonb("visual_identity_suggestions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  members: many(projectMembers),
}));

export const contractsRelations = relations(contracts, ({ many, one }) => ({
  client: one(clients, { fields: [contracts.clientId], references: [clients.id] }),
  checklist: many(checklistItems),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  deals: many(crmDeals),
  transactions: many(transactions),
  contracts: many(contracts),
}));

export const teamNotesRelations = relations(teamNotes, ({ one }) => ({
  assignee: one(teamMembers, { fields: [teamNotes.assigneeId], references: [teamMembers.id] }),
  client: one(clients, { fields: [teamNotes.clientId], references: [clients.id] }),
  contract: one(contracts, { fields: [teamNotes.contractId], references: [contracts.id] }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  client: one(clients, { fields: [aiInsights.clientId], references: [clients.id] }),
  contract: one(contracts, { fields: [aiInsights.contractId], references: [contracts.id] }),
}));

// ── Prospecção IA ─────────────────────────────────────────────────────
export const leadStatusEnum = pgEnum("lead_status", [
  "nao_contatado", "primeira_mensagem", "respondeu", "reuniao_marcada", "proposta_enviada", "cliente", "perdido",
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  title: text("title"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  mapsUrl: text("maps_url"),
  category: text("category"),
  status: leadStatusEnum("status").notNull().default("nao_contatado"),
  responsibleId: uuid("responsible_id").references(() => users.id),
  notes: text("notes"),
  aiAnalysis: jsonb("ai_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadMessages = pgTable("lead_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  kind: text("kind").notNull().default("mensagem"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadHistory = pgTable("lead_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadsRelations = relations(leads, ({ many, one }) => ({
  messages: many(leadMessages),
  history: many(leadHistory),
  responsible: one(users, { fields: [leads.responsibleId], references: [users.id] }),
}));

export const leadMessagesRelations = relations(leadMessages, ({ one }) => ({
  lead: one(leads, { fields: [leadMessages.leadId], references: [leads.id] }),
}));

export const leadHistoryRelations = relations(leadHistory, ({ one }) => ({
  lead: one(leads, { fields: [leadHistory.leadId], references: [leads.id] }),
  user: one(users, { fields: [leadHistory.userId], references: [users.id] }),
}));

export const creativeConversations = pgTable("creative_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull().default("Novo conteúdo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creativeMessages = pgTable("creative_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => creativeConversations.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  imageBase64: text("image_base64"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creativeConversationsRelations = relations(creativeConversations, ({ many }) => ({
  messages: many(creativeMessages),
}));

export const creativeMessagesRelations = relations(creativeMessages, ({ one }) => ({
  conversation: one(creativeConversations, { fields: [creativeMessages.conversationId], references: [creativeConversations.id] }),
}));

// ── IVS Prospect B2B ──────────────────────────────────────────────────
export const prospectLeadStatusEnum = pgEnum("prospect_lead_status", [
  "novo", "contatado", "respondeu", "interessado", "negociacao",
  "site_em_producao", "cliente", "sem_interesse", "sem_resposta", "sem_whatsapp",
]);

export const prospectLeads = pgTable("prospect_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  phone: text("phone").notNull(),
  niche: text("niche"),
  status: prospectLeadStatusEnum("status").notNull().default("novo"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  // Dia em que o lead foi reservado pra fila de prospecção (impede reuso em outro dia)
  assignedDate: date("assigned_date"),
  // Índice (1, 2 ou 3) da mensagem sorteada pra esse lead no dia em que foi reservado
  assignedMessageIndex: integer("assigned_message_index"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prospectContacts = pgTable("prospect_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => prospectLeads.id).notNull(),
  messageIndex: integer("message_index").notNull(),
  messageContent: text("message_content").notNull(),
  sentBy: uuid("sent_by").references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// 3 modelos de mensagem editáveis, usados no sorteio da fila diária
export const prospectMessageTemplates = pgTable("prospect_message_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  index: integer("index").notNull().unique(), // 1, 2 ou 3
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Configurações simples do módulo (ex: limite diário de leads)
export const prospectSettings = pgTable("prospect_settings", {
  key: text("key").primaryKey(), // ex: "daily_limit"
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prospectLeadsRelations = relations(prospectLeads, ({ many, one }) => ({
  contacts: many(prospectContacts),
  assignee: one(users, { fields: [prospectLeads.assignedTo], references: [users.id] }),
}));

export const prospectContactsRelations = relations(prospectContacts, ({ one }) => ({
  lead: one(prospectLeads, { fields: [prospectContacts.leadId], references: [prospectLeads.id] }),
  sender: one(users, { fields: [prospectContacts.sentBy], references: [users.id] }),
}));