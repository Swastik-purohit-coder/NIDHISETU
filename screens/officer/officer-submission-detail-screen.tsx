import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { AppButton } from '@/components/atoms/app-button';
import { AppText } from '@/components/atoms/app-text';
import { WaveHeader } from '@/components/molecules/wave-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { submissionRepository } from '@/services/api/submissionRepository';
import type { SubmissionEvidence } from '@/types/entities';

export const OfficerSubmissionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const { submission, beneficiaryId } = route.params as { submission: SubmissionEvidence; beneficiaryId: string };

  const [currentSubmission, setCurrentSubmission] = useState(submission);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!currentSubmission.mediaUrl) {
      Alert.alert('Error', 'No image available to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
      const API_URL = `http://${host}:3000`;
      
      const response = await fetch(`${API_URL}/api/analyze-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: currentSubmission.mediaUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const aiAnalysis = await response.json();
      
      // Update in DB
      await submissionRepository.updateAIAnalysis(currentSubmission.id, aiAnalysis);
      
      // Update local state
      setCurrentSubmission(prev => ({ ...prev, aiAnalysis }));
      
      Alert.alert('Success', 'AI Analysis completed');
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#16A34A';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#DC2626';
      case 'correction_needed': return '#EAB308';
      default: return '#6B7280';
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await submissionRepository.updateStatus(submission.id, 'approved');
      Alert.alert('Success', 'Evidence approved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve evidence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(true);
      await submissionRepository.updateStatus(submission.id, 'rejected', rejectReason);
      Alert.alert('Success', 'Evidence rejected', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject evidence');
    } finally {
      setActionLoading(false);
      setModalVisible(false);
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText style={styles.value}>{value ?? 'N/A'}</AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WaveHeader title="Verify Evidence" onBack={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Image 
          source={{ uri: currentSubmission.mediaUrl || currentSubmission.thumbnailUrl || 'https://placehold.co/600x400/png' }} 
          style={styles.image} 
          resizeMode="cover" 
        />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <AppText style={styles.title}>{currentSubmission.assetName}</AppText>
            <View style={[styles.badge, { backgroundColor: getStatusColor(currentSubmission.status) + '20' }]}>
              <AppText style={[styles.statusText, { color: getStatusColor(currentSubmission.status) }]}>
                {currentSubmission.status.toUpperCase()}
              </AppText>
            </View>
          </View>

          <View style={styles.divider} />

          <DetailRow label="Captured At" value={new Date(currentSubmission.capturedAt).toLocaleString()} />
          <DetailRow label="Submitted At" value={currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString() : 'Pending Sync'} />
          
          <View style={styles.divider} />
          
          <AppText style={styles.sectionHeader}>Location Details</AppText>
          <DetailRow label="Latitude" value={currentSubmission.location?.latitude?.toFixed(6)} />
          <DetailRow label="Longitude" value={currentSubmission.location?.longitude?.toFixed(6)} />

          <View style={styles.divider} />

          <AppText style={styles.sectionHeader}>AI Detect</AppText>
          {currentSubmission.aiAnalysis ? (
            <>
              <DetailRow label="Object" value={currentSubmission.aiAnalysis.object} />
              <DetailRow label="Secondary Objects" value={currentSubmission.aiAnalysis.secondary_objects} />
              <DetailRow label="Image Quality" value={currentSubmission.aiAnalysis.image_quality_check} />
              <DetailRow label="Document Check" value={currentSubmission.aiAnalysis.document_check} />
              <DetailRow label="Geo/Time Check" value={currentSubmission.aiAnalysis.geo_timestamp_check} />
              <DetailRow label="Compliance" value={currentSubmission.aiAnalysis.compliance_status} />
              <DetailRow label="AI Remarks" value={currentSubmission.aiAnalysis.remarks} />
            </>
          ) : (
            <View>
              <AppText style={[styles.remarks, { marginBottom: 10 }]}>AI analysis pending or not available.</AppText>
              <AppButton 
                label="Analyze with AI" 
                onPress={handleAnalyze} 
                loading={isAnalyzing}
                disabled={isAnalyzing}
              />
            </View>
          )}

          {currentSubmission.remarks && (
            <>
              <View style={styles.divider} />
              <AppText style={styles.sectionHeader}>Remarks</AppText>
              <AppText style={styles.remarks}>{currentSubmission.remarks}</AppText>
            </>
          )}

          {currentSubmission.rejectionReason && (
            <>
              <View style={styles.divider} />
              <AppText style={[styles.sectionHeader, { color: '#DC2626' }]}>Rejection Reason</AppText>
              <AppText style={[styles.remarks, { color: '#DC2626' }]}>{currentSubmission.rejectionReason}</AppText>
            </>
          )}
        </View>

        <View style={styles.actions}>
          <AppButton 
            label="Approve Evidence" 
            onPress={handleApprove} 
            style={{ backgroundColor: '#16A34A', marginBottom: 12 }}
            disabled={actionLoading || currentSubmission.status === 'approved'}
            loading={actionLoading}
          />
          <AppButton 
            label="Reject Evidence" 
            onPress={() => setModalVisible(true)} 
            style={{ backgroundColor: '#DC2626' }}
            disabled={actionLoading || currentSubmission.status === 'rejected'}
          />
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Reject Evidence</AppText>
            <AppText style={styles.modalSubtitle}>Please provide a reason for rejection:</AppText>

            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Type reason here..."
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#F3F4F6' }]}
                onPress={() => setModalVisible(false)}
              >
                <AppText style={{ color: '#374151' }}>Cancel</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleReject}
              >
                <AppText style={{ color: 'white', fontWeight: '600' }}>Reject</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  remarks: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
