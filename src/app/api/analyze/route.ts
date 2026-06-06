import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { extractTextFromPDF } from '@/lib/pdfParser';
import { MAX_TEXT_LENGTH, MAX_PDF_SIZE_MB } from '@/lib/constants';
import type { AnalyzeRequest, AnalyzeResponse, AnalysisResult, JargonTerm } from '@/types';
 
// ============================================================
// ARTHSAATHI — MASTER ANALYSIS SYSTEM PROMPT
// Version 2.0 | Engineered for Financial & Legal Documents
// ============================================================
 
// Call 1: Document profile, summary, financial snapshot, overall assessment
const SYSTEM_PROMPT_SUMMARY = `You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements. You combine the precision of
a senior corporate lawyer, the clarity of a financial advisor, and the accessibility of
a trusted friend who explains complex documents in plain language.
 
You analyze ALL types of documents — loan agreements, franchise agreements, franchise deeds,
partnership agreements, joint venture agreements, MoUs, term sheets, investment agreements,
shareholder agreements, employment contracts, lease deeds, sale deeds, insurance policies,
credit card agreements, mutual fund documents, bank account terms, licensing agreements,
distribution agreements, and any other financial or legal document — from India or anywhere
in the world.
 
Your task in this call: Analyze the document and return ONLY the summary, profile, financial snapshot, and overall assessment. Do NOT include clauseAnalysis.
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "documentProfile": {
    "documentType": "Precise document type",
    "parties": [
      {
        "name": "Party name",
        "role": "Their role",
        "powerPosition": "stronger | weaker | equal"
      }
    ],
    "coreTransaction": "One sentence: what is being exchanged",
    "termDuration": "How long the agreement lasts",
    "governingLaw": "Jurisdiction and governing law",
    "effectiveDate": "Date or 'To be determined'"
  },
  "executiveSummary": "4-5 sentences for a busy professional. What is this document, key commercial terms, top 2-3 risks, overall power balance. No jargon.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial obligation over full term",
    "immediatePaymentOnSigning": "Amount due on signing or null",
    "keyPaymentMilestones": [
      {
        "period": "e.g. Year 1",
        "amount": "Amount",
        "description": "What it covers",
        "dueDate": "When due",
        "consequences": "If not paid"
      }
    ],
    "revenueShareStructure": "How revenue is shared",
    "hiddenOrAdditionalCosts": ["Hidden cost 1", "Hidden cost 2"],
    "taxImplications": "GST / tax obligations"
  },
  "criticalFlags": [
    {
      "flag": "Short title",
      "severity": "high | critical",
      "location": "Clause number",
      "explanation": "Why this is dangerous",
      "questionsToRaise": "Question to ask"
    }
  ],
  "sectionSummaries": {
    "parties": "Power dynamic summary",
    "financialTerms": "All money moving between parties",
    "intellectualProperty": "IP ownership and licenses",
    "obligations": "Key ongoing obligations",
    "termination": "Termination conditions and consequences",
    "disputeResolution": "How disputes are resolved",
    "exitAndTransfer": "Exit and transfer rights"
  },
  "negotiationPriorityList": [
    {
      "priority": 1,
      "clause": "Clause reference",
      "issue": "What needs negotiating",
      "suggestedPosition": "What to ask for"
    }
  ],
  "regulatoryContext": {
    "applicableLaws": ["Applicable law 1"],
    "complianceRequirements": ["Compliance requirement 1"],
    "potentiallyProblematicClauses": ["Problematic clause 1"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Which party has more leverage",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 sentences",
    "topThreeRisks": [
      "Risk 1",
      "Risk 2",
      "Risk 3"
    ]
  }
}
 
Do not include any text outside the JSON object.`;
 
// Call 2: Clause-by-clause analysis only
const SYSTEM_PROMPT_CLAUSES = `You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements.
 
Your task in this call: Analyze EVERY numbered clause or section in the document and return a clauseAnalysis array.
 
CRITICAL RULES:
- You MUST include every single numbered clause — do not skip or merge any
- Keep each entry concise — max 150 words total per clause
- Do not stop early — the JSON is not complete until every clause is covered
- isFavorableToStrongerParty must be true or false (boolean, not string)
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "clauseAnalysis": [
    {
      "clauseId": "Clause 1",
      "clauseTitle": "Short name max 5 words",
      "category": "one of: Financial, Legal Rights, Intellectual Property, Termination, Dispute Resolution, Obligations, Exclusivity, Ownership & Transfer, Governance, Confidentiality, Force Majeure, Indemnity, General",
      "whatItSays": "2 sentences max. Plain English, state the consequence.",
      "whyItMatters": "1 sentence max.",
      "riskLevel": "low | medium | high | critical",
      "riskBearing": "franchisee | franchisor | both | borrower | lender | employee | employer",
      "isFavorableToStrongerParty": true,
      "keyQuestionsToAsk": ["One specific question"],
      "negotiationSuggestion": "1 sentence max."
    }
  ],
  "termCount": 11,
  "criticalFlagCount": 3
}
 
Do not include any text outside the JSON object.`;
 
