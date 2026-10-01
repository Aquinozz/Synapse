import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { TERMS_VERSION } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { seed } from '../src/seed.js';

const SEED = { password: 'senha-de-teste-123', companyCode: 'TESTE-01' };

// What a sign-up form sends after the person ticks the acceptance boxes
const ACCEPTED = { acceptedTerms: true, termsVersion: TERMS_VERSION, healthDataConsent: true };

// Monday 28/09/2026, 08:00. Tests move this clock to simulate the week going by.
const clock = { now: new Date(2026, 8, 28, 8, 0) };

let server;
let baseUrl;

const api = async (method, path, { body, token } = {}) => {
  const res = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body && { 'content-type': 'application/json' }),
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  return { status: res.status, data };
};

const login = async (email, password = SEED.password) => {
  const { data } = await api('POST', '/auth/login', { body: { email, password } });
  return data.token;
};

const registerEmployee = async (name, email) => {
  const { data } = await api('POST', '/auth/register', {
    body: { role: 'employee', name, email, password: 'outra-senha-123', companyCode: SEED.companyCode, ...ACCEPTED },
  });
  return data.token;
};

let db;

before(async () => {
  // TEST_DATABASE_URL runs the suite against a real Postgres server (its tables are dropped first);
  // without it, an embedded in-memory Postgres is used.
  db = await openDatabase(process.env.TEST_DATABASE_URL || 'memory');
  if (process.env.TEST_DATABASE_URL) {
    await db.exec(
      'TRUNCATE checkins, reviews, session_evaluations, reschedules, weekly_plans, availability, psychologist_tags, psychologists, login_attempts, auth_tokens, users, companies RESTART IDENTITY CASCADE'
    );
  }
  await seed(db, { ...SEED, now: clock.now });
  const app = createApp(db, { now: () => clock.now });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

describe('auth', () => {
  test('health check responds', async () => {
    const { status, data } = await api('GET', '/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
  });

  test('employee needs a valid company code', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      body: { role: 'employee', name: 'Ana', email: 'ana@teste.dev', password: 'senha-forte-1', companyCode: 'NAO-EXISTE', ...ACCEPTED },
    });
    assert.equal(status, 400);
    assert.equal(data.error.code, 'unknown_company_code');
  });

  test('registers an employee, rejects a duplicate e-mail and a short password', async () => {
    const body = { role: 'employee', name: 'Ana Lima', email: 'Ana@Teste.dev', password: 'senha-forte-1', companyCode: 'teste-01', ...ACCEPTED };
    const created = await api('POST', '/auth/register', { body });
    assert.equal(created.status, 201);
    assert.equal(created.data.user.email, 'ana@teste.dev');
    assert.equal(created.data.user.companyName, 'Empresa Demo');
    assert.equal(created.data.user.password_hash, undefined);

    const duplicate = await api('POST', '/auth/register', { body });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.data.error.code, 'email_taken');

    const weak = await api('POST', '/auth/register', { body: { ...body, email: 'outra@teste.dev', password: '123' } });
    assert.equal(weak.status, 400);
  });

  test('login, /me and logout', async () => {
    const wrong = await api('POST', '/auth/login', { body: { email: 'marina@synapse.demo', password: 'errada-errada' } });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.data.error.code, 'invalid_credentials');

    const token = await login('marina@synapse.demo');
    const me = await api('GET', '/auth/me', { token });
    assert.equal(me.data.user.name, 'Marina Silva');
    assert.equal(me.data.user.role, 'employee');

    assert.equal((await api('POST', '/auth/logout', { token })).status, 204);
    assert.equal((await api('GET', '/auth/me', { token })).status, 401);
  });

  test('blocks repeated failed logins', async () => {
    let last;
    for (let i = 0; i < 11; i++) {
      last = await api('POST', '/auth/login', { body: { email: 'lucas@synapse.demo', password: 'tentativa-errada' } });
    }
    assert.equal(last.status, 429);
  });
});

describe('demo data', () => {
  test('seeding again adds nothing, and the second demo employee starts without a psychologist', async () => {
    assert.equal(await seed(db, { ...SEED, now: clock.now }), false);

    const token = await login('rafael@synapse.demo');
    const { data } = await api('GET', '/plan', { token });
    assert.equal(data.plan, null);
  });
});

