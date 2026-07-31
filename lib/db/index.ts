import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// A URL vem do Supabase (Settings > Database > Connection string).
// Enquanto não configurado, o app roda inteiramente com dados mockados
// (ver lib/mock) e nenhuma chamada a este client é feita.
const connectionString = process.env.DATABASE_URL ?? "";

const client = connectionString ? postgres(connectionString, { prepare: false }) : null;

export const db = client ? drizzle(client, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

export const isDatabaseConfigured = Boolean(connectionString);
