import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

// 1. Create the Pool (The actual connection to Docker)
const pool = new pg.Pool({ connectionString });

// 2. Create the Adapter (The bridge between Prisma and pg)
const adapter = new PrismaPg(pool);

// 3. Create the Client using the adapter
const globalForPrisma = global;

export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;