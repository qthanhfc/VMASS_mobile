import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Card, StatusBadge } from '../../components';
import { useLanguage } from '../../i18n';
import { useRealtimeRefresh } from '../../realtime';
import { getTaxDashboard } from '../../services';
import type { TaxDashboard, TaxIssue, TaxObligation, TaxReturnDraft } from '../../types';

type TaxTab = 'obligations' | 'returns' | 'einvoice';

function money(amount: number, dateLocale: string, currency: string) {
  return `${amount.toLocaleString(dateLocale)} ${currency}`;
}

function formatDate(value: string, dateLocale: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(dateLocale);
}

function daysUntil(dueDate: string) {
  const today = new Date('2026-05-08T00:00:00+07:00').getTime();
  const due = new Date(`${dueDate}T23:59:59+07:00`).getTime();
  return Math.ceil((due - today) / (24 * 60 * 60 * 1000));
}

function issueIcon(issue: TaxIssue) {
  if (issue.severity === 'critical') return { name: 'alert-circle' as const, color: Colors.danger };
  if (issue.severity === 'warning') return { name: 'warning' as const, color: Colors.warning };
  return { name: 'information-circle' as const, color: Colors.primary };
}

function badgeForObligation(status: TaxObligation['status']) {
  if (status === 'paid') return { status: 'done', label: 'Đã nộp' };
  if (status === 'submitted') return { status: 'info', label: 'Đã gửi' };
  if (status === 'reviewed') return { status: 'pending', label: 'Đã rà soát' };
  if (status === 'overdue') return { status: 'cancelled', label: 'Quá hạn' };
  return { status: 'pending', label: 'Nháp' };
}

function badgeForReturn(status: TaxReturnDraft['status']) {
  if (status === 'submitted') return { status: 'done', label: 'Đã nộp' };
  if (status === 'reviewed') return { status: 'pending', label: 'Đã rà soát' };
  return { status: 'pending', label: 'Nháp' };
}

