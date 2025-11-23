import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/atoms/app-button';
import { LoanDetailCard } from '@/components/molecules';
import { VerificationProgress } from '@/components/molecules/verification-progress';
import { DashboardHeader, SyncBanner } from '@/components/organisms';
import { RequiredUploadsList, UploadRequirement } from '@/components/organisms/required-uploads-list';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBeneficiaryData } from '@/hooks/use-beneficiary-data';
import { useSubmissions } from '@/hooks/use-submissions';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/authStore';
import type { DrawerScreenProps } from '@react-navigation/drawer';

export type BeneficiaryDashboardScreenProps = DrawerScreenProps<BeneficiaryDrawerParamList, 'BeneficiaryDashboard'>;

const REQUIRED_ITEMS = [
  { id: 'asset_photo', label: 'Asset Photo' },
  { id: 'selfie_asset', label: 'Selfie with Asset' },
  { id: 'invoice', label: 'Invoice/Bill' },
  { id: 'workshop_photo', label: 'Workshop Photo' },
];

export const BeneficiaryDashboardScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<BeneficiaryDrawerParamList>>();
  const storedProfile = useAuthStore((state) => state.profile);
  const { profile, loan, refetch } = useBeneficiaryData();
  const { submissions, syncState, refresh: refreshSubmissions, isLoading: submissionsLoading } = useSubmissions();

  const headerProfile = profile ?? storedProfile;

  const handleRefresh = () => {
    void Promise.all([refetch(), refreshSubmissions()]);
  };

  const requirements: UploadRequirement[] = REQUIRED_ITEMS.map((item) => {
    // Simple matching logic - in real app, use IDs or types
    const submission = submissions.find((s) => s.assetName === item.label);
    let status: UploadRequirement['status'] = 'pending';
    if (submission) {
      status = submission.status === 'rejected' ? 'rejected' : 'uploaded';
    }
    return { ...item, status };
  });

  const completedCount = requirements.filter((r) => r.status === 'uploaded').length;
  const progress = Math.round((completedCount / requirements.length) * 100);

  const handleUpload = (id: string, label: string) => {
    navigation.navigate('UploadEvidence', { requirementId: id, requirementName: label });
  };

  return (
    <ScrollView 
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Beneficiary dashboard"
    >
      <View style={styles.headerSection}>
        <DashboardHeader
          name={headerProfile?.name ?? 'Beneficiary'}
          role={headerProfile?.role ?? 'beneficiary'}
          syncState={syncState}
        />
        <SyncBanner syncState={syncState} />
        
        {loan ? (
          <View style={styles.section}>
            <LoanDetailCard loan={loan} />
            <AppButton 
              label="View Loan Details" 
              variant="ghost" 
              onPress={() => navigation.navigate('LoanDetails')} 
            />
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <VerificationProgress percentage={progress} />
        </View>

        <RequiredUploadsList 
            requirements={requirements} 
            onUpload={handleUpload} 
        />

        <AppButton 
            label="View All Uploads" 
            variant="secondary" 
            onPress={() => navigation.navigate('PreviousSubmissions')} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerSection: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
});
