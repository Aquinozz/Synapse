import { hashPassword } from './auth.js';

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
    rating: 4.9,
    reviewCount: 128,
    badge: 'Mais recomendada pelo time de tecnologia',
    bio: 'Foco em alta performance sustentável, transição de liderança e alívio do esgotamento emocional.',
    tags: [
      { label: 'Burnout Corporativo', icon: 'local_fire_department', category: 'burnout' },
      { label: 'Síndrome do Impostor', icon: 'visibility_off' },
      { label: 'TCC Baseada em Evidências', icon: 'cognition', category: 'tcc' },
    ],
    availability: { 1: ['09:00', '14:00'], 3: ['10:00', '16:30'], 4: ['10:00', '15:30'], 5: ['11:00'] },
  },
  {
    email: 'lucas@synapse.demo',
    name: 'Dr. Lucas Mendonça',
    title: 'Psicólogo Clínico & Mindfulness',
    reg: 'CRP 05/88921',
    avatar: AVATARS.lucas,
    rating: 4.8,
    reviewCount: 94,
    badge: null,
    bio: 'Especialista em regulação do sono, técnicas somáticas de descompressão e estresse corporativo.',
    tags: [
      { label: 'Insônia & Ritmo Circadiano', icon: 'bedtime', category: 'sleep' },
      { label: 'Mindfulness Redutor de Cortisol', icon: 'spa' },
    ],
    availability: { 1: ['09:00'], 2: ['18:00'], 4: ['14:00'], 5: ['11:30'] },
  },
  {
    email: 'beatriz@synapse.demo',
    name: 'Dra. Beatriz Alencar',
    title: 'Médica Psiquiatra da Infância e Adulto',
    reg: 'CRM 08/23419',
    avatar: AVATARS.beatriz,
    rating: 5.0,
    reviewCount: 62,
    badge: null,
    bio: 'Avaliação psiquiátrica integrada, saúde mental ocupacional e medicina preventiva do estilo de vida.',
    tags: [
      { label: 'Avaliação Médica & TDAH', icon: 'stethoscope', category: 'medical' },
      { label: 'Saúde Mental no Trabalho', icon: 'work_history' },
    ],
    availability: { 1: ['16:00'], 2: ['14:00'], 5: ['09:30'] },
  },
];

// Demo employees. Marina already has her weekly session; Rafael has not chosen a
// psychologist yet, which shows the first-access flow.
const EMPLOYEES = [
  {
    email: 'marina@synapse.demo',
    name: 'Marina Silva',
    plan: { psychologist: 'camila@synapse.demo', weekday: 3, time: '16:30', format: 'video' },
  },
  { email: 'rafael@synapse.demo', name: 'Rafael Nogueira', plan: null },
];

/**
 * Creates the demo data: one company, three active psychologists and two employees.
 * Safe to run again: accounts that already exist are left untouched, missing ones are added.
 * Resolves to true when it inserted anything.
 */
export const seed = async (db, { password, companyCode }) => {
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
      if (await userId(p.email)) continue;

      const id = await insertUser('psychologist', p.name, p.email, null);
      await q.query(
        `INSERT INTO psychologists (user_id, title, reg, bio, avatar_url, badge, rating, review_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
        [id, p.title, p.reg, p.bio, p.avatar, p.badge, p.rating, p.reviewCount]
      );

      for (const tag of p.tags) {
        await q.query(
          'INSERT INTO psychologist_tags (psychologist_id, label, icon, category) VALUES ($1, $2, $3, $4)',
          [id, tag.label, tag.icon, tag.category ?? null]
        );
      }
      for (const [weekday, times] of Object.entries(p.availability)) {
        for (const time of times) {
          await q.query('INSERT INTO availability (psychologist_id, weekday, time) VALUES ($1, $2, $3)', [
            id,
            Number(weekday),
            time,
          ]);
        }
      }
    }

    for (const e of EMPLOYEES) {
      if (await userId(e.email)) continue;

      const id = await insertUser('employee', e.name, e.email, company.id);
      if (e.plan) {
        await q.query(
          'INSERT INTO weekly_plans (employee_id, psychologist_id, weekday, time, format) VALUES ($1, $2, $3, $4, $5)',
          [id, await userId(e.plan.psychologist), e.plan.weekday, e.plan.time, e.plan.format]
        );
      }
    }

    return inserted;
  });
};

/** The accounts offered as one-click demo access on the login page */
export const DEMO_ACCOUNTS = {
  employee: 'marina@synapse.demo',
  'new-employee': 'rafael@synapse.demo',
  psychologist: 'camila@synapse.demo',
};

export const SEED_ACCOUNTS = [...EMPLOYEES.map((e) => e.email), ...PSYCHOLOGISTS.map((p) => p.email)];
