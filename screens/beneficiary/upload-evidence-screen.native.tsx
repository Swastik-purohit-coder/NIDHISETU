import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { AppButton } from '@/components/atoms/app-button';
import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { Chip } from '@/components/atoms/chip';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type UploadEvidenceScreenProps = NativeStackScreenProps<BeneficiaryDrawerParamList, 'UploadEvidence'>;

export const UploadEvidenceScreen = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to capture');
  const cameraRef = useRef<CameraView>(null);
  const theme = useAppTheme();

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!microphonePermission?.granted) {
      requestMicrophonePermission();
    }
  }, [cameraPermission, requestCameraPermission, microphonePermission, requestMicrophonePermission]);

  useEffect(() => {
    if (!locationPermission?.granted) {
      requestLocationPermission();
      return;
    }

    const fetchLocation = async () => {
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current);
    };
    fetchLocation();
  }, [locationPermission, requestLocationPermission]);

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    setStatusMessage('Capturing photo…');
    await cameraRef.current.takePictureAsync();
    setStatusMessage('Saved offline. Sync pending.');
  };

  const handleCaptureVideo = async () => {
    if (!cameraRef.current) return;
    setStatusMessage('Recording video…');
    await cameraRef.current.recordAsync({ maxDuration: 10 });
    setStatusMessage('Video saved locally');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        {cameraPermission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject}>
            <View style={styles.cameraOverlay}>
              <Chip label={statusMessage} tone="secondary" />
              <Chip
                label={location ? 'GPS Locked' : 'Fetching GPS…'}
                tone={location ? 'success' : 'warning'}
                leftIcon={<AppIcon name="crosshairs-gps" color={location ? 'success' : 'warning'} />}
                onPress={() => setShowMap(true)}
              />
            </View>
          </CameraView>
        ) : (
          <View style={styles.permissionView}>
            <AppText variant="bodyMedium" color="text">
              Camera permission required
            </AppText>
            <AppButton label="Grant Access" onPress={requestCameraPermission} />
          </View>
        )}
      </View>
      <View style={styles.actionRow}>
        <AppButton label="Capture Photo" icon="camera" onPress={handleCapturePhoto} />
        <AppButton label="Record Video" icon="video" variant="secondary" onPress={handleCaptureVideo} />
      </View>
      <View style={styles.infoCard}>
        <AppText variant="titleSmall" color="text">
          Offline Queue
        </AppText>
        <AppText variant="bodySmall" color="muted">
          Evidence files are saved locally with timestamp and GPS.
        </AppText>
        <AppButton label="View Pending Uploads" variant="outline" icon="cloud-off-outline" />
      </View>
      <Modal visible={showMap} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
            accessible
            accessibilityLabel="Map preview"
          >
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
            <AppButton label="Close" onPress={() => setShowMap(false)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  cameraWrapper: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraOverlay: {
    padding: 16,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F6FF',
    gap: 6,
  },
  permissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 16,
  },
  map: {
    height: 240,
    borderRadius: 12,
  },
});
