import { PrismaClient, TransactionType, Currency } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USER_ID = 'u_1';
const EMAIL = 'marcos@finap.app';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('secret123', 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { name: 'Marcos García', currency: Currency.USD, passwordHash },
    create: {
      id: USER_ID,
      name: 'Marcos García',
      email: EMAIL,
      passwordHash,
      currency: Currency.USD,
    },
  });

  await prisma.debtPayment.deleteMany({ where: { debt: { userId: user.id } } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.debt.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  await prisma.account.create({
    data: { id: 'a_1', userId: user.id, name: 'Cuenta principal', balance: 24580.0, currency: Currency.USD },
  });

  await prisma.category.createMany({
    data: [
      { id: 'c_vivienda', userId: user.id, name: 'Vivienda', color: '#EB001B', icon: 'home' },
      { id: 'c_alim', userId: user.id, name: 'Alimentación', color: '#F79E1B', icon: 'shopping' },
      { id: 'c_transporte', userId: user.id, name: 'Transporte', color: '#7C4DFF', icon: 'car' },
      { id: 'c_ocio', userId: user.id, name: 'Ocio', color: '#2FC78A', icon: 'gamepad' },
      { id: 'c_otros', userId: user.id, name: 'Otros', color: '#9B9BA8', icon: 'tag' },
      { id: 'c_nomina', userId: user.id, name: 'Nómina', color: '#1A73E8', icon: 'wallet' },
      { id: 'c_suscripciones', userId: user.id, name: 'Suscripciones', color: '#E91E63', icon: 'repeat' },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      { id: 't_1', userId: user.id, type: TransactionType.income, amount: 2800.0, categoryId: 'c_nomina', date: new Date('2025-05-12'), note: 'Salario' },
      { id: 't_2', userId: user.id, type: TransactionType.expense, amount: 980.0, categoryId: 'c_vivienda', date: new Date('2025-05-12'), note: 'Renta' },
      { id: 't_3', userId: user.id, type: TransactionType.expense, amount: 86.4, categoryId: 'c_alim', date: new Date('2025-05-11'), note: 'Mercado Central' },
      { id: 't_4', userId: user.id, type: TransactionType.expense, amount: 24.5, categoryId: 'c_transporte', date: new Date('2025-05-10'), note: 'Uber' },
      { id: 't_5', userId: user.id, type: TransactionType.expense, amount: 15.99, categoryId: 'c_suscripciones', date: new Date('2025-05-09'), note: 'Netflix' },
    ],
  });

  await prisma.budget.createMany({
    data: [
      { id: 'b_1', userId: user.id, categoryId: 'c_vivienda', month: '2025-05', limit: 1500.0 },
      { id: 'b_2', userId: user.id, categoryId: 'c_alim', month: '2025-05', limit: 900.0 },
    ],
  });

  await prisma.debt.createMany({
    data: [
      { id: 'd_auto', userId: user.id, name: 'Préstamo auto', total: 2800.0, paid: 1820.0 },
      { id: 'd_personal', userId: user.id, name: 'Préstamo personal', total: 640.0, paid: 576.0 },
      { id: 'd_estudio', userId: user.id, name: 'Préstamo estudio', total: 4550.0, paid: 1820.0 },
    ],
  });

  console.log(`Seed listo para ${EMAIL}`);
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
