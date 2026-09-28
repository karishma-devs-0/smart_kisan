/**
 * Speak to move around the app.
 *
 * Paired with SpeakButton: the app reads its advice aloud, and this lets the
 * farmer answer. Between them, someone who cannot comfortably read or type can
 * still use it.
 *
 * Navigation only. A misheard word takes him to the wrong screen, which he can
 * see and correct - it never writes to a record. What was heard is always
 * shown, so a wrong guess is obvious rather than silent.
 *
 * Hidden when the phone cannot listen, or when the app is in one of the seven
 * languages the recogniser handles poorly. A mic that hears nothing is worse
 * than no mic.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';
import {
  listenOnce,
  stopListening,
  isListeningAvailable,
  canListenIn,
  explainError,
} from '../../services/listen';
import { matchCommand, runCommand, examplesFor } from '../../services/voiceCommands';
import { speak } from '../../services/speech';

const VoiceCommandButton = ({ navigation, style, size = 22 }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language || 'en';

  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [message, setMessage] = useState(null);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let alive = true;
    if (!canListenIn(language)) {
      setAvailable(false);
      return undefined;
    }
    isListeningAvailable().then((ok) => { if (alive) setAvailable(ok); });
    return () => { alive = false; };
  }, [language]);

  // Anything still listening stops when this goes away, or the microphone
  // stays open behind the farmer's back.
  useEffect(() => () => { stopListening(); }, []);

  useEffect(() => {
    if (!listening) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const begin = useCallback(async () => {
    setOpen(true);
    setHeard('');
    setMessage(null);
    setListening(true);

    const { text, error } = await listenOnce(language, {
      onPartial: setHeard,
    });

    setListening(false);

    if (error) {
      setMessage({ kind: 'error', text: explainError(error, t) });
      return;
    }

    setHeard(text);
    const command = matchCommand(text);

    if (!command) {
      // What was heard is shown alongside, so the farmer can tell whether it
      // misheard him or simply does not know that phrase.
      setMessage({
        kind: 'unknown',
        text: t('listen.notUnderstood', 'I did not understand that one.'),
      });
      return;
    }

    if (runCommand(navigation, command)) {
      setOpen(false);
      // Spoken as well as shown: a farmer using his voice is often not
      // looking at the screen.
      speak(t('listen.opening', 'Opening'), language);
    } else {
      setMessage({
        kind: 'error',
        text: t('listen.couldNotOpen', 'I could not open that screen.'),
      });
    }
  }, [language, navigation, t]);

  const close = useCallback(async () => {
    await stopListening();
    setListening(false);
    setOpen(false);
  }, []);

  if (!available) return null;

  const examples = examplesFor(language);

  return (
    <>
      <TouchableOpacity
        onPress={begin}
        style={[styles.trigger, style]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={t('listen.speak', 'Speak')}
      >
        <MaterialCommunityIcons name="microphone" size={size} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <Animated.View style={[styles.micCircle, { transform: [{ scale: pulse }] }]}>
              <MaterialCommunityIcons
                name={listening ? 'microphone' : 'microphone-outline'}
                size={36}
                color={COLORS.white}
              />
            </Animated.View>

            <Text style={styles.status}>
              {listening
                ? t('listen.listening', 'Listening…')
                : t('listen.tapToSpeak', 'Tap the microphone to speak')}
            </Text>

            {!!heard && <Text style={styles.heard}>“{heard}”</Text>}

            {listening && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />}

            {message && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{message.text}</Text>
                {message.kind === 'unknown' && (
                  <>
                    <Text style={styles.examplesLabel}>
                      {t('listen.tryOneOf', 'Try one of these:')}
                    </Text>
                    {examples.map((e) => (
                      <Text key={e} style={styles.example}>• {e}</Text>
                    ))}
                  </>
                )}
              </View>
            )}

            <View style={styles.actions}>
              {!listening && (
                <TouchableOpacity style={styles.retry} onPress={begin}>
                  <MaterialCommunityIcons name="microphone" size={18} color={COLORS.white} />
                  <Text style={styles.retryText}>
                    {message
                      ? t('listen.tryAgain', 'Try again')
                      : t('listen.speak', 'Speak')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancel} onPress={close}>
                <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  sheet: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  micCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  heard: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  messageText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 19 },
  examplesLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  example: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  cancel: { paddingHorizontal: SPACING.lg, height: 46, justifyContent: 'center' },
  cancelText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
});

export default VoiceCommandButton;
