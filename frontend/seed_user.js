/* eslint-disable @typescript-eslint/no-require-imports, no-console */
// Legacy CommonJS seed script (.js). Convert sang ESM khi có thời gian.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Tạo role User
    let role = await prisma.role.findUnique({
      where: { name: 'User' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { name: 'User' }
      });
      console.log('Created role: User');
    }

    // 2. Tạo tài khoản
    const email = 'hocvien@gmail.com';
    const password = 'password123';
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('User already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: 'HocVien_Test',
        email,
        passwordHash,
        roleId: role.id
      }
    });

    console.log('Successfully created test user:', user.email);

  } catch (error) {
    console.error('Error seeding user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
