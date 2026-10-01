import { createApp } from './app.js';
import { DEMO_COMPANY_CODE } from './config.js';
import { openDatabase } from './db.js';
import { seed } from './seed.js';

const port = Number(process.env.PORT) || 4000;
// Without DATABASE_URL, an embedded Postgres keeps its files in this folder
const target = process.env.DATABASE_URL || 'data/pg';

const db = await openDatabase(target);

// The embedded database is single-process, so the demo data is created here rather than by a
// separate command while the server is running. A real Postgres is seeded with `npm run seed`.
if (!process.env.DATABASE_URL && process.env.SEED_PASSWORD) {
  const created = await seed(db, { password: process.env.SEED_PASSWORD, companyCode: DEMO_COMPANY_CODE });
  if (created) console.log('Dados de demonstração criados no banco local.');
}

const app = createApp(db);

const server = app.listen(port, () => {
  const where = process.env.DATABASE_URL ? 'Postgres em DATABASE_URL' : `Postgres embutido em ${target}`;
  console.log(`Synapse API em http://localhost:${port}/api (${where})`);
});

const shutdown = () => {
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
