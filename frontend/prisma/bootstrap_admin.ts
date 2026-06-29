/**
 * Bootstrap real administrator accounts.
 *
 * This script does not create demo users or passwords. It promotes existing
 * users listed in ADMIN_EMAILS to the Admin role.
 *
 * Usage:
 *   ADMIN_EMAILS="admin@example.com,owner@example.com" npx.cmd tsx prisma/bootstrap_admin.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_ROLE_NAME = "Admin";
const USER_ROLE_NAME = "User";

function parseAdminEmails(value: string | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,\s;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

async function ensureBaseRoles(): Promise<{ adminRoleId: string }> {
  await prisma.role.upsert({
    where: { name: USER_ROLE_NAME },
    update: {},
    create: { name: USER_ROLE_NAME },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: ADMIN_ROLE_NAME },
    update: {},
    create: { name: ADMIN_ROLE_NAME },
  });

  return { adminRoleId: adminRole.id };
}

async function promoteExistingUsers(adminEmails: string[], adminRoleId: string): Promise<void> {
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: adminEmails,
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  const foundEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  const missingEmails = adminEmails.filter((email) => !foundEmails.has(email));

  if (missingEmails.length > 0) {
    throw new Error(
      `Admin user not found: ${missingEmails.join(", ")}. Register or sign in with these email(s) first, then rerun bootstrap.`,
    );
  }

  for (const user of existingUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        roleId: adminRoleId,
        status: "ACTIVE",
      },
    });

    console.log(`Promoted real admin: ${user.email} (${user.username})`);
  }
}

async function main(): Promise<void> {
  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

  if (adminEmails.length === 0) {
    throw new Error('ADMIN_EMAILS is required. Example: ADMIN_EMAILS="admin@example.com"');
  }

  const { adminRoleId } = await ensureBaseRoles();
  await promoteExistingUsers(adminEmails, adminRoleId);

  console.log(`Admin bootstrap complete. Total admin emails: ${adminEmails.length}`);
}

main()
  .catch((error) => {
    console.error("Admin bootstrap failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
