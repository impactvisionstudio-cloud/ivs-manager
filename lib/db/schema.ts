import {
  pgTable, pgEnum, uuid, text, timestamp, numeric, integer, boolean, jsonb,
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
// answers: lista de respostas do formulário, uma por pergunta
//   { questionId, question, answer, points }
// opportunities: lista gerada a partir das respostas fracas
//   { title, impact: "Alto" | "Médio" }
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
  projectId: uuid("project_id").references(() => projects.id).notNull(),
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
  userId: uuid("user_id").references(() => users.id).notNull(),
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

export const projectsRelations = relations(projects, ({ many, one }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  members: many(projectMembers),
  checklist: many(checklistItems),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  deals: many(crmDeals),
  transactions: many(transactions),
  contracts: many(contracts),
}));