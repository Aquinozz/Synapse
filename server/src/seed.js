import { hashPassword } from './auth.js';
import { APP_TIME_ZONE } from './config.js';
import { isOver, occurrenceInWeek, toLocalIso, zonedNow } from './schedule.js';

const AVATARS = {
  camila:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAO6Tm06O99ZG9HfukQv3m1V0ugstZBV9x-qLRTB4NK6tRr_auJlHG9fi5ujMVWF7RZrPcSxdLeeyEZMPB_hDBl4kAlYrt9oJqfNi8Ee-hhe3u8zBS38VAfFFwMyJi6bpSS7VlbX19bLyCMMJHSBgWCNZg2dW2jMpKJq9HlfQOBlPkb85MjN3nLce4Vdjw_KP0iyy7OjNqLChLXhkE1bA1it-omPHdXe9jiY0B0uuTdl8ICrb8XU8wobg',
  lucas:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgNjFOgXdfKJq1jOuXeS8TrLHBjGE964FLzq3eiBpYtPNCoQv135pQEmg25_ItuvXYfxDf8zOmOPr1KRBG54wHpGTFwdVZCi-qcg2Gye6VvyqOCMB6WeGy-vAEksi8CfJg4iIbUOoHJKcMUtmSSpe3vZFeThGcuY8Ivjt7keb1qpdHV9NtrpqowfdV_2K6cZBNiz7JjXnuI_4FmvgkwSov0i3TUDcUHelCg0utNirb6kphdxq5ZE8BQ',
  beatriz:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDTcussIvXMZ6-bvnbW1wpvuE3U1sXzeNxJqPmhuw1jOt7MPI_LVuV6lDG5uA-ArquFZ8ePlVFNuYW4S_XeKrOlGCt-Gsd8LAD7fiX2x7z8cgGs3CqlwAbkEFtXfA1S6HyUR7j3kPxx4OyBdHkPjAzlmEGWGgkFFUnYTkNgP3SNpBCwrrj71eMK12O8MPMofls8ol_v4P1GO-EyIKXrnHlzgXxFFKF_c_ht_jY-0U4FNFSh17rp-RW2Fw',
};

// Same demo professionals the front end used as mock data
const PSYCHOLOGISTS = [
  {
    email: 'camila@synapse.demo',
    name: 'Dra. Camila Rossi',
    title: 'Psicóloga Clínica & Especialista em Burnout',
    reg: 'CRP 06/142981',
    avatar: AVATARS.camila,
    reviews: [
      { rating: 5, comment: 'Me ajudou a colocar limites no trabalho sem culpa. Saio de cada sessão com um passo concreto.' },
      { rating: 5, comment: 'Muito acolhedora e direta ao ponto.' },
      { rating: 4, comment: 'Gostei bastante. Às vezes a sessão passa do horário.' },
      { rating: 5, comment: '' },
    ],
    badge: 'Mais recomendada pelo time de tecnologia',
    bio: 'Foco em alta performance sustentável, transição de liderança e alívio do esgotamento emocional.',
    specialties: ['Ansiedade', 'Estresse', 'Síndrome de Burnout', 'Transição de carreira', 'Síndrome do impostor', 'Autocobrança'],
    approaches: ['Terapia Cognitivo-Comportamental (TCC)'],
    languages: ['Português', 'Inglês'],
    availability: { 1: ['09:00', '14:00'], 3: ['10:00', '16:30'], 4: ['10:00', '15:30'], 5: ['11:00'] },
  },
  {
    email: 'lucas@synapse.demo',
    name: 'Dr. Lucas Mendonça',
    title: 'Psicólogo Clínico & Mindfulness',
    reg: 'CRP 05/88921',
    avatar: AVATARS.lucas,
    reviews: [
      { rating: 5, comment: 'As técnicas de respiração melhoraram muito o meu sono.' },
      { rating: 4, comment: 'Calmo e paciente. Explica bem cada exercício.' },
      { rating: 5, comment: '' },
    ],
    badge: null,
    bio: 'Especialista em regulação do sono, técnicas somáticas de descompressão e estresse corporativo.',
    specialties: ['Ansiedade', 'Estresse', 'Insônia', 'Saúde do trabalhador', 'Mindfulness'],
    approaches: ['Terapia de Aceitação e Compromisso (ACT)', 'Mindfulness'],
    languages: ['Português', 'Espanhol'],
    availability: { 1: ['09:00'], 2: ['18:00'], 4: ['14:00'], 5: ['11:30'] },
  },
  {
    email: 'beatriz@synapse.demo',
    name: 'Dra. Beatriz Alencar',
    title: 'Médica Psiquiatra da Infância e Adulto',
    reg: 'CRM 08/23419',
    avatar: AVATARS.beatriz,
    reviews: [
      { rating: 5, comment: 'Avaliação cuidadosa, sem pressa. Explicou todas as opções.' },
      { rating: 5, comment: 'Senti que fui ouvido de verdade.' },
    ],
    badge: null,
    bio: 'Avaliação psiquiátrica integrada, saúde mental ocupacional e medicina preventiva do estilo de vida.',
    specialties: ['Depressão', 'Ansiedade generalizada (TAG)', 'Saúde do trabalhador', 'TDAH', 'Transtorno bipolar'],
    approaches: [],
    languages: ['Português'],
    availability: { 1: ['16:00'], 2: ['14:00'], 5: ['09:30'] },
  },
];

