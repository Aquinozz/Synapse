import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';
import { seed } from '../src/seed.js';

const SEED = { password: 'senha-de-teste-123', companyCode: 'TESTE-01' };

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
    body: { role: 'employee', name, email, password: 'outra-senha-123', companyCode: SEED.companyCode },
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
      'TRUNCATE reschedules, weekly_plans, availability, psychologist_tags, psychologists, login_attempts, auth_tokens, users, companies RESTART IDENTITY CASCADE'
    );
  }
  await seed(db, SEED);
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
      body: { role: 'employee', name: 'Ana', email: 'ana@teste.dev', password: 'senha-forte-1', companyCode: 'NAO-EXISTE' },
    });
    assert.equal(status, 400);
    assert.equal(data.error.code, 'unknown_company_code');
  });

  test('registers an employee, rejects a duplicate e-mail and a short password', async () => {
    const body = { role: 'employee', name: 'Ana Lima', email: 'Ana@Teste.dev', password: 'senha-forte-1', companyCode: 'teste-01' };
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
    assert.equal(await seed(db, SEED), false);

    const token = await login('rafael@synapse.demo');
    const { data } = await api('GET', '/plan', { token });
    assert.equal(data.plan, null);
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

    const search = await api('GET', '/psychologists?search=sono', { token });
    assert.deepEqual(search.data.psychologists.map((p) => p.name), ['Dr. Lucas Mendonça']);
  });

  test('a new psychologist stays hidden until approved', async () => {
    const created = await api('POST', '/auth/register', {
      body: { role: 'psychologist', name: 'Dr. Novo', email: 'novo@teste.dev', password: 'senha-forte-1', reg: 'CRP 01/00001', title: 'Psicólogo Clínico' },
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

    const updated = await api('PUT', '/psi/profile', {
      token,
      body: { bio: '  Nova apresentação.  ', tags: [before.tags[0], { label: 'Luto & Perdas', icon: 'favorite' }] },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.profile.bio, 'Nova apresentação.');
    assert.deepEqual(updated.data.profile.tags.map((t) => t.label), ['Avaliação Médica & TDAH', 'Luto & Perdas']);
    // The kept tag keeps its category
    assert.equal(updated.data.profile.tags[0].category, 'medical');

    const marina = await login('marina@synapse.demo');
    const seen = (await api('GET', `/psychologists/${before.id}`, { token: marina })).data.psychologist;
    assert.equal(seen.bio, 'Nova apresentação.');
    assert.equal(seen.status, undefined);

    const invalid = await api('PUT', '/psi/profile', { token, body: { bio: 'x', tags: [] } });
    assert.equal(invalid.status, 400);
  });

  test('employees cannot reach the psychologist area', async () => {
    const token = await login('marina@synapse.demo');
    assert.equal((await api('GET', '/psi/patients', { token })).status, 403);
  });
});
