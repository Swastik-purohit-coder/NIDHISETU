import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { BrandLogo } from '@/components/atoms/brand-logo';
import { Chip } from '@/components/atoms/chip';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { SyncState, UserRole } from '@/types/entities';

const roleLabels: Record<UserRole, string> = {
  beneficiary: 'Beneficiary',
  officer: 'State Officer',
  reviewer: 'Reviewer',
};

export interface DashboardHeaderProps {
  name: string;
  role: UserRole;
  syncState?: SyncState;
  onPressMenu?: () => void;
}

export const DashboardHeader = ({ name, role, syncState, onPressMenu }: DashboardHeaderProps) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { paddingVertical: theme.spacing.lg }]}
      accessibilityRole="header"
    >
      <View style={styles.row}>
        {onPressMenu ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open navigation"
            style={[styles.menuButton, { borderColor: theme.colors.border }]}
            onPress={onPressMenu}
          >
            <AppIcon name="menu" size={22} color="text" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.identityRow}>
          <BrandLogo size={40} showWordmark={false} showTagline={false} align="left" />
          <AppText variant="titleMedium" color="muted">
            Welcome back,
          </AppText>
          <AppText variant="headlineLarge" color="text" weight="600">
            {name}
          </AppText>
        </View>
        <Chip label={roleLabels[role]} tone="secondary" backgroundColor={theme.colors.secondaryContainer} />
      </View>
      {syncState ? <SyncMeta syncState={syncState} /> : null}
    </View>
  );
};

const SyncMeta = ({ syncState }: { syncState: SyncState }) => {
  const theme = useAppTheme();
  const iconMap = {
    idle: 'check-circle-outline',
    'in-progress': 'cloud-sync',
    error: 'alert-circle',
    success: 'check-bold',
  } as const;
  const toneMap = {
    idle: 'muted',
    'in-progress': 'primary',
    error: 'error',
    success: 'success',
  } as const;
  const labelMap = {
    idle: 'Up to date',
    'in-progress': 'Syncing pending items',
    error: 'Sync failed',
    success: 'Synced successfully',
  } as const;

  const icon = iconMap[syncState.status];
  const tone = toneMap[syncState.status];
  const label = labelMap[syncState.status];

  return (
    <View style={[styles.syncRow, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.md }]}
      accessibilityRole="summary"
    >
      <AppIcon name={icon} size={20} color={tone === 'muted' ? 'muted' : tone} />
      <AppText variant="bodyMedium" color="text" style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText variant="labelSmall" color="muted">
        {syncState.lastSyncedAt ? `Last sync ${new Date(syncState.lastSyncedAt).toLocaleTimeString()}` : 'Pending'}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRow: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
});
