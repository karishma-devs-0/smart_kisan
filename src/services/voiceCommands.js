/**
 * Turning what the farmer said into a screen to open.
 *
 * Navigation only. A misheard command takes him to the wrong screen, which he
 * can see and correct; a misheard quantity or chemical name would be written
 * into a record and acted on. Nothing here changes data.
 *
 * MATCHING
 * The recogniser returns a whole sentence - "mujhe mausam dikhao", "weather
 * dikha do" - and a farmer will not say the same words twice. So every screen
 * carries the words that identify it in all three languages, and the sentence
 * is searched for them.
 *
 * Whole words, not substrings. Searching for the characters "ph" anywhere in
 * the sentence sent "photo kheecho", "graph dikhao" and "mera phone kahan
 * hai" all to the soil screen. Words are compared against the spoken words,
 * so "ph" matches a farmer saying "pee-aitch" and nothing else.
 *
 * Every candidate is scored rather than the first one winning. The earliest
 * match wins, so a sentence naming two screens opens the one he asked for
 * first; where two start at the same word the longer wins, so "soil moisture"
 * beats "soil".
 *
 * ROMANISED SPELLINGS
 * Each word appears in its own script and in Latin. The recogniser only
 * returns Devanagari or Gurmukhi when it is set to hi-IN or pa-IN; a farmer
 * whose phone is in English speaking Hindi gets "mausam dikhao" back, not
 * "मौसम दिखाओ". There is no standard romanisation, so the common variants are
 * all listed - mausam, mosam, mausham.
 */

// Devanagari and Gurmukhi are written without spaces between some compounds,
// and the recogniser is inconsistent about them, so matching is on substrings
// rather than whole words.
const COMMANDS = [
  {
    screen: 'WeedDetection',
    nested: { tab: 'SettingsTab', screen: 'WeedDetection' },
    words: ['weed', 'field monitor', 'ai monitor',
            'kharpatwar', 'kharpatvar', 'nadeen', 'nadin',
            'खरपतवार', 'नदीन', 'खेत की निगरानी',
            'ਨਦੀਨ', 'ਖੇਤ ਦੀ ਨਿਗਰਾਨੀ'],
  },
  {
    screen: 'DiseaseDetection',
    nested: { tab: 'SettingsTab', screen: 'DiseaseDetection' },
    words: ['disease', 'sick plant', 'leaf scan', 'scan plant',
            'bimari', 'bimaari', 'beemari', 'rog', 'patta', 'patti',
            'बीमारी', 'रोग', 'पत्ती',
            'ਬਿਮਾਰੀ', 'ਰੋਗ', 'ਪੱਤਾ'],
  },
  {
    screen: 'Harvests',
    words: ['harvest', 'yield', 'how much did i get',
            'katai', 'kataai', 'paidawar', 'paidavar', 'vadhi', 'wadhi', 'jhaad',
            'कटाई', 'पैदावार', 'फसल कटाई',
            'ਵਾਢੀ', 'ਝਾੜ'],
  },
  {
    screen: 'SoilTab',
    isTab: true,
    words: ['soil moisture', 'soil', 'nitrogen', 'ph level', 'ph',
            'mitti', 'mitty', 'mridа', 'nami', 'namee',
            'मिट्टी', 'मृदा', 'नमी',
            'ਮਿੱਟੀ', 'ਨਮੀ'],
  },
  {
    screen: 'WeatherTab',
    isTab: true,
    words: ['weather', 'rain', 'forecast', 'temperature',
            'mausam', 'mosam', 'mausham', 'barish', 'baarish', 'meenh', 'minh',
            'मौसम', 'बारिश', 'तापमान',
            'ਮੌਸਮ', 'ਮੀਂਹ', 'ਤਾਪਮਾਨ'],
  },
  {
    screen: 'PumpsTab',
    isTab: true,
    words: ['pump', 'motor', 'irrigation', 'water the field',
            'sinchai', 'sichai', 'paani', 'pani',
            'पंप', 'मोटर', 'सिंचाई', 'पानी',
            'ਪੰਪ', 'ਮੋਟਰ', 'ਸਿੰਚਾਈ', 'ਪਾਣੀ'],
  },
  {
    screen: 'MyCrops',
    words: ['my crops', 'crops', 'what i planted',
            'fasal', 'fasl', 'phasal',
            'मेरी फसल', 'फसल', 'फ़सल',
            'ਮੇਰੀ ਫ਼ਸਲ', 'ਫ਼ਸਲ'],
  },
  {
    screen: 'MyFields',
    words: ['fields', 'my land', 'plot',
            'khet', 'khait', 'zameen', 'zamin', 'jameen',
            'खेत', 'ज़मीन', 'जमीन',
            'ਖੇਤ', 'ਜ਼ਮੀਨ'],
  },
  {
    screen: 'FarmManagement',
    words: ['tasks', 'to do', 'work',
            'kaam', 'kaarya', 'kamm',
            'काम', 'कार्य',
            'ਕੰਮ'],
  },
  {
    screen: 'CropRecommend',
    nested: { tab: 'SettingsTab', screen: 'CropRecommend' },
    words: ['what should i grow', 'crop suitability', 'recommend',
            'kya boun', 'kya booun', 'kaun si fasal', 'sifarish',
            'क्या बोऊं', 'कौन सी फसल', 'सिफारिश',
            'ਕੀ ਬੀਜਾਂ', 'ਕਿਹੜੀ ਫ਼ਸਲ'],
  },
  {
    screen: 'FertilizerCalculator',
    nested: { tab: 'SettingsTab', screen: 'FertilizerCalculator' },
    words: ['fertiliser', 'fertilizer', 'urea', 'npk',
            'khad', 'khaad', 'urvarak', 'yuria', 'yooriya',
            'खाद', 'उर्वरक', 'यूरिया',
            'ਖਾਦ', 'ਯੂਰੀਆ'],
  },
  {
    screen: 'GovernmentSchemes',
    nested: { tab: 'SettingsTab', screen: 'GovernmentSchemes' },
    words: ['scheme', 'subsidy', 'government', 'kisan samman',
            'yojana', 'yojna', 'sarkari', 'sarkaari', 'subsidy',
            'योजना', 'सब्सिडी', 'सरकारी',
            'ਯੋਜਨਾ', 'ਸਬਸਿਡੀ', 'ਸਰਕਾਰੀ'],
  },
  {
    screen: 'Home',
    isTab: true,
    tabName: 'HomeTab',
    words: ['home', 'main screen', 'dashboard', 'back',
            'ghar', 'mukhya', 'mukh',
            'होम', 'मुख्य', 'घर',
            'ਹੋਮ', 'ਮੁੱਖ'],
  },
];

