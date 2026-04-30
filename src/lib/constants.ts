export const MAX_TEXT_LENGTH = 4000;
export const MAX_PDF_SIZE_MB = 5;

export const RISK_COLORS = {
  low: 'text-success border-success bg-success/10',
  medium: 'text-warn border-warn bg-warn/10',
  high: 'text-danger border-danger bg-danger/10',
};

export const RISK_LABELS = {
  low: 'Safe / Standard',
  medium: '⚡ Review Carefully',
  high: '⚠️ High Risk',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Loan Terms': 'bg-blue-900/40 text-blue-300',
  'Interest': 'bg-purple-900/40 text-purple-300',
  'Penalty': 'bg-red-900/40 text-red-300',
  'Insurance': 'bg-green-900/40 text-green-300',
  'Legal': 'bg-yellow-900/40 text-yellow-300',
  'Investment': 'bg-indigo-900/40 text-indigo-300',
  'Coverage': 'bg-teal-900/40 text-teal-300',
  'Exclusions': 'bg-orange-900/40 text-orange-300',
  'Fees': 'bg-pink-900/40 text-pink-300',
  'General': 'bg-navy-mid text-muted',
};

export const SAMPLE_TEXT = `The Borrower shall be liable for pre-payment charges at a rate of 2% per annum on the outstanding principal on the date of prepayment. The amortization schedule shall be recalculated basis the reducing balance method. Any cross-collateralisation event shall trigger immediate recall of the facility. The lender reserves the right to invoke the acceleration clause upon any event of default. CIBIL score deterioration beyond 50 points will constitute a material adverse change triggering enhanced security requirements. The Borrower hereby grants a general lien over all assets held with the lender. Minimum Amount Due does not reduce your principal balance.`;

export const DISCLAIMER = `ArthSaathi provides explanations for educational purposes only. This is NOT financial or legal advice. Always consult a qualified professional before signing any financial document. No document data is stored or shared.`;
