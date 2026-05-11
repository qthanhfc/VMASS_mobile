export interface TaxProfile {
  id: string;
  legalEntityName: string;
  taxCode: string;
  taxMethod: 'deduction' | 'direct';
  accountingRegime: 'TT200' | 'TT133' | 'TT88';
  declarationCycle: 'month' | 'quarter';
  fiscalYear: number;
  legalReferences: string[];
}

export interface TaxSummary {
  periodLabel: string;
  taxableRevenue: number;
  outputVat: number;
  inputVat: number;
  vatPayable: number;
  personalIncomeTaxPayable: number;
  temporaryCorporateIncomeTaxPayable: number;
  totalPayable: number;
  totalPaid: number;
  pendingAmount: number;
}

export interface TaxObligation {
  id: string;
  taxType: 'vat' | 'pit' | 'cit' | 'invoice-report';
  title: string;
  periodLabel: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'reviewed' | 'submitted' | 'paid' | 'overdue';
  formCode?: string;
  riskLevel: 'low' | 'medium' | 'high';
  note?: string;
}

export interface TaxIssue {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  ruleCode: string;
  title: string;
  description: string;
  suggestedAction: string;
}

export interface InvoiceReconciliationSummary {
  totalInvoices: number;
  matchedInvoices: number;
  mismatchInvoices: number;
  missingTaxCodeInvoices: number;
  taxRateMismatchInvoices: number;
  highRiskInvoices: number;
}

export interface TaxReturnDraft {
  id: string;
  formCode: string;
  taxType: 'vat' | 'pit' | 'cit';
  periodLabel: string;
  status: 'draft' | 'reviewed' | 'submitted';
  generatedAt: string;
  dueDate: string;
  payableAmount: number;
}

export interface TaxDashboard {
  profile: TaxProfile;
  summary: TaxSummary;
  obligations: TaxObligation[];
  returnDrafts: TaxReturnDraft[];
  invoiceReconciliation: InvoiceReconciliationSummary;
  issues: TaxIssue[];
  complianceScore: number;
  lastSyncedAt: string;
}
