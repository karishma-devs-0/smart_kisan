/**
 * Speaking into a text box instead of typing it.
 *
 * Typing a sentence on a phone keyboard is slow in English and slower in Hindi
 * or Punjabi, where most farmers are using a transliteration keyboard they did
 * not choose. For a free-text field - a task to remember, a note about a
 * harvest - speaking is simply faster.
 *
 * WHY THIS IS SAFE WHERE A NUMBER WOULD NOT BE
 * The words land in the box. The farmer reads them, edits them, and presses
 * save himself. Nothing is written until he does.
 *
 * That is why there is no equivalent for quantities. "Sixteen quintal" heard
 * as sixty would go into a harvest record, and every yield figure and
 * prediction after it would be built on the wrong number - silently, because
 * nobody re-reads a number they already said. Free text is read back before it
 * counts; a number in a form field is not.
 *
 * Appends rather than replaces, so a farmer can dictate a second sentence
 * without losing the first.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import {
  listenOnce,
  stopListening,
  isListeningAvailable,
  canListenIn,
  explainError,
} from '../../services/listen';

const DictateButton = ({
  onText,
  size = 20,
  color = COLORS.primary,
  style,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language || 'en';

  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!canListenIn(language)) {
      setAvailable(false);
      return undefined;
    }
    isListeningAvailable().then((ok) => { if (alive) setAvailable(ok); });
    return () => { alive = false; };
  }, [language]);

  // The microphone must not stay open behind the farmer when he leaves the
  // form.
  useEffect(() => () => { stopListening(); }, []);

  const press = useCallback(async () => {
    if (listening) {
      await stopListening();
      setListening(false);
      return;
    }

    setListening(true);
    const { text, error } = await listenOnce(language);
    setListening(false);

    if (error) {
      // Said in a box rather than silently, so a farmer who speaks and sees
      // nothing appear knows why.
      Alert.alert(
        t('listen.speak', 'Speak'),
        explainError(error, t),
      );
      return;
    }

    if (text) onText?.(text);
  }, [listening, language, onText, t]);

  if (!available) return null;

  return (
    <TouchableOpacity
      onPress={press}
      disabled={disabled}
      style={[styles.button, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        listening
          ? t('listen.listening', 'Listening…')
          : t('listen.dictate', 'Speak instead of typing')
      }
    >
      {listening ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <MaterialCommunityIcons name="microphone-outline" size={size} color={color} />
      )}
    </TouchableOpacity>
  );
};

/**
 * Joins dictated text onto whatever is already in the box.
 *
 * Exported so every caller appends the same way - a farmer dictating a second
 * sentence should not lose the first, and the spacing should not depend on
 * which form he is in.
 */
export function appendSpoken(existing, spoken) {
  const current = String(existing || '').trim();
  const addition = String(spoken || '').trim();
  if (!addition) return current;
  if (!current) return addition;
  // A full stop between sentences if he did not pause into one himself.
  return /[.!?।]$/.test(current)
    ? `${current} ${addition}`
    : `${current}. ${addition}`;
}

const styles = StyleSheet.create({
  button: {
    padding: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DictateButton;
