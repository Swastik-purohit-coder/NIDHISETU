import { useMemo, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, type ViewStyle } from 'react-native';
import { useAppLocale, useT } from 'lingo.dev/react';

import { AppIcon } from '@/components/atoms/app-icon';
import { AppText } from '@/components/atoms/app-text';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/constants/languages';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTheme } from '@/constants/theme';

type Position = Pick<ViewStyle, 'top' | 'right' | 'bottom' | 'left'>;

type Props = {
  position?: Position;
  variant?: 'fab' | 'inline';
  buttonStyle?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
};

export const LanguageSwitcher = ({ position, variant = 'fab', buttonStyle, iconColor, iconSize }: Props) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();
  const { locale, setLocale } = useAppLocale();
  const [visible, setVisible] = useState(false);

  const handleSelect = (code: LanguageCode) => {
    setLocale(code);
    setVisible(false);
  };

  const trigger = (
    <TouchableOpacity
      style={variant === 'fab' ? styles.fab : [styles.inlineButton, buttonStyle]}
      onPress={() => setVisible(true)}
      accessibilityLabel={t('Change language')}
    >
      <AppIcon name="earth" size={iconSize ?? 22} color={iconColor ?? theme.colors.icon} />
    </TouchableOpacity>
  );

  const content = (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <AppText style={styles.sheetTitle}>{t('Choose your language')}</AppText>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <AppIcon name="close" size={20} color={theme.colors.icon} />
                </TouchableOpacity>
              </View>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.languageOption, locale === lang.code && styles.languageOptionActive]}
                  onPress={() => handleSelect(lang.code)}
                >
                  <AppText style={styles.languageLabel}>{lang.label}</AppText>
                  {locale === lang.code ? <AppIcon name="check" size={18} color="#22C55E" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (variant === 'inline') {
    return (
      <View>
        {trigger}
        {content}
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.fabContainer, position || { bottom: 22, right: 18 }]} pointerEvents="box-none">
        {trigger}
      </View>
      {content}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    fabContainer: {
      position: 'absolute',
      zIndex: 2000,
    },
    fab: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    inlineButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    sheet: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      gap: 12,
      elevation: 6,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    languageOptionActive: {
      borderColor: '#22C55E',
      backgroundColor: '#F0FDF4',
    },
    languageLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
  });
