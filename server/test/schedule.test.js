import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toLocalIso, zonedNow } from '../src/schedule.js';

test('the clock follows the app time zone, not the server one', () => {
  // 02:00 UTC on 1 October is still 23:00 of 30 September in São Paulo (UTC-3)
  assert.equal(toLocalIso(zonedNow(new Date('2026-10-01T02:00:00Z'))), '2026-09-30T23:00');
  assert.equal(toLocalIso(zonedNow(new Date('2026-09-30T19:30:00Z'))), '2026-09-30T16:30');
});
