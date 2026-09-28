/**
 * Turning what the farmer said into a screen to open.
 *
 * Navigation only. A misheard command takes him to the wrong screen, which he
 * can see and correct; a misheard quantity or chemical name would be written
 * into a record and acted on. Nothing here changes data.
 *
 * MATCHING
 * Loose on purpose. The recogniser returns a whole sentence - "mujhe mausam
 * dikhao", "weather dikha do" - and a farmer will not say the same words
 * twice. So every screen carries the words that identify it in all three
 * languages, and a phrase matches if any of them appear anywhere in what was
 * heard.
 *
 * Longer phrases are tested first, so "soil moisture" is not swallowed by
 * "soil".
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
    words: ['soil moisture', 'soil', 'nitrogen', 'ph',
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

// Tested longest first so a short word does not swallow a longer phrase that
// contains it - "soil" would otherwise match before "soil moisture".
const RANKED = COMMANDS
  .map((c) => ({ ...c, words: [...c.words].sort((a, b) => b.length - a.length) }))
  .sort((a, b) => Math.max(...b.words.map((w) => w.length))
                - Math.max(...a.words.map((w) => w.length)));

/**
 * @param {string} heard  the recogniser's transcript
 * @returns {{screen: string, matched: string, nested?: object, isTab?: boolean, tabName?: string}|null}
 */
export function matchCommand(heard) {
  const text = String(heard || '').toLowerCase().trim();
  if (!text) return null;

  for (const command of RANKED) {
    for (const word of command.words) {
      if (text.includes(word.toLowerCase())) {
        return {
          screen: command.screen,
          nested: command.nested,
          isTab: command.isTab,
          tabName: command.tabName,
          matched: word,
        };
      }
    }
  }
  return null;
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
