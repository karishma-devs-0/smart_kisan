/**
 * End-to-end API check, following the same sequence the app does.
 *
 * Registers a throwaway user, walks the real user journey — onboarding, farm
 * records, sensor readings, pump listing — verifies isolation from another
 * account, then deletes the account and confirms the data is actually gone.
 *
 * Written to be re-run: every account it creates is deleted at the end, so it
 * leaves nothing behind and can be pointed at production safely.
 *
 * Usage:
 *   node scripts/e2eCheck.js                       # live deployment
 *   API=http://localhost:5000/api node scripts/e2eCheck.js
 */

const API = process.env.API || 'https://smartkisan-api.onrender.com/api';

// The free tier sleeps after ~15 min idle and takes up to a minute to restart,
// so the first call needs a budget well beyond a normal request.
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 90000;

const results = [];
let failures = 0;

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  if (!ok) failures++;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  ${mark}  ${step}${detail ? '  — ' + detail : ''}`);
}

async function call(method, path, { token, body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API + path, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      // Some responses legitimately carry no JSON body.
    }
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

const rand = () => Math.random().toString(36).slice(2, 8);

async function main() {
  console.log(`\nSmartKisan API end-to-end check\n  target: ${API}\n`);

  // ── 0. Service is up ─────────────────────────────────────────────────────
  console.log('0. Service');
  const started = Date.now();
  const health = await call('GET', '/health');
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  record('health responds', health.status === 200, `${elapsed}s`);
  record(
    'health verifies the database',
    health.data?.database?.status === 'ok',
    health.data?.database
      ? `db latency ${health.data.database.latencyMs}ms`
      : 'no database field — old build?'
  );
  if (health.status !== 200) {
    console.log('\nService unreachable; stopping.\n');
    return summarise();
  }

  // ── 1. Register, exactly as the app's sign-up does ───────────────────────
  console.log('\n1. Sign up');
  const email = `e2e_${rand()}@example.com`;
  const password = 'E2ECheck@2026';
  const reg = await call('POST', '/auth/register', {
    body: { email, password, firstName: 'E2E Check' },
  });
  const token = reg.data?.token;
  // Accepts 200 or 201. Register replies 200 while every other create replies
  // 201 — an inconsistency worth tidying one day, but the token is what the app
  // actually depends on, so that is what this asserts.
  record('register returns a token', reg.status < 300 && !!token, `HTTP ${reg.status}`);
  if (!token) return summarise();

  record(
    'register returns the user',
    !!reg.data?.user?.id,
    reg.data?.user?.email || 'no user object'
  );

  // ── 2. Sign in with those credentials ────────────────────────────────────
  console.log('\n2. Sign in');
  const login = await call('POST', '/auth/login', { body: { email, password } });
  record('login succeeds', login.status === 200 && !!login.data?.token, `HTTP ${login.status}`);

  const wrong = await call('POST', '/auth/login', {
    body: { email, password: 'definitely-wrong' },
  });
  record('wrong password rejected', wrong.status === 401, `HTTP ${wrong.status}`);

  // ── 3. Fresh account looks empty, as the app expects on first launch ─────
  console.log('\n3. First launch state');
  const before = await call('GET', '/profile', { token });
  record('profile reports not onboarded', before.data?.onboarded === false,
    `onboarded=${before.data?.onboarded}`);
  record('all counts start at zero',
    before.data?.counts && Object.values(before.data.counts).every((n) => n === 0),
    JSON.stringify(before.data?.counts));

  const emptySoil = await call('GET', '/soil', { token });
  record('soil is null before any sensor reports', emptySoil.data?.soil === null,
    `soil=${JSON.stringify(emptySoil.data?.soil)}`);

  // ── 4. Onboarding, as the setup wizard submits it ────────────────────────
  console.log('\n4. Onboarding');
  const onboard = await call('POST', '/profile/onboarding', {
    token,
    body: {
      farmName: 'E2E Test Farm',
      farmType: 'crop',
      farmSize: 6,
      sizeBand: 'medium',
      sizeUnit: 'acre',
      locationName: 'Ludhiana, Punjab',
      latitude: 30.901,
      longitude: 75.857,
      language: 'pa',
      fields: [
        { name: 'North Plot', area: 3.5, soilType: 'Loam' },
        { name: 'South Plot', area: 2.5, soilType: 'Clay' },
      ],
      crops: [
        { name: 'Wheat', fieldName: 'North Plot' },
        { name: 'Rice', fieldName: 'South Plot' },
        { name: 'Mustard', fieldName: null },
      ],
      devices: [{ name: 'Soil Sensor A', type: 'soil', fieldName: 'North Plot' }],
    },
  });
  record('onboarding provisions the farm', onboard.status === 201, `HTTP ${onboard.status}`);
  record('fields created', onboard.data?.fields?.length === 2,
    `${onboard.data?.fields?.length} fields`);
  record('crops created', onboard.data?.crops?.length === 3,
    `${onboard.data?.crops?.length} crops`);

  const linked = (onboard.data?.crops || []).filter((c) => c.field_id).length;
  record('crops linked to their fields by name', linked === 2, `${linked} of 3 linked`);

  const unassigned = (onboard.data?.crops || []).find((c) => c.name === 'Mustard');
  record('crop with no field stays unassigned', unassigned && unassigned.field_id === null,
    `field_id=${unassigned?.field_id}`);

  // ── 5. Dashboard read-back ───────────────────────────────────────────────
  console.log('\n5. Dashboard');
  const profile = await call('GET', '/profile', { token });
  record('profile now onboarded', profile.data?.onboarded === true, '');
  record('farm name persisted', profile.data?.profile?.farm_name === 'E2E Test Farm',
    profile.data?.profile?.farm_name);
  record('size band persisted alongside acreage',
    profile.data?.profile?.size_band === 'medium' && profile.data?.profile?.farm_size === 6,
    `${profile.data?.profile?.farm_size} / ${profile.data?.profile?.size_band}`);
  record('counts reflect what was created',
    profile.data?.counts?.fields === 2 && profile.data?.counts?.crops === 3,
    JSON.stringify(profile.data?.counts));

  const fields = await call('GET', '/fields', { token });
  record('field list matches', fields.data?.count === 2,
    (fields.data?.fields || []).map((f) => f.name).join(', '));

  const crops = await call('GET', '/crops', { token });
  record('crop list matches', crops.data?.count === 3,
    (crops.data?.crops || []).map((c) => c.name).join(', '));

  // ── 5b. Profile screen save ──────────────────────────────────────────────
  // The profile screen shows one form over two records: name and phone on the
  // user, farm name and location on the profile. Both halves are checked here
  // because the screen previously persisted neither — it applied edits to
  // local state only, so they were gone on the next launch.
  console.log('\n5b. Profile edits');

  const acct = await call('PUT', '/auth/me', {
    token,
    body: { name: 'Renamed Farmer', phone: '9812345670' },
  });
  record('account update accepted', acct.status === 200, `HTTP ${acct.status}`);
  record('name and phone come back updated',
    acct.data?.user?.name === 'Renamed Farmer' && acct.data?.user?.phone === '9812345670',
    `${acct.data?.user?.name} / ${acct.data?.user?.phone}`);

  const badPhone = await call('PUT', '/auth/me', {
    token,
    body: { name: 'Renamed Farmer', phone: '12345' },
  });
  record('malformed phone is rejected', badPhone.status === 400, `HTTP ${badPhone.status}`);

  const blankName = await call('PUT', '/auth/me', { token, body: { name: '   ' } });
  record('blank name is rejected', blankName.status === 400, `HTTP ${blankName.status}`);

  const farmEdit = await call('PUT', '/profile', {
    token,
    body: { farmName: 'Renamed Farm', locationName: 'Ludhiana, Punjab' },
  });
  record('farm name and location update accepted', farmEdit.status === 200,
    `HTTP ${farmEdit.status}`);

  // The screen sends only the two fields it edits, so everything else on the
  // profile has to survive the write untouched.
  const afterEdit = await call('GET', '/profile', { token });
  const ap = afterEdit.data?.profile;
  record('edits persisted and read back',
    ap?.farm_name === 'Renamed Farm' && ap?.location_name === 'Ludhiana, Punjab',
    `${ap?.farm_name} / ${ap?.location_name}`);
  record('untouched profile columns survive the edit',
    ap?.size_band === 'medium' && Number(ap?.farm_size) === 6 && ap?.farm_type === 'crop',
    `band=${ap?.size_band} size=${ap?.farm_size} type=${ap?.farm_type}`);

  // ── 6. Editing farm records ──────────────────────────────────────────────
  console.log('\n6. Farm record edits');
  const newField = await call('POST', '/fields', {
    token,
    body: { name: 'East Plot', area: 1.5, soilType: 'Sandy' },
  });
  record('create a field', newField.status === 201, `HTTP ${newField.status}`);
  const fieldId = newField.data?.field?.id;

  const patched = await call('PUT', `/fields/${fieldId}`, { token, body: { area: 9.9 } });
  const pf = patched.data?.field;
  record('partial update leaves other columns alone',
    pf?.area === 9.9 && pf?.name === 'East Plot' && pf?.soil_type === 'Sandy',
    `area=${pf?.area} name=${pf?.name} soil=${pf?.soil_type}`);

  const badArea = await call('POST', '/fields', { token, body: { name: 'Bad', area: 'abc' } });
  record('invalid input rejected with a reason', badArea.status === 400,
    badArea.data?.error || `HTTP ${badArea.status}`);

  const noName = await call('POST', '/fields', { token, body: { area: 5 } });
  record('missing required field rejected', noName.status === 400,
    noName.data?.error || `HTTP ${noName.status}`);

  const del = await call('DELETE', `/fields/${fieldId}`, { token });
  record('delete a field', del.status === 200, `HTTP ${del.status}`);

  // ── 7. Sensor readings ───────────────────────────────────────────────────
  console.log('\n7. Sensor data');
  const reading = await call('POST', '/soil', {
    token,
    body: { moisture: 45.2, temperature: 27, pH: 6.8, nitrogen: 120, phosphorus: 40, potassium: 85 },
  });
  record('record a soil reading', reading.status === 201, `HTTP ${reading.status}`);

  const soil = await call('GET', '/soil', { token });
  record('current reading reads back', soil.data?.soil?.moisture === 45.2,
    `moisture=${soil.data?.soil?.moisture}`);

  const history = await call('GET', '/soil/history?days=7', { token });
  record('history records the reading', history.data?.count >= 1,
    `${history.data?.count} entries`);

  // ── 8. Other collections the app reads ───────────────────────────────────
  console.log('\n8. Other collections');
  const devices = await call('GET', '/devices', { token });
  record('devices list', devices.status === 200, `${devices.data?.count} devices`);

  const pumps = await call('GET', '/pumps', { token });
  record('pumps list', pumps.status === 200, `${pumps.data?.count ?? 0} pumps`);

  // ── 8b. Pump run recording and the dashboard summary ─────────────────────
  // The dashboard's "Today" card used to show activePumps * 500 litres and
  // similar invented arithmetic. It now reads real run history, so this checks
  // the whole chain: a run is recorded at all (pump_history was empty because
  // every insert named a column that does not exist), and the totals derived
  // from it are right.
  console.log('\n8b. Pump runs');

  const newPump = await call('POST', '/pumps', {
    token,
    body: { name: 'E2E Pump', type: 'Submersible', flowRate: 60, powerRating: '2' },
  });
  record('create a pump', newPump.status === 201, `HTTP ${newPump.status}`);
  const pumpId = newPump.data?.pump?.id;

  if (pumpId) {
    const on = await call('POST', `/pumps/${pumpId}/control`, {
      token,
      body: { action: 'on' },
    });
    // This answered 500 before: the pump switched, then the history insert
    // threw inside the same try and the caller was told it had failed.
    record('turning a pump on succeeds', on.status === 200, `HTTP ${on.status}`);

    // Let it run, so the recorded duration is not zero.
    await new Promise((r) => setTimeout(r, 2500));

    const off = await call('POST', `/pumps/${pumpId}/control`, {
      token,
      body: { action: 'off' },
    });
    record('turning a pump off succeeds', off.status === 200, `HTTP ${off.status}`);

    const summary = await call('GET', '/pumps/summary/today', { token });
    const sm = summary.data?.summary;
    record('run summary loads', summary.status === 200, `HTTP ${summary.status}`);
    record('the run was actually recorded', sm?.runCount > 0 && sm?.runSeconds > 0,
      `runs=${sm?.runCount} seconds=${sm?.runSeconds}`);

    // 60 L/min over the seconds it ran, and 2 HP over the same period.
    const expectedLitres = Math.round((sm?.runSeconds / 60) * 60);
    record('litres derived from flow rate and run time',
      Math.abs(sm?.litres - expectedLitres) <= 1,
      `${sm?.litres} L, expected ~${expectedLitres}`);

    const expectedKwh = Number(((sm?.runSeconds / 3600) * 2 * 0.7457).toFixed(2));
    record('energy derived from horsepower and run time',
      Math.abs(sm?.kwh - expectedKwh) <= 0.01,
      `${sm?.kwh} kWh, expected ~${expectedKwh}`);

    record('every run had a usable rating', sm?.unratedRuns === 0,
      `${sm?.unratedRuns} unrated`);

    await call('DELETE', `/pumps/${pumpId}`, { token });
  }

  // ── 9. Isolation from a second account ───────────────────────────────────
  console.log('\n9. Isolation');
  const otherEmail = `e2e_other_${rand()}@example.com`;
  const other = await call('POST', '/auth/register', {
    body: { email: otherEmail, password, firstName: 'Other' },
  });
  const otherToken = other.data?.token;
  record('second account created', !!otherToken, '');

  if (otherToken) {
    const theirFields = await call('GET', '/fields', { token: otherToken });
    record('second user sees none of the first user data', theirFields.data?.count === 0,
      `${theirFields.data?.count} fields`);

    const firstFieldId = (fields.data?.fields || [])[0]?.id;
    const stolen = await call('GET', `/fields/${firstFieldId}`, { token: otherToken });
    record('direct access to another user record is refused', stolen.status === 404,
      `HTTP ${stolen.status}`);

    const theirProfile = await call('GET', '/profile', { token: otherToken });
    record('second user profile is independent', theirProfile.data?.onboarded === false, '');
  }

  // ── 10. Auth enforcement ─────────────────────────────────────────────────
  console.log('\n10. Auth enforcement');
  const anon = await call('GET', '/fields');
  record('no token is refused', anon.status === 401, `HTTP ${anon.status}`);

  const bogus = await call('GET', '/fields', { token: 'not-a-real-token' });
  record('invalid token is refused', bogus.status === 401, `HTTP ${bogus.status}`);

  // ── 11. Account deletion actually removes the data ───────────────────────
  console.log('\n11. Account deletion');
  const removed = await call('DELETE', '/auth/delete-account', { token });
  record('delete-account succeeds', removed.status === 200, `HTTP ${removed.status}`);

  const afterDelete = await call('POST', '/auth/login', { body: { email, password } });
  record('deleted account can no longer sign in', afterDelete.status === 401,
    `HTTP ${afterDelete.status}`);

  const staleToken = await call('GET', '/fields', { token });
  const staleOk = staleToken.status === 401 || staleToken.data?.count === 0;
  record('old token returns no data after deletion', staleOk,
    `HTTP ${staleToken.status}, count=${staleToken.data?.count}`);

  // Clean up the second account too, so repeated runs leave nothing behind.
  if (otherToken) {
    const cleanup = await call('DELETE', '/auth/delete-account', { token: otherToken });
    record('second account cleaned up', cleanup.status === 200, `HTTP ${cleanup.status}`);
  }

  summarise();
}

function summarise() {
  const total = results.length;
  const passed = total - failures;
  console.log('\n' + '='.repeat(58));
  console.log(`  ${passed}/${total} checks passed`);
  if (failures) {
    console.log('\n  Failures:');
    results.filter((r) => !r.ok).forEach((r) => {
      console.log(`    - ${r.step}${r.detail ? '  (' + r.detail + ')' : ''}`);
    });
  }
  console.log('='.repeat(58) + '\n');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error('\nCheck aborted:', err.message);
  process.exit(1);
});
