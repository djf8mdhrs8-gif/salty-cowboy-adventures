/* eslint-disable no-console */
/**
 * Create (or reset the password of) an admin user.
 *
 * Usage:
 *   npm run create-admin -- --email owner@example.com --name "Boat Owner" --password "strong-password"
 * or interactively via environment variables:
 *   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run create-admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const name = arg("name") ?? process.env.ADMIN_NAME ?? "Admin";
  const password = arg("password") ?? process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.error(
      'Usage: npm run create-admin -- --email you@example.com --name "Your Name" --password "strong-password"',
    );
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
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

  console.log(`✓ Admin ready: ${email}`);
  console.log("  Sign in at /admin/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
