import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { SubmissionList } from '@/components/organisms/submission-list';
import { useSubmissions } from '@/hooks/use-submissions';
import type { BeneficiaryDrawerParamList } from '@/navigation/types';
import type { SubmissionEvidence } from '@/types/entities';

export type PreviousSubmissionsScreenProps = NativeStackScreenProps<BeneficiaryDrawerParamList, 'PreviousSubmissions'>;

export const PreviousSubmissionsScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<BeneficiaryDrawerParamList>>();
  const { submissions, refresh, isLoading } = useSubmissions();

  const handleRetry = (submission: SubmissionEvidence) => {
    // Use assetName as requirementName
    navigation.navigate('UploadEvidence', { 
        requirementId: submission.assetName, 
        requirementName: submission.assetName 
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <SubmissionList
        submissions={submissions}
        refreshing={isLoading}
        onRefresh={() => {
          void refresh();
        }}
        onPressRetry={handleRetry}
      />
    </View>
  );
};
