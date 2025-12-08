import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import type { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBeneficiaryData } from '@/hooks/use-beneficiary-data';
import {
  loanAssistantClient,
  type LoanAssistantMessage,
  type LoanContext,
} from '@/services/ai/loanAssistant';

const QUICK_PROMPTS = [
  'What are the next steps in my loan?',
  'How do I upload missing documents?',
  'When will I get the subsidy?',
  'Explain my repayment schedule.',
  'Can I update my bank details?',
];

const TypingIndicator = ({ theme }: { theme: AppTheme }) => {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={typingStyles.container}>
      {[0, 1, 2].map((idx) => (
        <Animated.View
          key={idx}
          style={[
            typingStyles.dot,
            {
              backgroundColor: theme.colors.primary,
              opacity: pulse,
              transform: [{ translateY: idx % 2 ? -1 : 0 }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const formatNow = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export const BeneficiaryLoanAssistantScreen = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const gradients = useMemo(
    () => ({
      page: [theme.colors.background, theme.colors.surfaceVariant] as const,
      header: [theme.colors.primary, theme.colors.primaryContainer] as const,
      input: [theme.colors.surface, theme.colors.surfaceVariant] as const,
      accentBg: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
      accentBorder: theme.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.28)',
      chipBg: theme.colors.surfaceVariant,
      botBubble: `${theme.colors.surface}F2`,
    }),
    [theme]
  );
  const { profile, loan } = useBeneficiaryData();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LoanAssistantMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const context = useMemo<LoanContext>(
    () => ({
      beneficiaryName: profile?.name,
      loanAmount: loan?.loanAmount,
      bankName: loan?.bank,
    }),
    [profile?.name, loan?.loanAmount, loan?.bank]
  );

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isSending]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: LoanAssistantMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const reply = await loanAssistantClient.sendMessage(nextMessages, context);
      const botMessage: LoanAssistantMessage = { role: 'assistant', content: reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Loan assistant error', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not respond right now. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const renderWelcomeState = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.heroCard}>
        <View style={[styles.heroAvatarShadow, { shadowColor: `${theme.colors.primary}33` }]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroAvatar}
          >
            <AppIcon name="robot" size={32} color={theme.colors.onPrimary} />
          </LinearGradient>
        </View>
        <View style={styles.heroTextBlock}>
          <AppText style={[styles.heroTitle, { color: theme.colors.text }]}>Hi {profile?.name || 'there'} 👋</AppText>
          <AppText style={[styles.heroSubtitle, { color: theme.colors.subtext }]}>
            Ask about your loan, documents, subsidy timeline, or next steps.
          </AppText>
        </View>
      </View>

      <View style={styles.welcomeBubble}>
        <AppIcon name="shield-check-outline" size={20} color={theme.colors.primary} style={styles.welcomeIcon} />
        <AppText style={[styles.welcomeText, { color: theme.colors.text }]}>
          I can fetch details from your profile and loan to give quicker answers.
        </AppText>
      </View>

      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionHeader}>
          <AppIcon name="lightbulb-on-outline" size={18} color={theme.colors.primary} />
          <AppText style={[styles.suggestionTitle, { color: theme.colors.subtext }]}>Try asking</AppText>
        </View>
        <View style={styles.chipsGrid}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={[styles.chip, { backgroundColor: gradients.chipBg, borderColor: theme.colors.border }]}
              onPress={() => handleSend(prompt)}
            >
              <AppText style={{ color: theme.colors.text }}>{prompt}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={130}
      >
        <LinearGradient
          colors={gradients.page}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pageBackground}
        />

        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={gradients.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View>
              <AppText style={styles.headerTitle}>NIDHI MITRA</AppText>
              <AppText style={[styles.headerSubtitle, { color: theme.colors.onPrimary }]}>Ask anything about your loan journey</AppText>
            </View>
            <View
              style={[
                styles.headerIconButton,
                { backgroundColor: gradients.accentBg, borderColor: gradients.accentBorder },
              ]}
            >
              <AppIcon name="chat-processing-outline" size={22} color={theme.colors.onPrimary} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.chatCard}>
          <View style={styles.messagesWrapper}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                renderWelcomeState()
              ) : (
                <View style={styles.messagesList}>
                  {messages.map((msg, idx) => (
                    <Animated.View
                      key={`${msg.role}-${idx}-${msg.content.slice(0, 6)}`}
                      style={[
                        styles.messageBubble,
                        msg.role === 'user' ? styles.userBubble : styles.botBubble,
                        msg.role === 'user'
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: gradients.botBubble, borderColor: `${theme.colors.border}80` },
                      ]}
                    >
                      {msg.role === 'assistant' ? (
                        <Markdown style={markdownStyles(theme)}>{msg.content}</Markdown>
                      ) : (
                        <AppText
                          style={[
                            styles.messageText,
                            { color: theme.colors.onPrimary, fontWeight: '600' },
                          ]}
                        >
                          {msg.content}
                        </AppText>
                      )}
                      <AppText style={[styles.timestamp, { color: theme.colors.subtext }]}>{formatNow()}</AppText>
                    </Animated.View>
                  ))}
                  {isSending && (
                    <View
                      style={[
                        styles.messageBubble,
                        styles.botBubble,
                        { backgroundColor: gradients.botBubble, borderColor: `${theme.colors.border}80` },
                      ]}
                    >
                      <TypingIndicator theme={theme} />
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>

          <View style={styles.inputWrapper}>
            <LinearGradient
              colors={gradients.input}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.inputBackdrop}
            />
            <View style={styles.inputContainer}>
              <TouchableOpacity style={[styles.avatarButton, { shadowColor: theme.colors.border }]}>
                <View style={[styles.avatarInner, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <AppIcon name="robot" size={18} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor={theme.colors.subtext}
                value={input}
                onChangeText={setInput}
                returnKeyType="send"
                onSubmitEditing={() => handleSend(input)}
              />
              <TouchableOpacity style={styles.micButton}>
                <AppIcon name="microphone" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleSend(input)}
              >
                <AppIcon name="send" size={18} color={theme.colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => {
  const isDark = theme.mode === 'dark';
  const shadowStrong = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(26,43,68,0.16)';
  const shadowSoft = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(26,43,68,0.12)';
  const shadowLighter = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(26,43,68,0.08)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    pageBackground: {
      ...StyleSheet.absoluteFillObject,
      zIndex: -1,
      opacity: isDark ? 0.7 : 0.9,
    },
    headerWrapper: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerGradient: {
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      shadowColor: shadowLighter,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.35 : 0.4,
      shadowRadius: 24,
      elevation: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      letterSpacing: 0.4,
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: theme.colors.onPrimary,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    chatCard: {
      flex: 1,
      marginHorizontal: 18,
      marginBottom: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: shadowSoft,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.4 : 0.35,
      shadowRadius: 24,
      elevation: 10,
      position: 'relative',
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120,
    },
    messagesWrapper: {
      flex: 1,
    },
    welcomeContainer: {
      alignItems: 'center',
      paddingTop: 32,
      paddingHorizontal: 20,
      gap: 18,
    },
    heroCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: shadowLighter,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.25,
      shadowRadius: 14,
      elevation: 6,
      gap: 14,
    },
    heroAvatarShadow: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.35 : 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    heroAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextBlock: {
      flex: 1,
      gap: 4,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.colors.subtext,
    },
    welcomeBubble: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 18,
      alignItems: 'center',
      width: '100%',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    welcomeIcon: {
      marginRight: 8,
    },
    welcomeText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 24,
    },
    suggestionsContainer: {
      width: '100%',
      marginTop: 6,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    suggestionTitle: {
      fontSize: 14,
      color: theme.colors.subtext,
    },
    chipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      shadowColor: shadowSoft,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    inputWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 8,
      backgroundColor: 'transparent',
    },
    inputBackdrop: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 8,
      top: 8,
      borderRadius: 28,
      opacity: isDark ? 0.7 : 0.9,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 28,
      shadowColor: shadowSoft,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.25 : 0.25,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 10,
      marginHorizontal: 16,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 10,
      color: theme.colors.text,
    },
    inputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatarButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: shadowLighter,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.28 : 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    avatarInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    micButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceVariant,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    messagesList: {
      padding: 20,
      gap: 14,
      flexGrow: 1,
      justifyContent: 'flex-start',
    },
    messageBubble: {
      padding: 16,
      borderRadius: 18,
      maxWidth: '82%',
      shadowColor: shadowSoft,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.2 : 0.16,
      shadowRadius: 12,
      elevation: 4,
    },
    userBubble: {
      alignSelf: 'flex-end',
      borderBottomRightRadius: 8,
    },
    botBubble: {
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    timestamp: {
      marginTop: 8,
      fontSize: 11,
      color: theme.colors.subtext,
    },
    typingContainer: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });
};

const markdownStyles = (theme: AppTheme) =>
  StyleSheet.create({
    body: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    paragraph: {
      marginTop: 2,
      marginBottom: 6,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    bullet_list_icon: {
      color: theme.colors.text,
    },
    ordered_list_icon: {
      color: theme.colors.text,
    },
    code_inline: {
      backgroundColor: `${theme.colors.surface}DD`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.colors.border}AA`,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: `${theme.colors.surface}DD`,
      padding: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.colors.border}AA`,
      fontFamily: 'monospace',
    },
  });

export default BeneficiaryLoanAssistantScreen;

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