// Maps new prompt's riskLevel values (which include "critical") to the
// RiskLevel type used by the frontend ("low" | "medium" | "high")
const toRiskLevel = (r: string): 'low' | 'medium' | 'high' => {
  if (r === 'high' || r === 'critical') return 'high';
  if (r === 'medium') return 'medium';
  return 'low';
};
 
// Derives an overall document risk from the clause list
const deriveOverallRisk = (terms: JargonTerm[]): 'low' | 'medium' | 'high' => {
  if (terms.some((t) => t.riskLevel === 'high')) return 'high';
  if (terms.some((t) => t.riskLevel === 'medium')) return 'medium';
  return 'low';
};
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToAnalysisResult = (summary: any, clauses: any): AnalysisResult => {
  const profile = summary.documentProfile ?? {};
  const assessment = summary.overallAssessment ?? {};
 
  const terms: JargonTerm[] = (clauses.clauseAnalysis ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any): JargonTerm => ({
      term: c.clauseTitle ?? 'Untitled Clause',
      explanation: c.whatItSays ?? '',
      bottomLine: c.whyItMatters ?? '',
      riskLevel: toRiskLevel(c.riskLevel ?? 'low'),
      isPredatory: c.isFavorableToStrongerParty === true,
      predatoryReason: c.isFavorableToStrongerParty
        ? (c.negotiationSuggestion ?? undefined)
        : undefined,
      category: c.category ?? 'General',
    })
  );
 
  return {
    terms,
    summary: summary.executiveSummary ?? '',
    overallRisk: deriveOverallRisk(terms),
    documentType: profile.documentType ?? 'Document',
    keyWarnings: assessment.topThreeRisks ?? [],
    termCount: terms.length,
    predatoryCount: terms.filter((t) => t.isPredatory).length,
    trustScore: typeof assessment.fairnessScore === 'number'
      ? assessment.fairnessScore
      : parseInt(assessment.fairnessScore, 10) || 50,
    trustScoreLabel: assessment.fairnessLabel ?? '',
  };
};
 
export async function POST(req: NextRequest) {
  try {
    console.log('Analysis request received');
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);
 
    let text: string = '';
    let language: 'en' | 'hi' = 'en';
 
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      language = (formData.get('language') as 'en' | 'hi') || 'en';
 
      if (!file) {
        return NextResponse.json<AnalyzeResponse>(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }
 
      if (file.type !== 'application/pdf') {
        return NextResponse.json<AnalyzeResponse>(
          { success: false, error: 'Only PDF files are supported' },
          { status: 400 }
        );
      }
 
      const maxSizeBytes = MAX_PDF_SIZE_MB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return NextResponse.json<AnalyzeResponse>(
          { success: false, error: `PDF must be under ${MAX_PDF_SIZE_MB}MB` },
          { status: 400 }
        );
      }
 
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfResult = await extractTextFromPDF(buffer);
 
      if (!pdfResult.text || pdfResult.text.length === 0) {
        return NextResponse.json<AnalyzeResponse>(
          { success: false, error: 'Could not extract text from PDF. The file might be corrupted, password-protected, or image-based (scanned). Please try a different PDF.' },
          { status: 400 }
        );
      }
 
      text = pdfResult.text;
      console.log('PDF parsed successfully, text length:', text.length, 'pages:', pdfResult.pageCount);
    } else {
      const body: AnalyzeRequest = await req.json();
      text = body.text?.trim() || '';
      language = body.language || 'en';
    }
 
    if (!text) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Text cannot be empty' },
        { status: 400 }
      );
    }
 
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: `Text exceeds ${MAX_TEXT_LENGTH} character limit` },
        { status: 400 }
      );
    }
 
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const userContent = `Output language: ${language === 'hi' ? 'Hindi' : 'English'}\n\nDocument to analyze:\n${text}`;
 
    console.log('Calling Groq API (2 parallel calls) with text length:', text.length);
 
    // Run both calls in parallel
    const [summaryResult, clausesResult] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
          { role: 'user', content: userContent },
        ],
      }),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 6000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_CLAUSES },
          { role: 'user', content: userContent },
        ],
      }),
    ]);
 
    const summaryContent = summaryResult.choices[0]?.message?.content;
    const clausesContent = clausesResult.choices[0]?.message?.content;
 
    console.log('Summary response length:', summaryContent?.length, '| finish:', summaryResult.choices[0]?.finish_reason);
    console.log('Clauses response length:', clausesContent?.length, '| finish:', clausesResult.choices[0]?.finish_reason);
 
    if (!summaryContent || !clausesContent) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Failed to analyze document' },
        { status: 500 }
      );
    }
 
    const cleanSummary = summaryContent.replace(/```json\n?|\n?```/g, '').trim();
    const cleanClauses = clausesContent.replace(/```json\n?|\n?```/g, '').trim();
 
    const rawSummary = JSON.parse(cleanSummary);
    const rawClauses = JSON.parse(cleanClauses);
 
    const data = mapToAnalysisResult(rawSummary, rawClauses);
    console.log('Mapped data, terms count:', data.termCount);
 
    return NextResponse.json<AnalyzeResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json<AnalyzeResponse>(
      { success: false, error: 'An error occurred while analyzing the document' },
      { status: 500 }
    );
  }
}
