import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useLanguage } from '../../i18n';
import { Colors, Spacing, Typography, useThemeMode } from '../../theme';
import { Header } from '../../components';

const DOCS_URL = 'https://docs.vmass.vn';

export function DocsWebViewScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeMode();
  const { t } = useLanguage();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title={t('docs.title')} subtitle="docs.vmass.vn" onBack={() => navigation.goBack()} />
      <WebView
        source={{ uri: DOCS_URL }}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.centerState, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>{t('docs.loading')}</Text>
          </View>
        )}
        renderError={() => (
          <View style={[styles.centerState, { backgroundColor: colors.background }]}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>{t('docs.errorTitle')}</Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>{t('docs.errorMessage')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  stateText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
});
