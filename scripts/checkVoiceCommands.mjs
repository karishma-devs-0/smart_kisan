/**
 * Checks that spoken phrases open the screen the farmer meant.
 *
 * Run with:  npm run check:voice
 *
 * There is no test runner in this project, so this follows the same shape as
 * the backend's e2eCheck.js: a plain script that prints what passed and exits
 * non-zero if anything did not.
 *
 * voiceCommands.js is app source written as an ES module, and node will not
 * import a .js file that way without the whole package being type: module. So
 * the source is copied to a temporary .mjs and imported from there. Nothing is
 * transformed - the file under test is the file that ships.
 *
 * The awkward cases are the ones worth keeping. Every phrase marked below with
 * a reason was a real defect found by probing, not an invented edge case.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, '..', 'src', 'services', 'voiceCommands.js');

const CASES = [
  // ── Whole-word matching ────────────────────────────────────────────────
  // "ph" was in the soil list and matched as a substring, so any word
  // containing those two letters opened the soil screen.
  ['photo kheecho', null, 'ph inside photo must not match'],
  ['graph dikhao', null, 'ph inside graph must not match'],
  ['mera phone kahan hai', null, 'ph inside phone must not match'],

  // ── Two screens named in one sentence ──────────────────────────────────
  // The one asked for first wins. Ranking by word length instead let a longer
  // word said later win.
  ['mausam aur mitti dono', 'WeatherTab', 'first named wins'],
  ['mitti aur mausam dono', 'SoilTab', 'first named wins, other order'],

  // ── Overlapping words at the same position ─────────────────────────────
  ['soil moisture batao', 'SoilTab', 'longer phrase preferred'],
  ['soil batao', 'SoilTab', 'shorter still matches'],

  // ── English ────────────────────────────────────────────────────────────
  ['weather please', 'WeatherTab'],
  ['show my pumps', 'PumpsTab', 'plural of a singular entry'],
  ['show my pump', 'PumpsTab', 'singular still matches'],
  ['my fields', 'MyFields', 'plural entry, plural spoken'],
  ['my field', 'MyFields', 'plural entry, singular spoken'],
  ['my crops', 'MyCrops'],
  ['harvest', 'Harvests'],
  ['fertiliser calculator', 'FertilizerCalculator'],
  ['weed detection kholo', 'WeedDetection'],

  // ── Devanagari ─────────────────────────────────────────────────────────
  ['मौसम दिखाओ', 'WeatherTab'],
  ['मिट्टी दिखाओ', 'SoilTab'],
  ['कटाई', 'Harvests'],
  ['योजना', 'GovernmentSchemes'],
  ['मौसम दिखाओ।', 'WeatherTab', 'the danda must not block a match'],

  // ── Gurmukhi ───────────────────────────────────────────────────────────
  ['ਮੌਸਮ ਵਿਖਾਓ', 'WeatherTab'],
  ['ਪੰਪ', 'PumpsTab'],
  ['ਵਾਢੀ ਦਿਖਾਓ', 'Harvests'],
  ['ਖਾਦ', 'FertilizerCalculator'],

  // ── Romanised ──────────────────────────────────────────────────────────
  // A phone set to English transcribes Hindi speech in Latin letters, which is
  // the common case and matched nothing at first.
  ['mujhe mausam dikhao', 'WeatherTab'],
  ['mosam kaisa hai', 'WeatherTab', 'spelling variant'],
  ['mitti ki jaanch', 'SoilTab'],
  ['pump chalu karo', 'PumpsTab'],
  ['sinchai', 'PumpsTab'],
  ['meri fasal', 'MyCrops'],
  ['phasal dikhao', 'MyCrops', 'must beat the ph in the soil list'],
  ['katai dikhao', 'Harvests'],
  ['khad kitni daalun', 'FertilizerCalculator'],
  ['rog', 'DiseaseDetection'],
  ['sarkari yojana', 'GovernmentSchemes'],
  ['khet dikhao', 'MyFields'],
  ['zameen', 'MyFields'],
  ['ghar', 'Home'],

  // ── Nothing to match ───────────────────────────────────────────────────
  ['kuch bhi bakwaas', null],
  ['', null],
  ['   ', null, 'whitespace only'],
  ['Weather, please!', 'WeatherTab', 'punctuation must not block a match'],
];

async function main() {
  const tmp = path.join(os.tmpdir(), `voiceCommands.${process.pid}.mjs`);
  fs.copyFileSync(source, tmp);

  let matchCommand;
  try {
    ({ matchCommand } = await import(pathToFileURL(tmp).href));
  } finally {
    fs.rmSync(tmp, { force: true });
  }

  let passed = 0;
  const failures = [];

  for (const [said, want, why] of CASES) {
    const got = matchCommand(said)?.screen ?? null;
    if (got === want) {
      passed += 1;
      continue;
    }
    failures.push({ said, want, got, why });
  }

  console.log(`\n  ${passed}/${CASES.length} phrases open the right screen`);

  if (failures.length) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    "${f.said}"`);
      console.log(`      got ${f.got ?? '(none)'}, expected ${f.want ?? '(none)'}`
        + (f.why ? `  - ${f.why}` : ''));
    }
    console.log('');
    process.exit(1);
  }

  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
