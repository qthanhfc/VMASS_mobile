import type {
  InvoiceReconciliationSummary,
  TaxDashboard,
  TaxIssue,
  TaxObligation,
  TaxProfile,
  TaxReturnDraft,
  TaxSummary,
} from '../types';

const now = new Date('2026-05-08T10:00:00+07:00');

const profile: TaxProfile = {
  id: 'profile-main',
  legalEntityName: 'VMASS Demo Store Co.,Ltd',
  taxCode: '0312345678',
  taxMethod: 'deduction',
  accountingRegime: 'TT133',
  declarationCycle: 'quarter',
  fiscalYear: 2026,
  legalReferences: [
    'NĐ 123/2020/NĐ-CP',
    'TT 78/2021/TT-BTC',
    'TT 80/2021/TT-BTC',
    'NĐ 126/2020/NĐ-CP',
    'NĐ 91/2022/NĐ-CP',
  ],
};

const summarySeed = {
  taxableRevenue: 632_500_000,
  outputVat: 63_250_000,
  inputVat: 41_320_000,
  personalIncomeTaxPayable: 4_180_000,
  temporaryCorporateIncomeTaxPayable: 11_600_000,
  totalPaid: 25_000_000,
};

const obligations: TaxObligation[] = [
  {
    id: 'obl-vat-q2',
    taxType: 'vat',
    title: 'Kê khai thuế GTGT quý II/2026',
    periodLabel: 'Q2/2026',
    dueDate: '2026-07-30',
    amount: 21_930_000,
    status: 'draft',
    formCode: '01/GTGT',
    riskLevel: 'medium',
    note: 'Đang chờ đối soát 12 hóa đơn đầu vào.',
  },
  {
    id: 'obl-pit-q2',
    taxType: 'pit',
    title: 'Kê khai khấu trừ TNCN quý II/2026',
    periodLabel: 'Q2/2026',
    dueDate: '2026-07-30',
    amount: 4_180_000,
    status: 'reviewed',
    formCode: '05/KK-TNCN',
    riskLevel: 'low',
  },
  {
    id: 'obl-cit-q2',
    taxType: 'cit',
    title: 'Tạm nộp thuế TNDN quý II/2026',
    periodLabel: 'Q2/2026',
    dueDate: '2026-07-30',
    amount: 11_600_000,
    status: 'draft',
    formCode: 'TNDN tạm nộp',
    riskLevel: 'medium',
  },
  {
    id: 'obl-vat-q1',
    taxType: 'vat',
    title: 'Kê khai thuế GTGT quý I/2026',
    periodLabel: 'Q1/2026',
    dueDate: '2026-04-30',
    amount: 18_240_000,
    status: 'paid',
    formCode: '01/GTGT',
    riskLevel: 'low',
  },
  {
    id: 'obl-invoice',
    taxType: 'invoice-report',
    title: 'Đối soát hóa đơn điện tử tháng 05/2026',
    periodLabel: '05/2026',
    dueDate: '2026-06-20',
    amount: 0,
    status: 'submitted',
    riskLevel: 'high',
    note: 'Có 6 hóa đơn sai thuế suất cần điều chỉnh.',
  },
];

const returnDrafts: TaxReturnDraft[] = [
  {
    id: 'ret-gtgt-q2',
    formCode: '01/GTGT',
    taxType: 'vat',
    periodLabel: 'Q2/2026',
    status: 'draft',
    generatedAt: '2026-05-08T09:30:00+07:00',
    dueDate: '2026-07-30',
    payableAmount: 21_930_000,
  },
  {
    id: 'ret-pit-q2',
    formCode: '05/KK-TNCN',
    taxType: 'pit',
    periodLabel: 'Q2/2026',
    status: 'reviewed',
    generatedAt: '2026-05-07T17:05:00+07:00',
    dueDate: '2026-07-30',
    payableAmount: 4_180_000,
  },
  {
    id: 'ret-cit-q2',
    formCode: 'TNDN tạm nộp',
    taxType: 'cit',
    periodLabel: 'Q2/2026',
    status: 'draft',
    generatedAt: '2026-05-06T11:20:00+07:00',
    dueDate: '2026-07-30',
    payableAmount: 11_600_000,
  },
];

const invoiceReconciliation: InvoiceReconciliationSummary = {
  totalInvoices: 418,
  matchedInvoices: 392,
  mismatchInvoices: 26,
  missingTaxCodeInvoices: 7,
  taxRateMismatchInvoices: 6,
  highRiskInvoices: 4,
};