describe('terms of acceptance', () => {
  const base = { role: 'employee', name: 'Caio Reis', email: 'caio@teste.dev', password: 'senha-forte-1', companyCode: 'TESTE-01' };

  test('sign-up is refused without accepting the terms, with an old version, or without the health consent', async () => {
    const none = await api('POST', '/auth/register', { body: base });
    assert.equal(none.status, 400);
    assert.equal(none.data.error.code, 'terms_required');

    const old = await api('POST', '/auth/register', { body: { ...base, ...ACCEPTED, termsVersion: '2020-01-01' } });
    assert.equal(old.status, 409);
    assert.equal(old.data.error.code, 'terms_outdated');

    const noHealth = await api('POST', '/auth/register', { body: { ...base, ...ACCEPTED, healthDataConsent: false } });
    assert.equal(noHealth.status, 400);
    assert.equal(noHealth.data.error.code, 'health_consent_required');

    const ok = await api('POST', '/auth/register', { body: { ...base, ...ACCEPTED } });
    assert.equal(ok.status, 201);
    assert.equal(ok.data.user.termsAccepted, true);
  });

  test('an account from before the terms accepts them on first access', async () => {
    const token = await login('beatriz@synapse.demo');
    assert.equal((await api('GET', '/auth/me', { token })).data.user.termsAccepted, false);

    const refused = await api('POST', '/auth/terms', { token, body: { acceptedTerms: false, termsVersion: TERMS_VERSION } });
    assert.equal(refused.status, 400);

    // Psychologists are not asked for the health-data consent
    const accepted = await api('POST', '/auth/terms', { token, body: { acceptedTerms: true, termsVersion: TERMS_VERSION } });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.user.termsAccepted, true);
    assert.equal((await api('GET', '/auth/me', { token })).data.user.termsAccepted, true);
  });
});

describe('profile photo', () => {
  // 1x1 JPEG, enough to stand for the cropped image the app sends
  const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';

  test('an employee sets, sees and removes the photo; the psychologist sees it on the patient', async () => {
    const token = await login('marina@synapse.demo');
    assert.equal((await api('GET', '/auth/me', { token })).data.user.avatar, null);

    const set = await api('PUT', '/auth/avatar', { token, body: { image: PHOTO } });
    assert.equal(set.status, 200);
    assert.equal(set.data.user.avatar, PHOTO);
    assert.equal((await api('GET', '/auth/me', { token })).data.user.avatar, PHOTO);

    const psi = await login('camila@synapse.demo');
    const patients = (await api('GET', '/psi/patients', { token: psi })).data.patients;
    assert.equal(patients.find((p) => p.name === 'Marina Silva').avatar, PHOTO);

    const removed = await api('PUT', '/auth/avatar', { token, body: { image: null } });
    assert.equal(removed.data.user.avatar, null);
  });

  test('rejects what is not a small raster image, and other roles', async () => {
    const token = await login('marina@synapse.demo');
    for (const image of ['https://exemplo.com/foto.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,<script>', 42]) {
      const res = await api('PUT', '/auth/avatar', { token, body: { image } });
      assert.equal(res.status, 400, String(image));
    }

    const huge = await api('PUT', '/auth/avatar', { token, body: { image: `data:image/jpeg;base64,${'A'.repeat(210_000)}` } });
    assert.equal(huge.status, 400);
    assert.equal(huge.data.error.code, 'image_too_large');

    const psi = await login('camila@synapse.demo');
    assert.equal((await api('PUT', '/auth/avatar', { token: psi, body: { image: PHOTO } })).status, 403);
  });

  test('a psychologist changes the photo employees see in the directory', async () => {
    // Lucas is locked out by the failed-login test above, so Beatriz is used here
    const psi = await login('beatriz@synapse.demo');
    const set = await api('PUT', '/psi/avatar', { token: psi, body: { image: PHOTO } });
    assert.equal(set.status, 200);
    assert.equal(set.data.profile.avatar, PHOTO);

    const marina = await login('marina@synapse.demo');
    const seen = (await api('GET', '/psychologists?search=beatriz', { token: marina })).data.psychologists[0];
    assert.equal(seen.avatar, PHOTO);

    assert.equal((await api('PUT', '/psi/avatar', { token: psi, body: { image: 'https://exemplo.com/a.jpg' } })).status, 400);
    assert.equal((await api('PUT', '/psi/avatar', { token: marina, body: { image: PHOTO } })).status, 403);

    const removed = await api('PUT', '/psi/avatar', { token: psi, body: { image: null } });
    assert.equal(removed.data.profile.avatar, null);
  });
});

