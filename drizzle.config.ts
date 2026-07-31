import "dotenv/config";
import { defineConfig } from "drizzle-kit";

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK" : "VAZIA");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});