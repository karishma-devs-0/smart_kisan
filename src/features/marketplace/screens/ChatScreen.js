import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { sendMessage, initChat } from '../slice/marketplaceSlice';

const CURRENT_USER_ID = 'currentUser';

// ─── Message Bubble ──────────────────────────────────────────────────────────

const MessageBubble = ({ message, isMine }) => {
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {timeStr}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const ChatScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { chatId, listing, otherUser } = route.params;
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  // Initialize chat if it doesn't exist
  useEffect(() => {
    dispatch(initChat({ chatId, listing, otherUser }));
  }, [chatId, dispatch, listing, otherUser]);

  const chat = useSelector((state) => state.marketplace.chats[chatId]);
  const messages = chat?.messages || [];

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    dispatch(sendMessage({ chatId, text: trimmed, sender: CURRENT_USER_ID }));
    setInputText('');
  };

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }) => (
    <MessageBubble message={item} isMine={item.sender === CURRENT_USER_ID} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="message-text-outline" size={56} color={COLORS.textTertiary} />
      <Text style={styles.emptyText}>Start the conversation!</Text>
      <Text style={styles.emptySubtext}>Send a message about this listing.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherUser.name}</Text>
          <Text style={styles.headerListing} numberOfLines={1}>{listing.title}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={inputText.trim() ? COLORS.white : COLORS.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  headerListing: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    justifyContent: 'flex-start',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: COLORS.white,
  },
  bubbleTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    marginRight: SPACING.sm,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default ChatScreen;
