import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/atoms/app-button';
import { AppText } from '@/components/atoms/app-text';
import { InputField } from '@/components/atoms/input-field';
import { useAuthActions } from '@/hooks/use-auth-actions';
import type { AuthStackParamList } from '@/navigation/types';

interface FormValues {
  mobile: string;
}

export type MobileInputScreenProps = NativeStackScreenProps<AuthStackParamList, 'MobileInput'>;

export const MobileInputScreen = ({ navigation }: MobileInputScreenProps) => {
  const {
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
  } = useForm<FormValues>({ defaultValues: { mobile: '' } });
  const { requestOtp: sendOtp, status, errors: authErrors } = useAuthActions();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await sendOtp(values.mobile);
      navigation.navigate('OtpVerification', { mobile: values.mobile });
    } catch {
      // error handled via hook state
    }
  });

  return (
    <LinearGradient colors={['#A855F7', '#4C1D95']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <AppText style={styles.titleText}>NIDHISETU</AppText>
        </View>

        <View style={styles.header}>
          <AppText style={styles.subtitleText}>Sign into you account</AppText>
          <AppText style={styles.descriptionText}>You can log in with your mobile number.</AppText>
        </View>

        <View style={styles.formContainer}>
          <InputField
            leftIcon="phone"
            keyboardType="phone-pad"
            placeholder="8770764515"
            placeholderTextColor="#9CA3AF"
            errorText={formErrors.mobile?.message}
            onChangeText={(text) => setValue('mobile', text)}
            maxLength={10}
            backgroundColor="#FFFFFF"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
          />
          {authErrors.requestOtp ? (
            <AppText variant="bodySmall" color="error" style={styles.errorText}>
              {authErrors.requestOtp}
            </AppText>
          ) : null}
          <AppButton
            label="Login"
            onPress={onSubmit}
            loading={status.requestingOtp}
            disabled={status.requestingOtp}
            style={styles.button}
            tone="primary"
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#E9D5FF',
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    color: '#1F2937',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#7C3AED',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  errorText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 4,
    borderRadius: 4,
  },
});
