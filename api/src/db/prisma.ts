import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error("DATABASE_URL must be set")
}

const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg")

const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({ adapter })
