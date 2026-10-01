import { openDatabase } from '../src/db.js';
import { SEED_ACCOUNTS, seed } from '../src/seed.js';

const password = process.env.SEED_PASSWORD;
const companyCode = process.env.SEED_COMPANY_CODE;
if (!password || password.length < 8 || !companyCode) {
  console.error('Defina SEED_PASSWORD (mínimo de 8 caracteres) e SEED_COMPANY_CODE no arquivo .env (veja .env.example).');
  process.exit(1);
}

const db = await openDatabase(process.env.DATABASE_URL || 'data/pg');
const inserted = await seed(db, { password, companyCode: companyCode.toUpperCase() });
await db.close();

if (inserted) {
  console.log('Dados de demonstração criados. Contas (senha: a SEED_PASSWORD do .env):');
  for (const email of SEED_ACCOUNTS) console.log(`  ${email}`);
} else {
  console.log('Os dados de demonstração já existem. Nada foi alterado.');
}