export function TaxScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const currency = t('home.currency');
  const [activeTab, setActiveTab] = useState<TaxTab>('obligations');
  const [dashboard, setDashboard] = useState<TaxDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTaxDashboard();
      setDashboard(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu thuế.';
      setError(message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );
  useRealtimeRefresh(['tax', 'dashboard', 'bookkeeping'], loadDashboard);

  const criticalIssue = useMemo(
    () => dashboard?.issues.find((item) => item.severity === 'critical') || dashboard?.issues[0],
    [dashboard],
  );

  const obligationsSorted = useMemo(() => {
    if (!dashboard) return [];

    return [...dashboard.obligations].sort((a, b) => {
      const byDate = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (byDate !== 0) return byDate;
      return b.amount - a.amount;
    });
  }, [dashboard]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tax.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>Đang tải trung tâm thuế...</Text>
        </View>
      ) : error || !dashboard ? (
        <View style={styles.stateWrap}>
          <Text style={[styles.stateText, { color: Colors.danger }]}>{error || 'Không có dữ liệu.'}</Text>
          <TouchableOpacity onPress={loadDashboard} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('products.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 40 }}>
          <Card padding={14}>
            <View style={styles.profileTop}>
              <View style={styles.profileLeft}>
                <Text style={styles.profileName}>{dashboard.profile.legalEntityName}</Text>
                <Text style={styles.profileSub}>MST: {dashboard.profile.taxCode}</Text>
                <Text style={styles.profileSub}>Chế độ: {dashboard.profile.accountingRegime} · Kỳ khai: {dashboard.profile.declarationCycle === 'quarter' ? 'Quý' : 'Tháng'}</Text>
              </View>
              <View style={[styles.scoreWrap, dashboard.complianceScore < 70 && styles.scoreRiskWrap]}>
                <Text style={styles.scoreLabel}>Điểm tuân thủ</Text>
                <Text style={styles.scoreValue}>{dashboard.complianceScore}/100</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Tổng phải nộp ({dashboard.summary.periodLabel})</Text>
                <Text style={styles.summaryValue}>{money(dashboard.summary.totalPayable, dateLocale, currency)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Đã nộp</Text>
                <Text style={styles.summaryValue}>{money(dashboard.summary.totalPaid, dateLocale, currency)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Còn phải nộp</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{money(dashboard.summary.pendingAmount, dateLocale, currency)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>GTGT phải nộp</Text>
                <Text style={styles.summaryValue}>{money(dashboard.summary.vatPayable, dateLocale, currency)}</Text>
              </View>
            </View>
          </Card>

          {criticalIssue ? (
            <View style={styles.alertCard}>
              <View style={styles.alertTitleWrap}>
                <Ionicons name={issueIcon(criticalIssue).name} size={18} color={issueIcon(criticalIssue).color} />
                <Text style={styles.alertTitle}>{criticalIssue.title}</Text>
              </View>
              <Text style={styles.alertDesc}>{criticalIssue.description}</Text>
              <Text style={styles.alertAction}>Khuyến nghị: {criticalIssue.suggestedAction}</Text>
            </View>
          ) : null}

          <View style={styles.tabWrap}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'obligations' && styles.tabBtnActive]} onPress={() => setActiveTab('obligations')}>
              <Text style={[styles.tabBtnLabel, activeTab === 'obligations' && styles.tabBtnLabelActive]}>Nghĩa vụ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'returns' && styles.tabBtnActive]} onPress={() => setActiveTab('returns')}>
              <Text style={[styles.tabBtnLabel, activeTab === 'returns' && styles.tabBtnLabelActive]}>Tờ khai</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'einvoice' && styles.tabBtnActive]} onPress={() => setActiveTab('einvoice')}>
              <Text style={[styles.tabBtnLabel, activeTab === 'einvoice' && styles.tabBtnLabelActive]}>Đối soát HĐĐT</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'obligations' ? (
            <Card padding={0}>
              {obligationsSorted.map((item, index) => {
                const badge = badgeForObligation(item.status);
                const dueIn = daysUntil(item.dueDate);

                return (
                  <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowSub}>{item.formCode ? `${item.formCode} · ` : ''}{item.periodLabel}</Text>
                      <Text style={styles.rowSub}>Hạn nộp: {formatDate(item.dueDate, dateLocale)} {item.amount > 0 ? `· ${dueIn >= 0 ? `còn ${dueIn} ngày` : `quá hạn ${Math.abs(dueIn)} ngày`}` : ''}</Text>
                      {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.rowAmount}>{item.amount > 0 ? money(item.amount, dateLocale, currency) : 'Đối soát'}</Text>
                      <StatusBadge status={badge.status} label={badge.label} />
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {activeTab === 'returns' ? (
            <>
              <Card padding={14}>
                <Text style={styles.sectionTitle}>Bản nháp tờ khai</Text>
                {dashboard.returnDrafts.map((item) => {
                  const badge = badgeForReturn(item.status);
                  return (
                    <View key={item.id} style={styles.returnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{item.formCode} · {item.periodLabel}</Text>
                        <Text style={styles.rowSub}>Sinh lúc: {formatDate(item.generatedAt, dateLocale)} · Hạn: {formatDate(item.dueDate, dateLocale)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={styles.rowAmount}>{money(item.payableAmount, dateLocale, currency)}</Text>
                        <StatusBadge status={badge.status} label={badge.label} />
                      </View>
                    </View>
                  );
                })}
              </Card>

              <Card padding={14}>
                <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                <View style={styles.quickGrid}>
                  <TouchableOpacity style={styles.quickCard}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                    <Text style={styles.quickLabel}>Tạo tờ khai kỳ này</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickCard}>
                    <Ionicons name="checkmark-done-outline" size={20} color={Colors.success} />
                    <Text style={styles.quickLabel}>Khóa sổ kỳ kê khai</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickCard}>
                    <Ionicons name="cloud-upload-outline" size={20} color={Colors.warning} />
                    <Text style={styles.quickLabel}>Xuất hồ sơ nộp thuế</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </>
          ) : null}

          {activeTab === 'einvoice' ? (
            <>
              <Card padding={14}>
                <Text style={styles.sectionTitle}>Kết quả đối soát hóa đơn điện tử</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Tổng hóa đơn</Text>
                    <Text style={styles.summaryValue}>{dashboard.invoiceReconciliation.totalInvoices}</Text>
                  </View>
                  <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Khớp sổ</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>{dashboard.invoiceReconciliation.matchedInvoices}</Text>
                  </View>
                  <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Lệch dữ liệu</Text>
                    <Text style={[styles.summaryValue, { color: Colors.warning }]}>{dashboard.invoiceReconciliation.mismatchInvoices}</Text>
                  </View>
                  <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Rủi ro cao</Text>
                    <Text style={[styles.summaryValue, { color: Colors.danger }]}>{dashboard.invoiceReconciliation.highRiskInvoices}</Text>
                  </View>
                </View>
              </Card>

              <Card padding={14}>
                <Text style={styles.sectionTitle}>Checklist tuân thủ</Text>
                {dashboard.issues.map((issue) => {
                  const icon = issueIcon(issue);
                  return (
                    <View key={issue.id} style={styles.issueRow}>
                      <View style={styles.issueIconWrap}>
                        <Ionicons name={icon.name} size={16} color={icon.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.issueTitle}>{issue.title}</Text>
                        <Text style={styles.issueDesc}>{issue.description}</Text>
                        <Text style={styles.issueAction}>{issue.suggestedAction}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3 },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  stateText: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  retryText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  profileTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  profileLeft: { flex: 1 },
  profileName: { ...Typography.h4, color: Colors.text },
  profileSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  scoreWrap: {
    borderRadius: Radius.md,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  scoreRiskWrap: {
    backgroundColor: Colors.warningLight,
  },
  scoreLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scoreValue: {
    ...Typography.h4,
    color: Colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCell: {
    width: '48%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    backgroundColor: Colors.card,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodyMd,
    color: Colors.text,
    marginTop: 2,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    padding: 12,
  },
  alertTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  alertDesc: {
    ...Typography.captionMd,
    color: Colors.text,
    marginTop: 6,
  },
  alertAction: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabBtnLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  tabBtnLabelActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  rowSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rowNote: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: 3,
  },
  rowAmount: {
    ...Typography.bodyMd,
    color: Colors.primary,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  quickLabel: {
    ...Typography.caption,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  issueRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  issueIconWrap: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    marginTop: 2,
  },
  issueTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  issueDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  issueAction: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 2,
  },
});
