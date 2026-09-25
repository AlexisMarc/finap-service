import { setDefaultResultOrder } from 'node:dns';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';

// Neon also resuelve a IPv6; en redes sin salida IPv6 forzamos IPv4 primero.
setDefaultResultOrder('ipv4first');

const POOL_MAX = 5;

let sharedPool: Pool | undefined;

// El pool se crea de forma perezosa (después de cargar .env) y se reutiliza
// entre instancias. En Vercel Fluid compute se registra para que la plataforma
// cierre las conexiones inactivas.
function getPool(): Pool {
  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: POOL_MAX,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });

    if (process.env.VERCEL) {
      attachDatabasePool(sharedPool);
    }
  }
  return sharedPool;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg(getPool()) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
