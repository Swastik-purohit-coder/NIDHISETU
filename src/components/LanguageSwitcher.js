import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppLocale } from 'lingo.dev/react';
import { LANGUAGE_LIST } from '../i18n/languageMap';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useAppLocale();

  return (
    <View style={styles.container}>
      {LANGUAGE_LIST.map(({ code, nativeLabel, flag }) => {
        const isActive = locale === code;
        return (
          <TouchableOpacity
            key={code}
            style={[styles.button, isActive && styles.buttonActive]}
            onPress={() => setLocale(code)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {flag} {nativeLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  buttonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  label: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  labelActive: {
    color: '#1D4ED8',
  },
});

export default LanguageSwitcher;
