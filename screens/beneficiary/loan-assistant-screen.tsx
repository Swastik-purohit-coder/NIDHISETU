import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { Chip } from '@/components/atoms/chip';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBeneficiaryData } from '@/hooks/use-beneficiary-data';
import { useAuthStore } from '@/state/authStore';
import { loanAssistantClient, LoanAssistantMessage } from '@/services/ai/loanAssistant';

export const BeneficiaryLoanAssistantScreen = () => {
  const theme = useAppTheme();
  const { profile, loan } = useBeneficiaryData();
  const storedProfile = useAuthStore((state) => state.profile);
  const beneficiaryName = profile?.name ?? storedProfile?.name;

  const [messages, setMessages] = useState<LoanAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const context = useMemo(
    () => ({
      beneficiaryName,
      loanAmount: loan?.loanAmount,
      bankName: loan?.bank
    }),
    [beneficiaryName, loan?.loanAmount, loan?.bank]
  );

  const suggestions = [
    'Loan Status',
    'Schemes',
    'Eligibility',
    'Documents',
    'Subsidy',
    'Repayment'
  ];

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMsg: LoanAssistantMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, newMsg];
    
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const reply = await loanAssistantClient.sendMessage(nextMessages, context);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isSending]);

  const renderWelcomeState = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.robotContainer}>
         <AppIcon name="robot" size={120} color={theme.colors.primary} />
      </View>
      
      <View style={styles.welcomeBubble}>
        <AppIcon name="auto-awesome" size={20} color={theme.colors.primary} style={{marginRight: 8}}/>
        <AppText style={styles.welcomeText}>
          Hi {beneficiaryName ? beneficiaryName.split(' ')[0] : ''}, you can ask me anything about your loan
        </AppText>
      </View>

      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionHeader}>
            <AppIcon name="lightbulb-on-outline" size={20} color={theme.colors.primary} />
            <AppText style={styles.suggestionTitle}>I suggest some topics you can ask me..</AppText>
        </View>
        <View style={styles.chipsGrid}>
          {suggestions.map((s) => (
            <Chip 
              key={s} 
              label={s} 
              onPress={() => handleSend(s)}
              style={styles.chip}
              backgroundColor={theme.colors.surfaceVariant}
              tone="primary"
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9FE' }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>NIDHIMITRA</AppText>
        <TouchableOpacity>
            <AppIcon name="message-text-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {messages.length === 0 ? renderWelcomeState() : (
            <View style={styles.messagesList}>
                {messages.map((msg, idx) => (
                    <View key={idx} style={[
                        styles.messageBubble,
                        msg.role === 'user' ? styles.userBubble : styles.botBubble,
                        msg.role === 'user' ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#FFFFFF' }
                    ]}>
                        <AppText style={[
                            styles.messageText,
                            msg.role === 'user' ? { color: '#FFFFFF' } : { color: '#1F2937' }
                        ]}>
                            {msg.content}
                        </AppText>
                    </View>
                ))}
                {isSending && (
                    <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: '#FFFFFF' }]}>
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    </View>
                )}
            </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputContainer, { backgroundColor: '#FFFFFF' }]}>
            <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
            />
            <TouchableOpacity style={styles.micButton}>
                <AppIcon name="microphone" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleSend(input)}
            >
                <AppIcon name="send" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200, // Extra padding for bottom tabs
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  robotContainer: {
    marginBottom: 30,
  },
  welcomeBubble: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF', // Light purple
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#1F2937',
    marginLeft: 8,
  },
  micButton: {
    padding: 10,
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
    gap: 16,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
