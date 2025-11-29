import { decode as base64Decode } from 'base-64';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, InteractionManager, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { AppButton } from '@/components/atoms/app-button';
import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSubmissions } from '@/hooks/use-submissions';
import { supabase, SUPABASE_BUCKET } from '@/lib/supabaseClient';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import { useAuthStore } from '@/state/authStore';
import type { DrawerScreenProps } from '@react-navigation/drawer';

const localEvidenceDir = `${FileSystem.documentDirectory ?? ''}loan-evidence/`;

type LoanEvidenceCameraProps = DrawerScreenProps<BeneficiaryDrawerParamList, 'LoanEvidenceCamera'>;

export const LoanEvidenceCameraScreen = ({ route, navigation }: LoanEvidenceCameraProps) => {
  const { requirementId, requirementName, loanId } = route.params ?? {};
  const theme = useAppTheme();
  const cameraRef = useRef<CameraView | null>(null);
  const composedRef = useRef<View | null>(null);
  const userId = useAuthStore((state) => state.profile?.id ?? 'anonymous');
  const { submitEvidence } = useSubmissions();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>();
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean>();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>();
  const [photoUri, setPhotoUri] = useState<string>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const requestMediaPermission = useCallback(async () => {
    try {
      const options = Platform.OS === 'android'
        ? ({ accessPrivileges: 'readOnly', mediaTypes: MediaLibrary?.MediaTypeOptions?.Images } as MediaLibrary.PermissionOptions)
        : undefined;
      const status = await MediaLibrary.requestPermissionsAsync(options);
      const granted = status.status === 'granted';
      setHasMediaPermission(granted);
      if (!granted) {
        console.warn('Media library permission denied. Saving to gallery will be skipped.');
      }
      return granted;
    } catch (error) {
      console.warn('Media library permission error', error);
      if (error instanceof Error && error.message.includes('AUDIO permission')) {
        console.warn('Expo Go cannot request AUDIO permission. Skipping gallery save; evidence upload continues.');
      }
      Alert.alert(
        'Gallery access limited',
        'Saving captures to the device gallery is only available in a development build. Evidence uploads will continue.'
      );
      setHasMediaPermission(false);
      return false;
    }
  }, []);

  const saveToGalleryIfAllowed = useCallback(
    async (uri: string) => {
      if (!hasMediaPermission) {
        return;
      }
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
      } catch (error) {
        console.warn('Failed to save to media library', error);
      }
    },
    [hasMediaPermission]
  );

  const captureWatermarkedEvidence = useCallback(async () => {
    if (!composedRef.current) {
      throw new Error('Watermark view not available');
    }
    await new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));
    return captureRef(composedRef.current, {
      format: 'jpg',
      quality: 0.9,
      result: 'tmpfile',
    });
  }, []);

  const saveToLocalEvidenceFolder = useCallback(async (uri: string) => {
    if (!FileSystem.documentDirectory) {
      return undefined;
    }
    try {
      await FileSystem.makeDirectoryAsync(localEvidenceDir, { intermediates: true });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Already exists'))) {
        console.warn('Unable to ensure local evidence directory', error);
      }
    }
    const localPath = `${localEvidenceDir}${Date.now()}.jpg`;
    try {
      await FileSystem.copyAsync({ from: uri, to: localPath });
      return localPath;
    } catch (error) {
      console.warn('Failed to persist local evidence copy', error);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const requestRuntimePermissions = async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      await requestMediaPermission();

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
      if (locationStatus.status === 'granted') {
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
      }
    };

    void requestRuntimePermissions();
  }, [requestMediaPermission]);

  const ensureLocation = async () => {
    if (hasLocationPermission === false) {
      const status = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status.status === 'granted');
      if (status.status !== 'granted') {
        Alert.alert('Location needed', 'Grant location access to embed GPS on the photo.');
        return null;
      }
    }
    const position = await Location.getCurrentPositionAsync({});
    setLocation(position);
    return position;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });
      if (result?.uri) {
        setPhotoUri(result.uri);
        await saveToGalleryIfAllowed(result.uri);
        await saveToLocalEvidenceFolder(result.uri);
        await ensureLocation();
      }
    } catch (error) {
      console.error('Unable to capture photo', error);
      Alert.alert('Camera error', 'Unable to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadToStorage = async (uri: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      if (!info.exists) {
        throw new Error('Captured file is missing.');
      }
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const binary = base64Decode(base64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        buffer[i] = binary.charCodeAt(i);
      }
      const objectPath = `${userId ?? 'anonymous'}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(objectPath, buffer, { contentType: 'image/jpeg' });
      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }
      const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
      if (!data?.publicUrl) {
        throw new Error('Unable to generate Supabase public URL.');
      }
      return data.publicUrl;
    } catch (error) {
      console.error('uploadToStorage error', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown upload error');
    }
  };

  const handleConfirm = async () => {
    if (!photoUri) {
      return;
    }

    const activeLocation = location ?? (await ensureLocation());
    if (!activeLocation) {
      return;
    }

    setIsUploading(true);
    try {
      if (!hasMediaPermission) {
        await requestMediaPermission();
      }

      let composedUri: string;
      try {
        composedUri = await captureWatermarkedEvidence();
      } catch (captureError) {
        console.warn('Failed to capture watermarked evidence, falling back to raw photo', captureError);
        composedUri = photoUri;
      }

      await saveToGalleryIfAllowed(composedUri);
      await saveToLocalEvidenceFolder(composedUri);

      const remoteUrl = await uploadToStorage(composedUri);

      await submitEvidence({
        assetName: requirementName ?? 'Loan Evidence',
        mediaType: 'photo',
        capturedAt: new Date(activeLocation.timestamp ?? Date.now()).toISOString(),
        submittedAt: new Date().toISOString(),
        location: {
          latitude: activeLocation.coords.latitude,
          longitude: activeLocation.coords.longitude,
        },
        remarks: requirementId ? `Requirement: ${requirementId}` : undefined,
        mediaUrl: remoteUrl,
        thumbnailUrl: remoteUrl,
      });

      Alert.alert('Upload complete', 'Evidence uploaded successfully.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
      setPhotoUri(undefined);
    } catch (error) {
      console.error('Upload failed', error);
      const message = error instanceof Error ? error.message : 'Could not upload the evidence. Please retry.';
      Alert.alert('Upload failed', message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setPhotoUri(undefined);
  };

  const watermarkLines = useMemo(() => {
    if (!location) {
      return [];
    }
    const capturedAt = new Date(location.timestamp ?? Date.now());
    const datetime = `${capturedAt.getDate().toString().padStart(2, '0')}-${(capturedAt.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${capturedAt.getFullYear()} ${capturedAt
      .getHours()
      .toString()
      .padStart(2, '0')}:${capturedAt.getMinutes().toString().padStart(2, '0')}`;

    return [
      `Lat: ${location.coords.latitude.toFixed(5)}`,
      `Lon: ${location.coords.longitude.toFixed(5)}`,
      `Time: ${datetime}`,
      loanId ? `Loan: ${loanId}` : undefined,
      requirementName ? `Req: ${requirementName}` : undefined,
      userId ? `User: ${userId}` : undefined,
    ].filter(Boolean) as string[];
  }, [loanId, location, requirementName, userId]);

  if (hasCameraPermission === undefined) {
    return <SafeAreaView style={styles.center} />;
  }

  if (hasCameraPermission === false) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}
        accessibilityRole="alert"
      >
        <AppText variant="bodyLarge" color="text">
          Camera permission is required to capture evidence.
        </AppText>
        <AppButton
          label="Grant Permission"
          onPress={async () => {
            const status = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(status.status === 'granted');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Loan evidence camera"
    >
      {!photoUri ? (
        <View style={styles.cameraWrapper}>
          <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" mode="picture" />
          <View style={[styles.cameraOverlay, { paddingBottom: theme.spacing.xl }]} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.captureButton, { borderColor: theme.colors.text }]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              <View style={[styles.captureInner, { backgroundColor: theme.colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewWrapper} ref={composedRef} collapsable={false}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} />
          <View style={styles.watermarkOverlay} pointerEvents="none">
            <View style={[styles.watermark, { backgroundColor: theme.colors.overlay }]}
              accessibilityLabel="Watermark overlay"
            >
              {watermarkLines.map((line) => (
                <AppText key={line} variant="labelSmall" color="surface">
                  {line}
                </AppText>
              ))}
            </View>
          </View>
          <View style={styles.previewActions}>
            <AppButton label="Retake" icon="camera" variant="outline" onPress={handleRetake} disabled={isUploading} />
            <AppButton label={isUploading ? 'Uploading…' : 'Confirm'} icon="check" onPress={handleConfirm} disabled={isUploading} />
          </View>
        </View>
      )}

      {!photoUri && (
        <View
          style={[
            styles.metaBar,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <AppIcon name="crosshairs-gps" color="primary" />
          <AppText variant="bodySmall" color="muted">
            {location
              ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
              : hasLocationPermission === false
                ? 'Location permission required'
                : 'Fetching GPS lock…'}
          </AppText>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  cameraWrapper: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  previewWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    margin: 16,
    position: 'relative',
  },
  previewActions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 999,
    margin: 16,
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
  },
  watermark: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
});
