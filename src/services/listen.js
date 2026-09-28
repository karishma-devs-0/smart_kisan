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
 * OFFLINE
 * Android's recogniser works without a connection once the language pack is
 * downloaded, which Hindi and English usually are. Punjabi often is not, and
 * then it needs a connection or fails - reported honestly rather than left
 * hanging.
 */
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Loaded on demand, not at import.
 *
 * This is a native module and Expo Go cannot load one, so importing it at the
 * top of the file crashes the app before the login screen - which is exactly
 * what the weed model loader did until it was made lazy. Resolved the first
 * time listening is used, and absent quietly the rest of the time.
 */
let VoiceModule;
let voiceUnavailable = false;

function getVoice() {
  if (VoiceModule || voiceUnavailable) return VoiceModule;
  try {
    // eslint-disable-next-line global-require
    const mod = require('@react-native-voice/voice');
    VoiceModule = mod?.default || mod;
  } catch {
    voiceUnavailable = true;
    VoiceModule = null;
  }
  return VoiceModule;
}

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
 * Asks for the microphone.
 *
 * Requested at the moment of use rather than at start-up: a permission box on
 * first launch, before the farmer has seen why, is usually refused.
 */
export async function ensureMicPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone',
        message: 'SmartKisan needs the microphone so you can speak instead of typing.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function isListeningAvailable() {
  const Voice = getVoice();
  if (!Voice) return false;
  try {
    return Boolean(await Voice.isAvailable());
  } catch {
    return false;
  }
}

let active = false;

/**
 * Listens once and resolves with what was heard.
 *
 * @param {string} language  the app's language code
 * @param {{onPartial?: Function, onStart?: Function, onVolume?: Function}} handlers
 * @returns {Promise<{text: string|null, error: string|null}>}
 */
export async function listenOnce(language = 'en', handlers = {}) {
  const Voice = getVoice();
  if (!Voice) return { text: null, error: 'could-not-start' };

  if (active) await stopListening();

  const ok = await ensureMicPermission();
  if (!ok) {
    return { text: null, error: 'microphone-denied' };
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      active = false;
      cleanup();
      resolve(result);
    };

    const cleanup = () => {
      Voice.onSpeechStart = null;
      Voice.onSpeechPartialResults = null;
      Voice.onSpeechResults = null;
      Voice.onSpeechError = null;
      Voice.onSpeechVolumeChanged = null;
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };

    Voice.onSpeechStart = () => handlers.onStart?.();

    // Shown as the farmer speaks so he can see it is hearing him. Not acted
    // on - a partial result is the recogniser's first guess and changes.
    Voice.onSpeechPartialResults = (e) => {
      const guess = e?.value?.[0];
      if (guess) handlers.onPartial?.(guess);
    };

    Voice.onSpeechVolumeChanged = (e) => handlers.onVolume?.(e?.value);

    Voice.onSpeechResults = (e) => {
      const text = (e?.value?.[0] || '').trim();
      finish({ text: text || null, error: text ? null : 'nothing-heard' });
    };

    Voice.onSpeechError = (e) => {
      const code = String(e?.error?.code || e?.error?.message || 'unknown');
      // Android reports "no match" and "speech timeout" as errors; to a farmer
      // they both mean the same thing - it did not catch that.
      const nothing = /no match|7|speech timeout|6/i.test(code);
      finish({ text: null, error: nothing ? 'nothing-heard' : code });
    };

    active = true;
    Voice.start(localeFor(language)).catch((err) => {
      finish({ text: null, error: err?.message || 'could-not-start' });
    });
  });
}

export async function stopListening() {
  active = false;
  const Voice = getVoice();
  if (!Voice) return;
  try {
    await Voice.stop();
    await Voice.destroy();
    Voice.removeAllListeners();
  } catch {
    // Nothing was listening, or the recogniser has already gone.
  }
}

/**
 * Plain wording for why listening failed.
 *
 * "Error 7" tells a farmer nothing. Each of these says what to do instead.
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
