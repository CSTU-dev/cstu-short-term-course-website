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
      hasOnline: true,
      hasOffline: false,
      onlinePrice: "1200.00",
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

  // Dual-mode showcase course, with a bespoke detail page (see courses/_custom).
  const demoData = {
    title: "Full-Stack Product Engineering",
    startAt: new Date("2026-10-05T09:00:00Z"),
    endAt: new Date("2027-01-20T17:00:00Z"),
    hasOnline: true,
    hasOffline: true,
    onlinePrice: "1500.00",
    offlinePrice: "1900.00",
    enabled: true,
  };
  const demo = await prisma.course.upsert({
    where: { slug: "demo" },
    // Keep the dual-mode showcase config in sync on every seed.
    update: demoData,
    create: {
      slug: "demo",
      ...demoData,
      sections: {
        create: [
          {
            title: "Module 1 — Foundations & Tooling",
            videoUrl: "https://example.com/video/demo-1",
            position: 1,
          },
          {
            title: "Module 2 — Building the Backend",
            videoUrl: "https://example.com/video/demo-2",
            position: 2,
          },
          {
            title: "Module 3 — Shipping the Frontend",
            videoUrl: "https://example.com/video/demo-3",
            position: 3,
          },
        ],
      },
    },
  });

  console.log(`✔ dual-mode demo course ready: ${demo.slug}`);
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
