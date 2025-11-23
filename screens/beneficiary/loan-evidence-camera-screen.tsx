import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { AppButton } from '@/components/atoms/app-button';
import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { app, db } from '@/lib/firebase';
import { useAuthStore } from '@/state/authStore';

const storage = getStorage(app);

export interface LoanEvidenceCameraScreenProps {
  loanId?: string;
  onUploadComplete?: (payload: { imageURL: string; documentId: string }) => void;
}

export const LoanEvidenceCameraScreen = ({ loanId, onUploadComplete }: LoanEvidenceCameraScreenProps) => {
  const theme = useAppTheme();
  const cameraRef = useRef<CameraView | null>(null);
  const containerRef = useRef<View | null>(null);
  const userId = useAuthStore((state) => state.profile?.id ?? 'anonymous');

  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>();
  const [photoUri, setPhotoUri] = useState<string>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    void (async () => {
       if (!permission) {
         await requestPermission();
       }
       if (!mediaPermission) {
         await requestMediaPermission();
       }
       const locationStatus = await Location.requestForegroundPermissionsAsync();
       setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, [permission, requestPermission, mediaPermission, requestMediaPermission]);

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
        await ensureLocation();
      }
    } catch (error) {
      console.error('Unable to capture photo', error);
      Alert.alert('Camera error', 'Unable to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const ensureLocation = async () => {
    if (!hasLocationPermission) {
      const status = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status.status === 'granted');
      if (status.status !== 'granted') {
        Alert.alert('Location needed', 'Grant location access to embed GPS on the photo.');
        return;
      }
    }

    const position = await Location.getCurrentPositionAsync({});
    setLocation(position);
  };

  const handleRetake = () => {
    setPhotoUri(undefined);
  };

  const handleConfirm = async () => {
    if (!photoUri) {
      return;
    }

    if (!location) {
      await ensureLocation();
      if (!location) {
        return;
      }
    }

    setIsUploading(true);
    try {
      const finalUri = await captureRef(containerRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      // Save to local gallery
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(finalUri);
      }
      
      const remoteUrl = await uploadToStorage(finalUri);
      const docRef = await saveMetadata(remoteUrl);
      onUploadComplete?.({ imageURL: remoteUrl, documentId: docRef.id });
      Alert.alert('Saved & Uploaded', 'Evidence photo saved to gallery and uploaded successfully.');
      setPhotoUri(undefined);
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert('Upload failed', 'Could not upload the evidence. Please retry.');
    } finally {
      setIsUploading(false);
    }
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
      userId ? `User: ${userId}` : undefined,
    ].filter(Boolean) as string[];
  }, [loanId, location, userId]);

  const uploadToStorage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `loan-evidence/${userId ?? 'anonymous'}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  };

  const saveMetadata = (imageURL: string) => {
    if (!location) {
      throw new Error('Missing location metadata');
    }
    const payload = {
      imageURL,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: serverTimestamp(),
      capturedAt: new Date(location.timestamp ?? Date.now()).toISOString(),
      userId: userId ?? null,
      loanId: loanId ?? null,
    };

    return addDoc(collection(db, 'loanEvidence'), payload);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <AppText variant="bodyLarge" color="text">
          Camera permission is required.
        </AppText>
        <AppButton label="Grant permission" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessibilityLabel="Loan evidence camera"
    >
      {!photoUri ? (
        <CameraView style={styles.camera} ref={cameraRef} facing="back" mode="picture">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={isCapturing}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewWrapper} ref={containerRef} collapsable={false}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} />
          
          <View style={styles.watermarkOverlay} pointerEvents="none">
             <View style={[styles.watermark, { backgroundColor: '#00000088' }]}>
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
        <View style={styles.metaBar}>
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
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
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
