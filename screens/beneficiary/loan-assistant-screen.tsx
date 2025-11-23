import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/atoms/app-text';
import { LoanAssistantPanel } from '@/components/organisms/loan-assistant';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBeneficiaryData } from '@/hooks/use-beneficiary-data';
import { useAuthStore } from '@/state/authStore';

export const BeneficiaryLoanAssistantScreen = () => {
  const theme = useAppTheme();
  const storedProfile = useAuthStore((state) => state.profile);
  const { profile, loan, isLoading } = useBeneficiaryData();

  const beneficiaryProfile = profile ?? storedProfile;
  const showLoadingOverlay = isLoading && !loan;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Loan assistant"
    >
      <View style={styles.body}>
        <View style={styles.header}>
          <AppText variant="titleLarge" color="text">
            Loan Copilot
          </AppText>
          <AppText variant="bodyMedium" color="muted">
            Chat with the Gemini-powered assistant for guidance on documents, disbursement steps, and MSME compliance.
          </AppText>
        </View>
        <LoanAssistantPanel
          variant="full"
          beneficiaryName={beneficiaryProfile?.name ?? undefined}
          loanAmount={loan?.loanAmount}
          bankName={loan?.bank}
        />
      </View>
      {showLoadingOverlay ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background + 'CC' }]}
          pointerEvents="none"
        >
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingTop: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
