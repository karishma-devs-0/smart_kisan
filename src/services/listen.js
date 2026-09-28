/**
 * Listening — speech to text in Hindi, Punjabi and English.
 *
 * The companion to speech.js. Together they let a farmer who cannot
 * comfortably read or type still use the app.
 *
 * WHERE A MISHEARD WORD IS SAFE, AND WHERE IT IS NOT
 * A recogniser guesses. That is fine for moving between screens - the farmer
 * lands somewhere and can see whether it is where he meant - and fine for
 * dictating into a box he reads before saving. It is not fine for anything
 * acted on without being seen: a misheard quantity, a misheard chemical name.
 *
 * So this returns text and never acts on it. Every caller shows what was heard
 * and waits for the farmer to agree. Nothing here writes to a record.
 *
 * WHY THIS LIBRARY
 * @react-native-voice/voice was tried first and cannot build against a current
 * toolchain: it targets Android SDK 28, resolves through jcenter, which closed
 * in 2021, and omits the namespace that modern Gradle requires. This one is
 * maintained, built for Expo, and ships its own config plugin.
 *
 * OFFLINE
 * Android's recogniser works without a connection once the language pack is
 * downloaded, which Hindi and English usually are. Punjabi often is not, and
 * then it needs a connection or fails - reported honestly rather than left
 * hanging.
 */

// Regional tags. A bare 'pa' is frequently not matched at all by the Android
// recogniser, where 'pa-IN' is.
const LOCALES = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
};

// The three the app can currently listen in. Speaking covers all ten; the
// recogniser's support for the rest is patchy enough that offering it would
// mostly disappoint.
export const LISTENING_LANGUAGES = Object.keys(LOCALES);

export function canListenIn(language) {
  return LISTENING_LANGUAGES.includes(language);
}

function localeFor(language) {
  return LOCALES[language] || LOCALES.en;
}

/**
 * Loaded on demand, not at import.
 *
 * This is a native module and Expo Go cannot load one, so importing it at the
 * top of the file crashes the app before the login screen - which is exactly
 * what the weed model loader did until it was made lazy.
 */
let mod;
let unavailable = false;

function getModule() {
  if (mod || unavailable) return mod;
  try {
    // eslint-disable-next-line global-require
    const m = require('expo-speech-recognition');
    mod = m?.ExpoSpeechRecognitionModule || null;
    if (!mod) unavailable = true;
  } catch {
    unavailable = true;
    mod = null;
  }
  return mod;
}

/**
 * Asks for the microphone and speech recognition.
 *
 * Requested at the moment of use rather than at start-up: a permission box on
 * first launch, before the farmer has seen why, is usually refused.
 */
export async function ensureMicPermission() {
  const m = getModule();
  if (!m) return false;
  try {
    const result = await m.requestPermissionsAsync();
    return Boolean(result?.granted);
  } catch {
    return false;
  }
}

export async function isListeningAvailable() {
  return Boolean(getModule());
}

let active = false;

/**
 * Listens once and resolves with what was heard.
 *
 * @param {string} language  the app's language code
 * @param {{onPartial?: Function, onStart?: Function}} handlers
 * @returns {Promise<{text: string|null, error: string|null}>}
 */
export async function listenOnce(language = 'en', handlers = {}) {
  const m = getModule();
  if (!m) return { text: null, error: 'could-not-start' };

  if (active) await stopListening();

  const ok = await ensureMicPermission();
  if (!ok) return { text: null, error: 'microphone-denied' };

  return new Promise((resolve) => {
    let settled = false;
    const subs = [];

    const finish = (result) => {
      if (settled) return;
      settled = true;
      active = false;
      subs.forEach((sub) => {
        try { sub?.remove?.(); } catch { /* already gone */ }
      });
      resolve(result);
    };

    try {
      subs.push(m.addListener('start', () => handlers.onStart?.()));

      subs.push(m.addListener('result', (event) => {
        const transcript = (event?.results?.[0]?.transcript || '').trim();
        if (!event?.isFinal) {
          // Shown as the farmer speaks so he can see it is hearing him. Not
          // acted on - a partial is the recogniser's first guess and changes.
          if (transcript) handlers.onPartial?.(transcript);
          return;
        }
        finish({ text: transcript || null, error: transcript ? null : 'nothing-heard' });
      }));

      subs.push(m.addListener('error', (event) => {
        const code = String(event?.error || 'unknown');
        // "no-speech" and a timeout both mean the same thing to a farmer:
        // it did not catch that.
        const nothing = /no-speech|no_match|speech-timeout/i.test(code);
        finish({ text: null, error: nothing ? 'nothing-heard' : code });
      }));

      // Fires when recognition ends without a final result - a farmer who
      // taps and says nothing would otherwise wait on a promise forever.
      subs.push(m.addListener('end', () => {
        finish({ text: null, error: 'nothing-heard' });
      }));

      active = true;
      m.start({
        lang: localeFor(language),
        interimResults: true,
        continuous: false,
        // Android will use an on-device model when the language pack is
        // installed, which is what makes this work in a field with no signal.
        requiresOnDeviceRecognition: false,
      });
    } catch (err) {
      finish({ text: null, error: err?.message || 'could-not-start' });
    }
  });
}

export async function stopListening() {
  active = false;
  const m = getModule();
  if (!m) return;
  try {
    m.abort();
  } catch {
    // Nothing was listening, or the recogniser has already gone.
  }
}

/**
 * Plain wording for why listening failed.
 *
 * A raw error code tells a farmer nothing. Each of these says what to do
 * instead.
 */
export function explainError(code, t) {
  switch (code) {
    case 'microphone-denied':
      return t('listen.micDenied',
        'SmartKisan needs the microphone to hear you. You can allow it in '
        + 'your phone settings.');
    case 'nothing-heard':
      return t('listen.nothingHeard',
        'I did not catch that. Try again, a little closer to the phone.');
    case 'language-not-supported':
      return t('listen.languageMissing',
        'Your phone cannot listen in this language yet. You may be able to '
        + 'add it in your phone\'s voice settings.');
    case 'could-not-start':
      return t('listen.cannotStart',
        'Listening is not available on this phone.');
    default:
      return t('listen.failed',
        'Something went wrong while listening. Please try again.');
  }
}

export default {
  listenOnce,
  stopListening,
  isListeningAvailable,
  ensureMicPermission,
  canListenIn,
  explainError,
  LISTENING_LANGUAGES,
};
