import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../lib/generated/prisma/client";

// Relative imports (not the `@/` alias) so this runs cleanly under tsx.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — cannot seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email) {
    console.warn("⚠ SUPERADMIN_EMAIL not set — skipping superAdmin seed.");
    return;
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const user = await prisma.user.upsert({
    where: { email },
    // Idempotent: ensure the role; only (re)set password when provided.
    update: {
      role: "SUPER_ADMIN",
      ...(passwordHash ? { passwordHash } : {}),
    },
    create: {
      email,
      role: "SUPER_ADMIN",
      name: "Super Admin",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log(`✔ superAdmin ready: ${user.email}`);
}

async function seedDemoCourse() {
  if (process.env.NODE_ENV === "production") return;

  const course = await prisma.course.upsert({
    where: { slug: "intro-to-ai" },
    update: {},
    create: {
      title: "Introduction to Applied AI",
      slug: "intro-to-ai",
      startAt: new Date("2026-09-01T09:00:00Z"),
      endAt: new Date("2026-12-15T17:00:00Z"),
      isOffline: false,
      priceAmount: "1200.00",
      currency: "USD",
      enabled: true,
      sections: {
        create: [
          {
            title: "Week 1 — Foundations",
            videoUrl: "https://example.com/video/week-1",
            position: 1,
          },
          {
            title: "Week 2 — Neural Networks",
            videoUrl: "https://example.com/video/week-2",
            position: 2,
          },
        ],
      },
    },
  });

  console.log(`✔ demo course ready: ${course.slug}`);
}

async function main() {
  await seedSuperAdmin();
  await seedDemoCourse();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
