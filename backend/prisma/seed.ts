import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@spe4.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'AdminSpe4!';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin déjà présent : ${ADMIN_EMAIL}`);
    return;
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`Admin créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('⚠️  Change ce mot de passe immédiatement en prod !');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
