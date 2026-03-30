import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Chat Row ────────────────────────────────────────────────────────────────

const ChatRow = ({ chat, onPress }) => {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastText = lastMessage?.text || '';
  const lastTime = lastMessage?.timestamp || '';

  return (
    <TouchableOpacity style={styles.chatRow} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(chat.otherUser.name)}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>{chat.otherUser.name}</Text>
          <Text style={styles.chatTime}>{formatTimestamp(lastTime)}</Text>
        </View>
        <Text style={styles.chatListing} numberOfLines={1}>{chat.listing.title}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>{lastText}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const ChatListScreen = ({ navigation }) => {
  const chats = useSelector((state) => state.marketplace.chats);
  const chatList = Object.values(chats).sort((a, b) => {
    const aTime = a.messages.length ? new Date(a.messages[a.messages.length - 1].timestamp) : 0;
    const bTime = b.messages.length ? new Date(b.messages[b.messages.length - 1].timestamp) : 0;
    return bTime - aTime;
  });

  return (
    <ScreenLayout
      title="Messages"
      showBack
      onBack={() => navigation.goBack()}
    >
      {chatList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-text-outline" size={56} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Browse listings and chat with sellers to get started.
          </Text>
        </View>
      ) : (
        chatList.map((chat) => (
          <ChatRow
            key={chat.chatId}
            chat={chat}
            onPress={() =>
              navigation.navigate('Chat', {
                chatId: chat.chatId,
                listing: chat.listing,
                otherUser: chat.otherUser,
              })
            }
          />
        ))
      )}
    </ScreenLayout>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  chatInfo: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  chatTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  chatListing: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: 2,
  },
  chatPreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
});

export default ChatListScreen;
