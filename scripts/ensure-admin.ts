/* eslint-disable no-console */
/**
 * Idempotent admin bootstrap for hosted deploys (runs during `vercel-build`).
 * Creates/updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD /
 * ADMIN_NAME env vars; skips silently when they aren't configured.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.log("ensure-admin: ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping.");
    return;
  }
  if (password.length < 10) {
    throw new Error("ensure-admin: ADMIN_PASSWORD must be at least 10 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: "ADMIN" },
    create: { email, name, role: "ADMIN" },
  });
  await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: { passwordHash },
    create: { userId: user.id, passwordHash },
  });
  console.log(`ensure-admin: admin ready for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
