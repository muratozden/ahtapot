import "server-only";
import { createDb, type Db } from "@ahtapot/db";

// Reuse one pool across dev hot reloads.
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