describe('demo access', () => {
  test('enters each demo account without a password', async () => {
    const expected = { employee: 'Marina Silva', 'new-employee': 'Rafael Nogueira', psychologist: 'Dra. Camila Rossi' };
    for (const [account, name] of Object.entries(expected)) {
      const { status, data } = await api('POST', '/auth/demo', { body: { account } });
      assert.equal(status, 200);
      assert.equal(data.user.name, name);
      assert.equal((await api('GET', '/auth/me', { token: data.token })).status, 200);
    }
  });

  test('rejects an unknown demo account', async () => {
    assert.equal((await api('POST', '/auth/demo', { body: { account: 'admin' } })).status, 400);
  });

  test('creates the demo data by itself on an empty database, and can be turned off', async () => {
    const empty = await openDatabase('memory');
    const listen = (app) =>
      new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
    const post = async (s) => {
      const res = await fetch(`http://127.0.0.1:${s.address().port}/api/auth/demo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ account: 'psychologist' }),
      });
      return { status: res.status, data: await res.json() };
    };

    const on = await listen(createApp(empty));
    const first = await post(on);
    assert.equal(first.status, 200);
    assert.equal(first.data.user.name, 'Dra. Camila Rossi');
    on.close();

    const off = await listen(createApp(empty, { demoLogin: false }));
    assert.equal((await post(off)).status, 404);
    off.close();
    await empty.close();
  });
});

describe('psychologist directory', () => {
  test('requires login', async () => {
    assert.equal((await api('GET', '/psychologists')).status, 401);
  });

  test('lists active professionals with free weekly slots and supports search', async () => {
    const token = await login('marina@synapse.demo');
    const { data } = await api('GET', '/psychologists', { token });
    assert.equal(data.psychologists.length, 3);

    const camila = data.psychologists.find((p) => p.name === 'Dra. Camila Rossi');
    assert.deepEqual(camila.weeklyAvailability.find((d) => d.weekday === 3).times, ['10:00', '16:30']);
    assert.equal(camila.email, undefined);

    assert.ok(camila.specialties.includes('Síndrome de Burnout'));
    assert.deepEqual(camila.approaches, ['Terapia Cognitivo-Comportamental (TCC)']);
    assert.deepEqual(camila.languages, ['Português', 'Inglês']);

    // The search covers specialties and approaches too
    const search = await api('GET', '/psychologists?search=insônia', { token });
    assert.deepEqual(search.data.psychologists.map((p) => p.name), ['Dr. Lucas Mendonça']);
    const byApproach = await api('GET', '/psychologists?search=tcc', { token });
    assert.deepEqual(byApproach.data.psychologists.map((p) => p.name), ['Dra. Camila Rossi']);
  });

  test('rating and number of reviews come from the reviews themselves', async () => {
    const token = await login('marina@synapse.demo');
    const { psychologists } = (await api('GET', '/psychologists', { token })).data;
    const camila = psychologists.find((p) => p.name === 'Dra. Camila Rossi');
    // Demo samples: 5, 5, 4, 5
    assert.deepEqual([camila.rating, camila.reviewCount], [4.8, 4]);

    const { data } = await api('GET', `/psychologists/${camila.id}/reviews`, { token });
    assert.deepEqual(data.summary, { average: 4.8, count: 4, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3 } });
    assert.equal(data.reviews.length, 4);
    assert.equal(data.reviews[0].comment.startsWith('Me ajudou'), true);
    assert.deepEqual(Object.keys(data.reviews[0]).sort(), ['comment', 'date', 'id', 'mine', 'rating']);
    assert.equal(data.reviews.some((r) => r.mine), false);
  });

  test('an employee reviews her own psychologist, changes and removes the review', async () => {
    const token = await login('marina@synapse.demo');
    const { psychologists } = (await api('GET', '/psychologists', { token })).data;
    const camila = psychologists.find((p) => p.name === 'Dra. Camila Rossi');
    const lucas = psychologists.find((p) => p.name === 'Dr. Lucas Mendonça');
    const path = `/psychologists/${camila.id}`;

    assert.equal((await api('GET', `${path}/reviews`, { token })).data.canReview, true);

    const saved = await api('PUT', `${path}/review`, { token, body: { rating: 3, comment: '  Estou gostando.  ' } });
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.data.summary, { average: 4.4, count: 5, distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 3 } });
    const mine = saved.data.reviews.filter((r) => r.mine);
    assert.deepEqual(mine.map((r) => [r.rating, r.comment]), [[3, 'Estou gostando.']]);
    // Newest first
    assert.equal(saved.data.reviews[0].mine, true);

    // A second review replaces the first one
    const changed = await api('PUT', `${path}/review`, { token, body: { rating: 5 } });
    assert.deepEqual([changed.data.summary.count, changed.data.summary.average], [5, 4.8]);
    assert.equal((await api('GET', `/psychologists/${camila.id}`, { token })).data.psychologist.reviewCount, 5);

    // The psychologist reads it without knowing who wrote it
    const psi = await login('camila@synapse.demo');
    const own = (await api('GET', '/psi/reviews', { token: psi })).data;
    assert.equal(own.summary.count, 5);
    assert.equal(own.reviews.some((r) => r.mine || 'employee_id' in r || 'name' in r), false);

    for (const body of [{ rating: 0 }, { rating: 6 }, { rating: 4.5 }, { rating: '5' }, { rating: 5, comment: 'a'.repeat(501) }]) {
      assert.equal((await api('PUT', `${path}/review`, { token, body })).status, 400, JSON.stringify(body).slice(0, 40));
    }

    // Only the psychologist who attends her, and psychologists do not review
    const notMine = await api('PUT', `/psychologists/${lucas.id}/review`, { token, body: { rating: 5 } });
    assert.equal(notMine.status, 403);
    assert.equal((await api('GET', `/psychologists/${lucas.id}/reviews`, { token })).data.reason, 'not_your_psychologist');
    assert.equal((await api('PUT', `${path}/review`, { token: psi, body: { rating: 5 } })).status, 403);
    assert.equal((await api('GET', '/psychologists/999999/reviews', { token })).status, 404);

    const removed = await api('DELETE', `${path}/review`, { token });
    assert.deepEqual([removed.data.summary.count, removed.data.summary.average], [4, 4.8]);
  });

  test('a new psychologist stays hidden until approved', async () => {
    const created = await api('POST', '/auth/register', {
      body: { role: 'psychologist', name: 'Dr. Novo', email: 'novo@teste.dev', password: 'senha-forte-1', reg: 'CRP 01/00001', title: 'Psicólogo Clínico', ...ACCEPTED },
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.user.status, 'pending');

    const token = await login('marina@synapse.demo');
    const { data } = await api('GET', '/psychologists', { token });
    assert.equal(data.psychologists.some((p) => p.name === 'Dr. Novo'), false);
  });
});

describe('weekly plan', () => {
  test('the seeded employee has a fixed slot and a computed next session', async () => {
    const token = await login('marina@synapse.demo');
    const { data } = await api('GET', '/plan', { token });
    assert.equal(data.plan.weekday, 3);
    assert.equal(data.plan.time, '16:30');
    assert.equal(data.plan.nextSession, '2026-09-30T16:30');
    assert.equal(data.plan.doneThisWeek, false);
    assert.equal(data.psychologist.name, 'Dra. Camila Rossi');
  });

  test('a slot held by someone is hidden from others and cannot be taken', async () => {
    const other = await registerEmployee('Bruno Dias', 'bruno@teste.dev');
    const list = await api('GET', '/psychologists', { token: other });
    const camila = list.data.psychologists.find((p) => p.name === 'Dra. Camila Rossi');
    assert.deepEqual(camila.weeklyAvailability.find((d) => d.weekday === 3).times, ['10:00']);

    const taken = await api('PUT', '/plan', {
      token: other,
      body: { psychologistId: camila.id, weekday: 3, time: '16:30', format: 'video' },
    });
    assert.equal(taken.status, 409);
    assert.equal(taken.data.error.code, 'slot_taken');

    const notOffered = await api('PUT', '/plan', {
      token: other,
      body: { psychologistId: camila.id, weekday: 0, time: '07:00', format: 'video' },
    });
    assert.equal(notOffered.status, 400);
    assert.equal(notOffered.data.error.code, 'slot_not_offered');

    const chosen = await api('PUT', '/plan', {
      token: other,
      body: { psychologistId: camila.id, weekday: 4, time: '10:00', format: 'audio' },
    });
    assert.equal(chosen.status, 200);
    assert.equal(chosen.data.plan.nextSession, '2026-10-01T10:00');
  });

  test('switching psychologist frees the old slot', async () => {
    const token = await registerEmployee('Carla Reis', 'carla@teste.dev');
    const list = (await api('GET', '/psychologists', { token })).data.psychologists;
    const lucas = list.find((p) => p.name === 'Dr. Lucas Mendonça');
    const beatriz = list.find((p) => p.name === 'Dra. Beatriz Alencar');

    await api('PUT', '/plan', { token, body: { psychologistId: lucas.id, weekday: 2, time: '18:00', format: 'video' } });
    const switched = await api('PUT', '/plan', {
      token,
      body: { psychologistId: beatriz.id, weekday: 5, time: '09:30', format: 'video' },
    });
    assert.equal(switched.data.psychologist.name, 'Dra. Beatriz Alencar');

    const marina = await login('marina@synapse.demo');
    const again = (await api('GET', `/psychologists/${lucas.id}`, { token: marina })).data.psychologist;
    assert.deepEqual(again.weeklyAvailability.find((d) => d.weekday === 2).times, ['18:00']);
  });

  test('when two people ask for the same free slot at once, only one gets it', async () => {
    const [first, second] = await Promise.all([
      registerEmployee('Davi Luz', 'davi@teste.dev'),
      registerEmployee('Elis Rocha', 'elis@teste.dev'),
    ]);
    const lucas = (await api('GET', '/psychologists?search=lucas', { token: first })).data.psychologists[0];
    const body = { psychologistId: lucas.id, weekday: 1, time: '09:00', format: 'video' };

    const results = await Promise.all([
      api('PUT', '/plan', { token: first, body }),
      api('PUT', '/plan', { token: second, body }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal(results.find((r) => r.status === 409).data.error.code, 'slot_taken');
  });

  test('only employees have a plan', async () => {
    const token = await login('camila@synapse.demo');
    assert.equal((await api('GET', '/plan', { token })).status, 403);
  });

  test('reschedules only inside the current week, to a free slot, before the session happens', async () => {
    const token = await login('marina@synapse.demo');

    const nextWeek = await api('POST', '/plan/reschedule', { token, body: { startsAt: '2026-10-08T10:00' } });
    assert.equal(nextWeek.status, 400);
    assert.equal(nextWeek.data.error.code, 'outside_week');

    // Thursday 10:00 is Bruno's fixed slot
    const taken = await api('POST', '/plan/reschedule', { token, body: { startsAt: '2026-10-01T10:00' } });
    assert.equal(taken.status, 409);

    const moved = await api('POST', '/plan/reschedule', { token, body: { startsAt: '2026-10-01T15:30' } });
    assert.equal(moved.status, 200);
    assert.equal(moved.data.plan.rescheduledTo, '2026-10-01T15:30');
    assert.equal(moved.data.plan.nextSession, '2026-10-01T15:30');
    // The fixed slot does not change
    assert.equal(moved.data.plan.time, '16:30');

    // After the moved session, the next one is the fixed slot of the following week
    clock.now = new Date(2026, 9, 1, 17, 0);
    const after = await api('GET', '/plan', { token });
    assert.equal(after.data.plan.doneThisWeek, true);
    assert.equal(after.data.plan.nextSession, '2026-10-07T16:30');

    const tooLate = await api('POST', '/plan/reschedule', { token, body: { startsAt: '2026-10-02T11:00' } });
    assert.equal(tooLate.status, 409);
    assert.equal(tooLate.data.error.code, 'week_done');
    clock.now = new Date(2026, 8, 28, 8, 0);
  });
});

describe('psychologist area', () => {
  test('lists patients with their fixed slot', async () => {
    const token = await login('camila@synapse.demo');
    const { data } = await api('GET', '/psi/patients', { token });
    assert.deepEqual(
      data.patients.map((p) => [p.name, p.weekday, p.time]),
      [
        ['Marina Silva', 3, '16:30'],
        ['Bruno Dias', 4, '10:00'],
      ]
    );
  });

  test('opens new slots but cannot close one held by a patient', async () => {
    const token = await login('camila@synapse.demo');
    const current = (await api('GET', '/psi/availability', { token })).data.slots;
    assert.equal(current.find((s) => s.weekday === 3 && s.time === '16:30').taken, true);

    const keep = current.map(({ weekday, time }) => ({ weekday, time }));
    const opened = await api('PUT', '/psi/availability', { token, body: { slots: [...keep, { weekday: 2, time: '08:00' }] } });
    assert.equal(opened.status, 200);
    assert.equal(opened.data.slots.some((s) => s.weekday === 2 && s.time === '08:00'), true);

    const withoutMarina = keep.filter((s) => !(s.weekday === 3 && s.time === '16:30'));
    const blocked = await api('PUT', '/psi/availability', { token, body: { slots: withoutMarina } });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.data.error.code, 'slot_in_use');
  });

  test('reads and updates the own profile, which changes what employees see', async () => {
    const token = await login('beatriz@synapse.demo');
    const before = (await api('GET', '/psi/profile', { token })).data.profile;
    assert.equal(before.name, 'Dra. Beatriz Alencar');
    assert.equal(before.status, 'active');
    assert.deepEqual(before.languages, ['Português']);

    const updated = await api('PUT', '/psi/profile', {
      token,
      body: {
        bio: '  Nova apresentação.  ',
        // sent out of catalog order and with a repeat
        specialties: ['TDAH', 'Luto', 'Depressão', 'Luto'],
        approaches: ['Psicoterapia Breve'],
        languages: ['Libras', 'Português'],
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.profile.bio, 'Nova apresentação.');
    assert.deepEqual(updated.data.profile.specialties, ['Depressão', 'Luto', 'TDAH']);
    assert.deepEqual(updated.data.profile.approaches, ['Psicoterapia Breve']);
    assert.deepEqual(updated.data.profile.languages, ['Português', 'Libras']);

    const marina = await login('marina@synapse.demo');
    const seen = (await api('GET', `/psychologists/${before.id}`, { token: marina })).data.psychologist;
    assert.equal(seen.bio, 'Nova apresentação.');
    assert.deepEqual(seen.specialties, ['Depressão', 'Luto', 'TDAH']);
    assert.equal(seen.status, undefined);

    const valid = { bio: 'x', specialties: ['Luto'], approaches: [], languages: ['Português'] };
    for (const change of [
      { specialties: [] },
      { specialties: ['Não existe no catálogo'] },
      { languages: [] },
      { approaches: ['Psicanálise', 'Logoterapia', 'Psicodrama', 'Mindfulness'] },
    ]) {
      const res = await api('PUT', '/psi/profile', { token, body: { ...valid, ...change } });
      assert.equal(res.status, 400, JSON.stringify(change));
    }
  });

  test('the catalog of specialties, approaches and languages is public', async () => {
    const { status, data } = await api('GET', '/catalog');
    assert.equal(status, 200);
    assert.ok(data.catalog.specialtyGroups.some((g) => g.items.includes('Síndrome de Burnout')));
    assert.ok(data.catalog.approaches.includes('Psicanálise'));
    assert.ok(data.catalog.languages.includes('Libras'));
    assert.equal(data.catalog.limits.specialties, 10);
  });

  test('scores each session of a patient and reads the history back', async () => {
    const token = await login('camila@synapse.demo');
    const patients = (await api('GET', '/psi/patients', { token })).data.patients;
    const marina = patients.find((p) => p.name === 'Marina Silva');
    const ofMarina = async () =>
      (await api('GET', '/psi/evaluations', { token })).data.evaluations.filter((e) => e.patientId === marina.id);

    // The demo history: six scored sessions, oldest first, the latest finished one (23/09) left open
    const history = await ofMarina();
    assert.deepEqual(history.map((e) => e.score), [4, 5, 5, 6, 7, 7]);
    assert.equal(history[0].date, '2026-08-12');
    assert.equal(history.at(-1).date, '2026-09-16');

    const path = `/psi/patients/${marina.id}/evaluations`;
    const saved = await api('PUT', `${path}/2026-09-23`, { token, body: { score: 8, comment: '  Semana tranquila.  ' } });
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.data.evaluation, { patientId: marina.id, date: '2026-09-23', score: 8, comment: 'Semana tranquila.' });

    // Scoring the same session again replaces the score
    const changed = await api('PUT', `${path}/2026-09-23`, { token, body: { score: 9 } });
    assert.deepEqual([changed.data.evaluation.score, changed.data.evaluation.comment], [9, '']);
    assert.deepEqual((await ofMarina()).map((e) => e.score), [4, 5, 5, 6, 7, 7, 9]);

    assert.equal((await api('DELETE', `${path}/2026-09-23`, { token })).status, 204);
    assert.equal((await ofMarina()).length, 6);
  });

  test('rejects bad scores, sessions that did not happen and people who are not patients', async () => {
    const token = await login('camila@synapse.demo');
    const patients = (await api('GET', '/psi/patients', { token })).data.patients;
    const marina = patients.find((p) => p.name === 'Marina Silva');
    const path = `/psi/patients/${marina.id}/evaluations`;

    for (const score of [0, 11, 7.5, '8', null]) {
      assert.equal((await api('PUT', `${path}/2026-09-23`, { token, body: { score } })).status, 400, String(score));
    }
    assert.equal((await api('PUT', `${path}/2026-09-23`, { token, body: { score: 7, comment: 'a'.repeat(501) } })).status, 400);
    assert.equal((await api('PUT', `${path}/2026-02-30`, { token, body: { score: 7 } })).status, 400);

    // The clock is on Monday 28/09: Wednesday's session has not happened yet
    const future = await api('PUT', `${path}/2026-09-30`, { token, body: { score: 7 } });
    assert.equal(future.data.error.code, 'session_not_held');
    const tooOld = await api('PUT', `${path}/2026-01-07`, { token, body: { score: 7 } });
    assert.equal(tooOld.data.error.code, 'before_first_session');

    // Another psychologist cannot score, read or delete Camila's patient
    const other = await login('beatriz@synapse.demo');
    assert.equal((await api('PUT', `${path}/2026-09-23`, { token: other, body: { score: 7 } })).status, 404);
    assert.equal((await api('DELETE', `${path}/2026-09-16`, { token: other })).status, 404);
    assert.deepEqual((await api('GET', '/psi/evaluations', { token: other })).data.evaluations, []);

    // The patient herself has no access to the scores
    const employee = await login('marina@synapse.demo');
    assert.equal((await api('GET', '/psi/evaluations', { token: employee })).status, 403);
  });

  test('the daily check-in is kept once per day and a very low index alerts the psychologist', async () => {
    const marina = await login('marina@synapse.demo');
    const camila = await login('camila@synapse.demo');
    const alerts = async (token = camila) => (await api('GET', '/psi/alerts', { token })).data.alerts;

    assert.equal((await api('GET', '/checkin', { token: marina })).data.today, null);
    assert.deepEqual(await alerts(), []);

    // A good day: saved, nobody is alerted
    const good = await api('PUT', '/checkin', { token: marina, body: { score: 82 } });
    assert.deepEqual(good.data, { today: { score: 82 }, alerted: false, psychologistName: null });
    assert.deepEqual((await api('GET', '/checkin', { token: marina })).data.today, { score: 82 });
    assert.deepEqual(await alerts(), []);

    // Doing it again the same day replaces the index; a very low one reaches her psychologist only
    const low = await api('PUT', '/checkin', { token: marina, body: { score: 45 } });
    assert.deepEqual(low.data, { today: { score: 45 }, alerted: true, psychologistName: 'Dra. Camila Rossi' });
    const [alert] = await alerts();
    assert.deepEqual([alert.name, alert.day, alert.score], ['Marina Silva', '2026-09-28', 45]);
    assert.deepEqual(await alerts(await login('beatriz@synapse.demo')), []);

    // Another psychologist cannot dismiss it; hers can, and it stays dismissed
    const patientId = alert.patientId;
    await api('POST', `/psi/alerts/${patientId}/seen`, { token: await login('beatriz@synapse.demo') });
    assert.equal((await alerts()).length, 1);
    assert.deepEqual((await api('POST', `/psi/alerts/${patientId}/seen`, { token: camila })).data.alerts, []);
    assert.deepEqual(await alerts(), []);

    // A new low answer on the same day alerts again; a better one clears it
    await api('PUT', '/checkin', { token: marina, body: { score: 50 } });
    assert.equal((await alerts()).length, 1);
    await api('PUT', '/checkin', { token: marina, body: { score: 51 } });
    assert.deepEqual(await alerts(), []);

    // The next day starts without a check-in
    const before = clock.now;
    clock.now = new Date(before.getFullYear(), before.getMonth(), before.getDate() + 1, 8, 0);
    try {
      assert.equal((await api('GET', '/checkin', { token: marina })).data.today, null);
    } finally {
      clock.now = before;
    }

    for (const score of [-1, 101, 70.5, '70', null]) {
      assert.equal((await api('PUT', '/checkin', { token: marina, body: { score } })).status, 400, String(score));
    }
    // Someone without a psychologist is not "alerted", and psychologists have no check-in
    const rafael = await login('rafael@synapse.demo');
    assert.equal((await api('PUT', '/checkin', { token: rafael, body: { score: 40 } })).data.alerted, false);
    assert.equal((await api('GET', '/checkin', { token: camila })).status, 403);
    assert.equal((await api('GET', '/psi/alerts', { token: marina })).status, 403);
  });

  test('a review is only accepted after the first session', async () => {
    const token = await registerEmployee('Nina Prado', 'nina@teste.dev');
    const { psychologists } = (await api('GET', '/psychologists', { token })).data;
    const beatriz = psychologists.find((p) => p.name === 'Dra. Beatriz Alencar');
    const { weekday, times } = beatriz.weeklyAvailability[0];
    const chosen = await api('PUT', '/plan', { token, body: { psychologistId: beatriz.id, weekday, time: times[0], format: 'video' } });
    assert.equal(chosen.status, 200);
    // The slot is taken at the database's real time; pin it to the test clock
    const { user } = (await api('GET', '/auth/me', { token })).data;
    await db.query(
      "UPDATE weekly_plans SET created_at = '2026-09-28T08:00'::timestamp AT TIME ZONE 'America/Sao_Paulo' WHERE employee_id = $1",
      [user.id]
    );

    const path = `/psychologists/${beatriz.id}`;
    assert.equal((await api('GET', `${path}/reviews`, { token })).data.reason, 'no_session_yet');
    assert.equal((await api('PUT', `${path}/review`, { token, body: { rating: 5 } })).status, 403);

    // Two weeks later the first session is behind her
    const before = clock.now;
    clock.now = new Date(before.getFullYear(), before.getMonth(), before.getDate() + 14, 8, 0);
    try {
      const saved = await api('PUT', `${path}/review`, { token, body: { rating: 4, comment: 'Boa primeira conversa.' } });
      assert.equal(saved.status, 200);
      assert.equal(saved.data.reviews[0].mine, true);
    } finally {
      clock.now = before;
    }
  });

  test('employees cannot reach the psychologist area', async () => {
    const token = await login('marina@synapse.demo');
    assert.equal((await api('GET', '/psi/patients', { token })).status, 403);
  });
});
