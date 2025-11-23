import { FlatList, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/atoms/app-button';
import { AppText } from '@/components/atoms/app-text';
import { Chip } from '@/components/atoms/chip';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useNetworkStatus } from '@/hooks/use-network-status';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/authStore';
import { useSubmissionQueueStore } from '@/state/submissionQueueStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type SyncStatusScreenProps = NativeStackScreenProps<BeneficiaryDrawerParamList, 'SyncStatus'>;

export const SyncStatusScreen = () => {
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();
  const beneficiaryId = useAuthStore((state) => state.profile?.id ?? undefined);
  const pendingDrafts = useSubmissionQueueStore((state) => state.pending);
  const syncStatus = useSubmissionQueueStore((state) => state.syncStatus);
  const syncError = useSubmissionQueueStore((state) => state.error);
  const syncPendingWithServer = useSubmissionQueueStore((state) => state.actions.syncPendingWithServer);

  const handleRetry = () => {
    if (!beneficiaryId || !pendingDrafts.length) {
      return;
    }
    void syncPendingWithServer(beneficiaryId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <AppText variant="headlineMedium" color="text">
        Pending Uploads
      </AppText>
      <AppText variant="bodySmall" color="muted">
        {isOnline ? 'Device online' : 'Offline mode'} · {syncStatus === 'syncing' ? 'Syncing drafts…' : `${pendingDrafts.length} pending`}
      </AppText>
      {syncError ? (
        <AppText variant="labelSmall" color="error">
          {syncError}
        </AppText>
      ) : null}
      <FlatList
        data={pendingDrafts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <AppText variant="bodyMedium" color="muted" style={{ textAlign: 'center', marginTop: 24 }}>
            No offline drafts waiting for upload.
          </AppText>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            accessible
            accessibilityLabel={`Draft ${item.assetName}`}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="titleSmall" color="text">
                {item.assetName}
              </AppText>
              <Chip label={item.status === 'failed' ? 'Failed' : 'Pending'} tone={item.status === 'failed' ? 'error' : 'warning'} onPress={() => {}} />
            </View>
            <AppText variant="bodySmall" color="muted">
              {new Date(item.capturedAt).toLocaleString()} · GPS {item.location.latitude.toFixed(3)}, {item.location.longitude.toFixed(3)}
            </AppText>
            <AppButton
              label={syncStatus === 'syncing' ? 'Syncing...' : 'Retry Upload'}
              variant="outline"
              icon="refresh"
              disabled={!isOnline || syncStatus === 'syncing'}
              onPress={handleRetry}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
});
