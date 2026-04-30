export type RiskLevel = 'low' | 'medium' | 'high';
export type Language = 'en' | 'hi';

export interface JargonTerm {
  term: string;
  explanation: string;
  bottomLine: string;
  riskLevel: RiskLevel;
  isPredatory: boolean;
  predatoryReason?: string;
  category: string;
}

export interface AnalysisResult {
  terms: JargonTerm[];
  summary: string;
  overallRisk: RiskLevel;
  documentType: string;
  keyWarnings: string[];
  termCount: number;
  predatoryCount: number;
  trustScore: number;
  trustScoreLabel: string;
}

export interface AnalyzeRequest {
  text: string;
  language: Language;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface QARequest {
  question: string;
  documentText: string;
  language: Language;
}

export interface QAResponse {
  success: boolean;
  answer?: string;
  error?: string;
}