/**
 * Reduces a sentence to its words, padded with spaces at both ends.
 *
 * Padding is what makes a plain includes() behave as a whole-word search: a
 * target wrapped in spaces can only match between word boundaries. That
 * avoids a lookbehind, which Hermes has not always supported.
 *
 * The punctuation stripped covers the Latin marks and the Devanagari danda.
 * Nothing in the class is a letter in any of the three scripts, so Hindi and
 * Punjabi words survive intact.
 */
function wordsOf(text) {
  const cleaned = String(text || '')
    .toLowerCase()
    .replace(/[\u0964\u0965.,!?;:'"()\[\]{}\/\\_\-\u2013\u2014]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? ` ${cleaned} ` : '';
}

/**
 * Finds a word in the padded sentence, allowing an English plural.
 *
 * Whole-word matching is what stops "ph" matching inside "phone", but it also
 * stops "pump" matching "pumps", and a farmer says whichever comes to him.
 * Rather than listing both forms of every word - which would be forgotten for
 * the next one added - a trailing s is tried in both directions.
 *
 * Latin only. Hindi and Punjabi do not pluralise with an s, and stripping one
 * from a Devanagari or Gurmukhi word could only do harm.
 *
 * @returns {number} index of the match, or -1
 */
function findWord(padded, word) {
  const lower = word.toLowerCase();

  let at = padded.indexOf(` ${lower} `);
  if (at !== -1) return at;

  if (!/^[a-z0-9 ]+$/.test(lower)) return -1;

  if (lower.endsWith('s')) {
    return padded.indexOf(` ${lower.slice(0, -1)} `);
  }
  return padded.indexOf(` ${lower}s `);
}

/**
 * @param {string} heard  the recogniser's transcript
 * @returns {{screen: string, matched: string, nested?: object, isTab?: boolean, tabName?: string}|null}
 */
export function matchCommand(heard) {
  const padded = wordsOf(heard);
  if (!padded) return null;

  let best = null;

  for (const command of COMMANDS) {
    for (const word of command.words) {
      const at = findWord(padded, word);
      if (at === -1) continue;

      // Earliest wins, then longest.
      //
      // Position first, because a sentence naming two screens should open the
      // one the farmer asked for first - "mitti aur mausam dono" is soil, not
      // weather. Ranking by length instead let a longer word said later beat
      // a shorter one said first.
      //
      // Length breaks a tie at the same position, which is where overlapping
      // words sit: "soil" and "soil moisture" both start at the same word, and
      // the longer is the more specific.
      const better = !best
        || at < best.at
        || (at === best.at && word.length > best.length);

      if (better) {
        best = {
          length: word.length,
          at,
          result: {
            screen: command.screen,
            nested: command.nested,
            isTab: command.isTab,
            tabName: command.tabName,
            matched: word,
          },
        };
      }
    }
  }

  return best ? best.result : null;
}

/**
 * Opens whatever was matched.
 *
 * Kept here rather than in the screen so every entry point navigates the same
 * way, and so the nesting - some screens live under a tab - is described once.
 */
export function runCommand(navigation, command) {
  if (!navigation || !command) return false;
  try {
    if (command.nested) {
      navigation.navigate(command.nested.tab, { screen: command.nested.screen });
    } else if (command.isTab) {
      navigation.navigate(command.tabName || command.screen);
    } else {
      navigation.navigate(command.screen);
    }
    return true;
  } catch {
    return false;
  }
}

/** Examples to show the farmer, in his own language. */
export function examplesFor(language) {
  if (language === 'hi') return ['मौसम दिखाओ', 'मिट्टी', 'पंप चालू करो', 'कटाई'];
  if (language === 'pa') return ['ਮੌਸਮ ਵਿਖਾਓ', 'ਮਿੱਟੀ', 'ਪੰਪ', 'ਵਾਢੀ'];
  return ['Show the weather', 'Soil', 'My pumps', 'Harvests'];
}

export default { matchCommand, runCommand, examplesFor };