function computeSummary(): TaxSummary {
  const vatPayable = Math.max(summarySeed.outputVat - summarySeed.inputVat, 0);
  const totalPayable = vatPayable + summarySeed.personalIncomeTaxPayable + summarySeed.temporaryCorporateIncomeTaxPayable;
  const pendingAmount = Math.max(totalPayable - summarySeed.totalPaid, 0);

  return {
    periodLabel: 'Q2/2026',
    taxableRevenue: summarySeed.taxableRevenue,
    outputVat: summarySeed.outputVat,
    inputVat: summarySeed.inputVat,
    vatPayable,
    personalIncomeTaxPayable: summarySeed.personalIncomeTaxPayable,
    temporaryCorporateIncomeTaxPayable: summarySeed.temporaryCorporateIncomeTaxPayable,
    totalPayable,
    totalPaid: summarySeed.totalPaid,
    pendingAmount,
  };
}

function parseDate(value: string) {
  const date = new Date(`${value}T23:59:59+07:00`);
  return Number.isFinite(date.getTime()) ? date : now;
}

function daysUntilDue(dueDate: string) {
  const due = parseDate(dueDate).getTime();
  const diff = due - now.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function complianceIssues(list: TaxObligation[]): TaxIssue[] {
  const issues: TaxIssue[] = [];

  list.forEach((item) => {
    const dueInDays = daysUntilDue(item.dueDate);

    if (item.status !== 'paid' && dueInDays < 0 && item.amount > 0) {
      issues.push({
        id: `issue-overdue-${item.id}`,
        severity: 'critical',
        ruleCode: 'VN.TAX.DEADLINE.OVERDUE',
        title: 'Nghĩa vụ thuế quá hạn',
        description: `${item.title} đã quá hạn ${Math.abs(dueInDays)} ngày.`,
        suggestedAction: 'Ưu tiên nộp tờ khai và tiền thuế ngay để giảm rủi ro xử phạt chậm nộp.',
      });
    } else if (item.status !== 'paid' && dueInDays <= 7 && item.amount > 0) {
      issues.push({
        id: `issue-near-due-${item.id}`,
        severity: 'warning',
        ruleCode: 'VN.TAX.DEADLINE.NEAR_DUE',
        title: 'Nghĩa vụ thuế sắp đến hạn',
        description: `${item.title} còn ${dueInDays} ngày đến hạn nộp.`,
        suggestedAction: 'Khóa dữ liệu kỳ kê khai và thực hiện rà soát trước khi nộp.',
      });
    }
  });

  if (invoiceReconciliation.mismatchInvoices > 0) {
    issues.push({
      id: 'issue-invoice-mismatch',
      severity: invoiceReconciliation.highRiskInvoices > 0 ? 'critical' : 'warning',
      ruleCode: 'VN.EINVOICE.RECONCILIATION',
      title: 'Có hóa đơn điện tử chưa đối soát',
      description: `${invoiceReconciliation.mismatchInvoices} hóa đơn lệch dữ liệu với sổ kế toán.`,
      suggestedAction: 'Đối soát hóa đơn lệch trước khi khóa sổ kỳ hiện tại.',
    });
  }

  if (invoiceReconciliation.missingTaxCodeInvoices > 0) {
    issues.push({
      id: 'issue-missing-taxcode',
      severity: 'warning',
      ruleCode: 'VN.EINVOICE.MISSING_TAX_CODE',
      title: 'Hóa đơn thiếu mã số thuế bên mua',
      description: `${invoiceReconciliation.missingTaxCodeInvoices} hóa đơn chưa có MST hợp lệ.`,
      suggestedAction: 'Bổ sung thông tin người mua hoặc lập hóa đơn điều chỉnh theo đúng quy định.',
    });
  }

  return issues;
}

function computeComplianceScore(issues: TaxIssue[]) {
  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === 'critical') return total + 25;
    if (issue.severity === 'warning') return total + 10;
    return total + 3;
  }, 0);

  return Math.max(0, 100 - penalty);
}

export async function getTaxDashboard(): Promise<TaxDashboard> {
  const summary = computeSummary();
  const issues = complianceIssues(obligations);

  return {
    profile,
    summary,
    obligations,
    returnDrafts,
    invoiceReconciliation,
    issues,
    complianceScore: computeComplianceScore(issues),
    lastSyncedAt: now.toISOString(),
  };
}
