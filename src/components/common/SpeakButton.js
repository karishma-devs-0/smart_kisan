/**
 * A button that reads something aloud in the farmer's language.
 *
 * Put next to advice a farmer acts on - a disease result, a soil warning, a
 * spraying recommendation - so the app is usable by someone who cannot
 * comfortably read it.
 *
 * It hides itself when the phone has no voice for the current language rather
 * than offering a button that does nothing. A dead control is worse than no
 * control: the farmer taps, hears silence, and concludes the app is broken.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { speak, stop, isLanguageAvailable } from '../../services/speech';

const SpeakButton = ({
  text,
  size = 20,
  color = COLORS.primary,
  style,
  accessibilityLabel,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language || 'en';

  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    isLanguageAvailable(language).then((ok) => {
      if (!alive) return;
      setAvailable(ok);
      setChecking(false);
    });
    return () => { alive = false; };
  }, [language]);

  // Anything still being read stops when the screen goes away, or the voice
  // follows the farmer onto the next screen with no way to silence it.
  useEffect(() => () => { stop(); }, []);

  const onPress = useCallback(async () => {
    if (speaking) {
      await stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await speak(text, language, {
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(false);
  }, [speaking, text, language]);

  if (checking || !available || !String(text || '').trim()) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel
        || (speaking
          ? t('speech.stop', 'Stop reading')
          : t('speech.listen', 'Listen'))
      }
    >
      {speaking ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <MaterialCommunityIcons name="volume-high" size={size} color={color} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SpeakButton;
