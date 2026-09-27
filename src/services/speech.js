/**
 * Reading the app aloud.
 *
 * The app is translated into ten languages, which does nothing for a farmer
 * who reads little - the words are there, they are just in writing. This is
 * the largest gap between what the app does and who it is for.
 *
 * Text to speech only, not voice commands. Speaking an answer is useful on its
 * own and works offline once the language pack is on the phone; listening
 * needs a speech recogniser, network for most languages, and handling of what
 * happens when it mishears a chemical name. One is worth having now, the other
 * needs thinking about first.
 *
 * WHAT WILL NOT WORK, AND WHY
 * Speech uses the phone's own engine. Android ships Google TTS with Hindi,
 * Bengali, Tamil and Telugu commonly present, but a given phone may not have
 * the pack for a given language installed, and several of the ten have poor
 * support. isLanguageAvailable() answers honestly for the current phone so the
 * app can hide the button rather than offer one that does nothing.
 */
import * as Speech from 'expo-speech';

// The app's language codes mapped to BCP-47 tags the speech engine expects.
// Regional tags matter: 'pa-IN' is Punjabi as spoken here, and a bare 'pa' is
// often not matched at all.
const VOICE_TAGS = {
  en: 'en-IN',   // Indian English before en-US: the accent reads local names
  hi: 'hi-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
};

// Slower than default. The stock rate is pitched at someone reading their own
// phone in their first language, and these are often neither.
const RATE = 0.85;

let cachedVoices = null;

function tagFor(language) {
  return VOICE_TAGS[language] || VOICE_TAGS.en;
}

/**
 * The voices this phone actually has, read once.
 *
 * Deliberately tolerant: a phone with no speech engine at all throws here, and
 * that should disable the feature rather than break the screen that asked.
 */
async function voices() {
  if (cachedVoices) return cachedVoices;
  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch {
    cachedVoices = [];
  }
  return cachedVoices;
}

/**
 * Whether this phone can speak the language.
 *
 * Matched on the language part alone - a phone carrying 'hi-IN' or plain 'hi'
 * can both read Hindi, and demanding an exact tag would hide the button on
 * phones that would have worked.
 *
 * An empty voice list means the engine would not tell us, not that it cannot
 * speak. Android often reports nothing here while speaking perfectly well, so
 * the answer is yes and a failure surfaces when speech is attempted.
 */
export async function isLanguageAvailable(language) {
  const list = await voices();
  if (!list.length) return true;

  const want = tagFor(language).split('-')[0].toLowerCase();
  return list.some((v) => String(v.language || '').toLowerCase().startsWith(want));
}

/**
 * Speaks text in the farmer's language.
 *
 * @param {string} text
 * @param {string} language  the app's language code, e.g. 'hi'
 * @param {{onStart?: Function, onDone?: Function, onError?: Function}} [handlers]
 */
export async function speak(text, language = 'en', handlers = {}) {
  const words = String(text || '').trim();
  if (!words) return false;

  // Only one thing talking at a time. Without this, tapping a second card
  // while the first is speaking queues them and the farmer hears both.
  await stop();

  return new Promise((resolve) => {
    try {
      Speech.speak(words, {
        language: tagFor(language),
        rate: RATE,
        onStart: handlers.onStart,
        onDone: () => {
          handlers.onDone?.();
          resolve(true);
        },
        onStopped: () => {
          handlers.onDone?.();
          resolve(false);
        },
        onError: (error) => {
          if (__DEV__) console.warn('Speech failed:', error?.message || error);
          handlers.onError?.(error);
          resolve(false);
        },
      });
    } catch (error) {
      if (__DEV__) console.warn('Speech unavailable:', error?.message || error);
      handlers.onError?.(error);
      resolve(false);
    }
  });
}

export async function stop() {
  try {
    if (await Speech.isSpeakingAsync()) await Speech.stop();
  } catch {
    // Nothing to stop, or no engine. Either way there is nothing to report.
  }
}

export async function isSpeaking() {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

/**
 * Joins the parts of a card into something worth hearing.
 *
 * Read in the order a person would say it, with full stops between, so the
 * engine pauses instead of running a heading into the sentence after it.
 * Empty parts are dropped rather than read as silence.
 */
export function readable(...parts) {
  return parts
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .map((p) => (/[.!?।]$/.test(p) ? p : `${p}.`))
    .join(' ');
}

export default { speak, stop, isSpeaking, isLanguageAvailable, readable };
