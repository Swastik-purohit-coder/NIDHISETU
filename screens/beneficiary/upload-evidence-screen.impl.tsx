import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/atoms/app-button';
import { AppText } from '@/components/atoms/app-text';
import { SubmissionCard } from '@/components/molecules/submission-card';
import MapView, { Marker } from '@/components/react-native-maps-shim';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSubmissions } from '@/hooks/use-submissions';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import type { SubmissionEvidence } from '@/types/entities';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HeroSurface, InfoRow, Pill, SectionCard, useBeneficiaryPalette } from './ui-kit';

export type UploadEvidenceScreenProps = NativeStackScreenProps<BeneficiaryDrawerParamList, 'UploadEvidence'>;

export const UploadEvidenceScreen = ({ route, navigation }: UploadEvidenceScreenProps) => {
  const { requirementId, requirementName } = route.params || {};
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { submissions, refresh, isLoading } = useSubmissions();
  const theme = useAppTheme();
  const palette = useBeneficiaryPalette();

  useEffect(() => {
    if (!locationPermission?.granted) {
      requestLocationPermission();
      return;
    }

    const fetchLocation = async () => {
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current);
    };

    void fetchLocation();
  }, [locationPermission, requestLocationPermission]);

  const requirementKey = useMemo(() => (requirementId ? `Requirement: ${requirementId}` : undefined), [requirementId]);

  const relatedSubmissions = useMemo(() => {
    if (!submissions.length) {
      return [] as SubmissionEvidence[];
    }
    if (!requirementKey && !requirementName) {
      return submissions;
    }
    return submissions.filter((submission) => {
      if (requirementKey && submission.remarks?.includes(requirementKey)) {
        return true;
      }
      if (requirementName && submission.assetName === requirementName) {
        return true;
      }
      return false;
    });
  }, [requirementKey, requirementName, submissions]);

  const gpsStatus: 'fetching' | 'ready' | 'error' = !locationPermission?.granted
    ? 'error'
    : location
      ? 'ready'
      : 'fetching';
  const gpsLabelMap: Record<typeof gpsStatus, string> = {
    fetching: 'Locating…',
    ready: 'GPS locked',
    error: 'Enable location',
  };
  const gpsToneMap: Record<typeof gpsStatus, 'success' | 'warning' | 'danger'> = {
    fetching: 'warning',
    ready: 'success',
    error: 'danger',
  };
  const gpsLabel = gpsLabelMap[gpsStatus];
  const lastCaptureAt = relatedSubmissions[0]?.capturedAt;
  const lastCaptureLabel = lastCaptureAt ? new Date(lastCaptureAt).toLocaleString() : 'Not captured yet';
  const uploadsLabel = `${relatedSubmissions.length} upload${relatedSubmissions.length === 1 ? '' : 's'}`;
  const locationLabel = location
    ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
    : gpsStatus === 'error'
      ? 'Location permission required'
      : 'Fetching coordinates…';

  const handleOpenCamera = () => {
    navigation.navigate('LoanEvidenceCamera', { requirementId, requirementName });
  };

  const handleRecordVideo = () => {
    Alert.alert('Coming soon', 'Video capture is not yet supported.');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={handleRefresh} />}
      accessibilityLabel="Upload evidence detail"
    >
      <HeroSurface>
         
        <AppText variant="titleLarge" color={palette.text} weight="700">
          {requirementName ? `Upload ${requirementName}` : 'Upload Evidence'}
        </AppText>
        <AppText variant="bodyMedium" color={palette.text} style={styles.heroSubtitle}>
          Capture geo-tagged proof with timestamp and watermark. Items upload automatically when online.
        </AppText>
        <View style={styles.heroPills}>
          <Pill label={gpsLabel} tone={gpsToneMap[gpsStatus]} />
          <Pill label={uploadsLabel} tone={relatedSubmissions.length ? 'sky' : 'success'} />
        </View>
        <View style={styles.heroActions}>
          <AppButton
            label="Capture Photo"
            icon="camera"
            onPress={handleOpenCamera}
            style={styles.heroActionButton}
          />
          <AppButton
            label="Record Video"
            icon="video"
            variant="secondary"
            onPress={handleRecordVideo}
            style={styles.heroActionButton}
          />
          <AppButton
            label="View Drafts"
            icon="folder"
            variant="outline"
            onPress={() => navigation.navigate('SyncStatus')}
            style={styles.heroActionButton}
          />
        </View>
      </HeroSurface>

      <SectionCard
        title="Capture readiness"
        subtitle="GPS lock and capture history"
        accentLabel={gpsStatus === 'ready' ? 'Ready' : gpsStatus === 'error' ? 'Action needed' : 'Fetching'}
      >
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <InfoRow label="GPS" value={gpsLabel} />
          </View>
          <View style={styles.infoItem}>
            <InfoRow label="Last capture" value={lastCaptureLabel} />
          </View>
        </View>
      </SectionCard>

      <SectionCard
        title="Location metadata"
        subtitle="Geo-tag ensures speedy verification"
        accentLabel={gpsLabel}
      >
        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="labelSmall" color="muted">
              Current coordinates
            </AppText>
            <AppText variant="titleSmall" color="text">
              {locationLabel}
            </AppText>
          </View>
          <AppButton label="View map" variant="outline" compact onPress={() => setShowMap(true)} />
        </View>
      </SectionCard>

      <SectionCard
        title="Recent uploads"
        subtitle="Review latest evidence submissions"
        accentLabel={uploadsLabel}
      >
        {relatedSubmissions.length ? (
          <View style={styles.submissionList}>
            {relatedSubmissions.map((submission) => (
              <SubmissionCard key={submission.id || submission.offlineId} submission={submission} />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { borderColor: palette.border }]} accessibilityRole="text">
            <AppText variant="bodyMedium" color="muted" align="center">
              No uploads yet. Tap “Capture Photo” to submit your first proof.
            </AppText>
          </View>
        )}
      </SectionCard>

      <AppButton
        label="View All Uploads"
        variant="secondary"
        onPress={() => navigation.navigate('PreviousSubmissions')}
      />

      <Modal visible={showMap} transparent animationType="fade">
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]} accessibilityViewIsModal>
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]} accessibilityLabel="Map preview">
            {location ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={location.coords} />
              </MapView>
            ) : (
              <AppText variant="bodyMedium" color="text">
                Fetching location…
              </AppText>
            )}
            <AppButton label="Close" onPress={() => setShowMap(false)} style={styles.modalCloseButton} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 72,
    gap: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  heroSubtitle: {
    opacity: 0.9,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroActionButton: {
    flexGrow: 1,
    minWidth: 140,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 160,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  submissionList: {
    gap: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  map: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalCloseButton: {
    marginTop: 4,
  },
});
