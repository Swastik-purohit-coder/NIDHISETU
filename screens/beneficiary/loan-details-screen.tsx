import { AppText } from '@/components/atoms/app-text';
import { Chip } from '@/components/atoms/chip';
import { LoanDetailCard } from '@/components/molecules/loan-detail-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBeneficiaryData } from '@/hooks/use-beneficiary-data';
import { ScrollView, StyleSheet, View } from 'react-native';

export const LoanDetailsScreen = () => {
  const theme = useAppTheme();
  const { loan } = useBeneficiaryData();

  if (!loan) {
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <AppText>Loading loan details...</AppText>
        </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
            <LoanDetailCard loan={loan} />
            
            <View style={[styles.section, { backgroundColor: theme.colors.card, borderRadius: theme.radii.lg }]}>
                <AppText variant="titleMedium" style={styles.sectionTitle}>Verification Status</AppText>
                <View style={styles.statusRow}>
                    <Chip label="In Progress" tone="warning" />
                    <AppText variant="bodySmall" color="muted">Last updated: Today</AppText>
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.card, borderRadius: theme.radii.lg }]}>
                <AppText variant="titleMedium" style={styles.sectionTitle}>Remarks from Officer</AppText>
                <View style={styles.remarkList}>
                    <View style={styles.remarkItem}>
                        <AppText variant="bodyMedium" color="text">• Asset Photo required</AppText>
                    </View>
                    <View style={styles.remarkItem}>
                        <AppText variant="bodyMedium" color="text">• Upload invoice clearly</AppText>
                    </View>
                </View>
            </View>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remarkList: {
    gap: 8,
  },
  remarkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
