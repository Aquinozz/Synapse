// Vercel serverless entry point: every /api/* request is handled by the Express app in server/.
import { createApp } from '../server/src/app.js';
import { openDatabase } from '../server/src/db.js';

// Built once per warm instance and reused across requests
let appPromise = null;

const buildApp = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida nas variáveis de ambiente do projeto na Vercel.');
  }
  return createApp(await openDatabase(process.env.DATABASE_URL));
};

export default async function handler(req, res) {
  try {
    appPromise ??= buildApp();
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    // Let the next request try again instead of caching a failed start
    appPromise = null;
    console.error(err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'internal_error', message: 'Erro interno. Tente novamente.' } }));
  }
}