// Demo employees. Marina already has her weekly session, with a few weeks of history scored by
// her psychologist; Rafael has not chosen a psychologist yet, which shows the first-access flow.
const EMPLOYEES = [
  {
    email: 'marina@synapse.demo',
    name: 'Marina Silva',
    plan: { psychologist: 'camila@synapse.demo', weekday: 3, time: '16:30', format: 'video' },
    // Oldest first. The latest finished session is left without a score, to be evaluated in the demo.
    evaluations: [
      { score: 4, comment: 'Chegou muito cansada, com dificuldade para se desligar do trabalho à noite.' },
      { score: 5, comment: 'Começou a registrar os horários em que para de trabalhar.' },
      { score: 5, comment: '' },
      { score: 6, comment: 'Conseguiu negociar prazos com a liderança. Sono um pouco melhor.' },
      { score: 7, comment: 'Mantendo os limites de horário. Relata mais disposição.' },
      { score: 7, comment: '' },
    ],
  },
  { email: 'rafael@synapse.demo', name: 'Rafael Nogueira', plan: null },
];

/**
 * Creates the demo data: one company, three active psychologists and two employees.
 * Safe to run again: accounts that already exist are left untouched, missing ones are added.
 * Resolves to true when it inserted anything.
 * `now` is the wall-clock time in the app's time zone; the demo history is laid out before it.
 */
export const seed = async (db, { password, companyCode, now = zonedNow() }) => {
  // Hashing is slow on purpose, so it only happens when an account is actually created
  let passwordHash = null;

  return db.transaction(async (q) => {
    let inserted = false;

    const userId = async (email) => (await q.query('SELECT id FROM users WHERE email = $1', [email]))[0]?.id;

    const insertUser = async (role, name, email, companyId) => {
      passwordHash ??= await hashPassword(password);
      const [{ id }] = await q.query(
        'INSERT INTO users (role, name, email, password_hash, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [role, name, email, passwordHash, companyId]
      );
      inserted = true;
      return id;
    };

    let [company] = await q.query('SELECT id FROM companies WHERE access_code = $1', [companyCode]);
    if (!company) {
      [company] = await q.query('INSERT INTO companies (name, access_code) VALUES ($1, $2) RETURNING id', [
        'Empresa Demo',
        companyCode,
      ]);
      inserted = true;
    }

    for (const p of PSYCHOLOGISTS) {
      const existing = await userId(p.email);
      if (existing) {
        // Demo profiles created before the catalog existed get its specialties, approaches and languages
        await q.query(
          `UPDATE psychologists SET specialties = $1, approaches = $2, languages = $3
            WHERE user_id = $4 AND cardinality(languages) = 0`,
          [p.specialties, p.approaches, p.languages, existing]
        );
        // ...and demo profiles created before reviews existed get the sample reviews
        if (await seedReviews(q, existing, p.reviews)) inserted = true;
        continue;
      }

      const id = await insertUser('psychologist', p.name, p.email, null);
      await q.query(
        `INSERT INTO psychologists
           (user_id, title, reg, bio, avatar_url, badge, status, specialties, approaches, languages)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)`,
        [id, p.title, p.reg, p.bio, p.avatar, p.badge, p.specialties, p.approaches, p.languages]
      );
      for (const [weekday, times] of Object.entries(p.availability)) {
        for (const time of times) {
          await q.query('INSERT INTO availability (psychologist_id, weekday, time) VALUES ($1, $2, $3)', [
            id,
            Number(weekday),
            time,
          ]);
        }
      }
      await seedReviews(q, id, p.reviews);
    }

    for (const e of EMPLOYEES) {
      let id = await userId(e.email);
      if (!id) {
        id = await insertUser('employee', e.name, e.email, company.id);
        if (e.plan) {
          await q.query(
            'INSERT INTO weekly_plans (employee_id, psychologist_id, weekday, time, format) VALUES ($1, $2, $3, $4, $5)',
            [id, await userId(e.plan.psychologist), e.plan.weekday, e.plan.time, e.plan.format]
          );
        }
      }
      if (e.plan && e.evaluations && (await seedEvaluations(q, id, e, await userId(e.plan.psychologist), now))) {
        inserted = true;
      }
    }

    return inserted;
  });
};

