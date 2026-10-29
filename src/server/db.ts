import "server-only";
import { createPrismaClient } from "./prisma-client";
const globalDb = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };
export function getDb() { return globalDb.prisma ??= createPrismaClient(); }
