// Marks a psychologist as verified so the profile appears to employees.
// Usage: npm run approve -- email@exemplo.com
import { openDatabase } from '../src/db.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Uso: npm run approve -- email@exemplo.com');
  process.exit(1);
}

const db = await openDatabase(process.env.DATABASE_URL || 'data/pg');
const updated = await db.query(
  `UPDATE psychologists SET status = 'active'
    WHERE user_id = (SELECT id FROM users WHERE email = $1 AND role = 'psychologist')
    RETURNING user_id`,
  [email]
);
await db.close();

if (updated.length === 0) {
  console.error(`Nenhum psicólogo encontrado com o e-mail ${email}.`);
  process.exit(1);
}
console.log(`${email} aprovado: o perfil já aparece para os funcionários.`);