/**
 * Sample reviews of a demo psychologist, without an author, one day apart so they keep this
 * order (newest first). Only while the psychologist has no review at all.
 */
const seedReviews = async (q, psychologistId, reviews) => {
  const [existing] = await q.query('SELECT 1 FROM reviews WHERE psychologist_id = $1 LIMIT 1', [psychologistId]);
  if (existing) return false;
  for (const [index, { rating, comment }] of reviews.entries()) {
    await q.query(
      `INSERT INTO reviews (psychologist_id, rating, comment, created_at, updated_at)
       VALUES ($1, $2, $3, now() - make_interval(days => $4), now() - make_interval(days => $4))`,
      [psychologistId, rating, comment, 7 + index * 9]
    );
  }
  return true;
};

/**
 * Gives the demo patient a history: the plan is dated back and the past sessions get the scores
 * of the list, leaving the latest finished session to be evaluated. Only while the patient is
 * still with the demo psychologist, in the demo slot, and has no evaluation yet (so demo data
 * created before evaluations existed gets the history too). Resolves to true when it inserted.
 */
const seedEvaluations = async (q, employeeId, employee, psychologistId, now) => {
  const { weekday, time } = employee.plan;
  const [plan] = await q.query(
    'SELECT 1 FROM weekly_plans WHERE employee_id = $1 AND psychologist_id = $2 AND weekday = $3 AND time = $4',
    [employeeId, psychologistId, weekday, time]
  );
  const [existing] = await q.query('SELECT 1 FROM session_evaluations WHERE employee_id = $1 LIMIT 1', [employeeId]);
  if (!plan || existing) return false;

  // Finished sessions, newest first, going back one week at a time
  const finished = [];
  for (let weeksAgo = 0; finished.length <= employee.evaluations.length; weeksAgo++) {
    const reference = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * weeksAgo);
    const session = occurrenceInWeek(weekday, time, reference);
    if (isOver(session, now)) finished.push(session);
  }
  const scored = finished.slice(1).reverse();

  // The patient took the slot one day before the first session of the history
  const first = scored[0];
  const tookSlot = new Date(first.getFullYear(), first.getMonth(), first.getDate() - 1, first.getHours(), first.getMinutes());
  await q.query(
    `UPDATE weekly_plans SET created_at = LEAST(created_at, $1::timestamp AT TIME ZONE $2) WHERE employee_id = $3`,
    [toLocalIso(tookSlot), APP_TIME_ZONE, employeeId]
  );
  for (const [index, session] of scored.entries()) {
    const { score, comment } = employee.evaluations[index];
    await q.query(
      'INSERT INTO session_evaluations (psychologist_id, employee_id, session_date, score, comment) VALUES ($1, $2, $3, $4, $5)',
      [psychologistId, employeeId, toLocalIso(session).slice(0, 10), score, comment]
    );
  }
  return true;
};

/** The accounts offered as one-click demo access on the login page */
export const DEMO_ACCOUNTS = {
  employee: 'marina@synapse.demo',
  'new-employee': 'rafael@synapse.demo',
  psychologist: 'camila@synapse.demo',
};

export const SEED_ACCOUNTS = [...EMPLOYEES.map((e) => e.email), ...PSYCHOLOGISTS.map((p) => p.email)];
