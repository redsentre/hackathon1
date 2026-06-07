import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { extractTextFromPDF } from '@/lib/pdfParser';
import { MAX_TEXT_LENGTH, MAX_PDF_SIZE_MB } from '@/lib/constants';
import type { AnalyzeRequest, AnalyzeResponse, AnalysisResult, JargonTerm } from '@/types';
 
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
 
// ============================================================
// CALL 1: Document profile, summary, financial snapshot, assessment
// ============================================================
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
 
Your task: Analyze the document and return ONLY the summary, profile, financial snapshot, and overall assessment.
Do NOT include clauseAnalysis.
 
PRECISION RULES — NON-NEGOTIABLE:
- Always state exact rupee/currency amounts, not approximations
- Always state exact percentages, not "a percentage"
- Always state exact timeframes (days, months, years), not "a period"
- Always state exact distances, penalties, multipliers as written in the document
- financialSnapshot must capture EVERY financial obligation — upfront fees, recurring fees, setup costs, penalties, renewal fees
- hiddenOrAdditionalCosts must list ALL costs beyond the headline fee including setup, fit-out, staffing, equipment
- topThreeRisks must be specific — name the exact clause mechanism with numbers, not a generic category
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "documentProfile": {
    "documentType": "Precise document type e.g. Franchise Agreement",
    "parties": [
      {
        "name": "Party name as in document",
        "role": "Their role e.g. Franchisor, Franchisee",
        "powerPosition": "stronger | weaker | equal"
      }
    ],
    "coreTransaction": "One precise sentence: what is fundamentally being exchanged",
    "termDuration": "Exact duration e.g. 5-year initial term renewable for 5 more years at Franchisor discretion",
    "governingLaw": "Exact jurisdiction and governing law",
    "effectiveDate": "Date or To be determined"
  },
  "executiveSummary": "4-5 sentences for a busy professional. State the document type, exact key financial terms with numbers, the top 2-3 specific risks with clause references, and which party holds more power. No jargon. Be specific with numbers.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial exposure over full term with exact numbers — include ALL fees, setup costs, royalties, levies, renewal fees. Give a total range.",
    "immediatePaymentOnSigning": "Exact amount due immediately on signing or null",
    "keyPaymentMilestones": [
      {
        "period": "e.g. On signing / Monthly / On renewal",
        "amount": "Exact amount",
        "description": "What this payment covers",
        "dueDate": "Exact due date or trigger",
        "consequences": "Exact consequence of non-payment e.g. immediate termination within 3 days"
      }
    ],
    "revenueShareStructure": "Exact revenue share percentages and how they are calculated and when due",
    "hiddenOrAdditionalCosts": [
      "Fit-out, equipment, staffing and operations costs: exact range if stated",
      "Any other cost not included in the headline fee — GST, audit costs, penalties"
    ],
    "taxImplications": "GST and tax obligations — who bears them, whether stated or implied"
  },
  "criticalFlags": [
    {
      "flag": "Short title of the critical issue",
      "severity": "high | critical",
      "location": "Exact clause number",
      "explanation": "Specific plain English explanation with exact numbers/timeframes — why this is dangerous",
      "questionsToRaise": "Specific question to raise before signing"
    }
  ],
  "sectionSummaries": {
    "parties": "Who the parties are and the power dynamic",
    "financialTerms": "Complete summary of all money with exact figures",
    "intellectualProperty": "Who owns what IP — including whether innovations and improvements made BY the weaker party vest in the stronger party on termination",
    "obligations": "Key ongoing obligations of each party with specifics",
    "termination": "Every exact trigger for termination with specific numbers and timeframes",
    "disputeResolution": "Exactly how disputes are resolved, who appoints arbitrators, seat of arbitration, whether courts are waived",
    "exitAndTransfer": "Exact post-termination obligations including non-compete scope, distance, and duration"
  },
  "negotiationPriorityList": [
    {
      "priority": 1,
      "clause": "Exact clause reference",
      "issue": "Specific issue to negotiate",
      "suggestedPosition": "Specific ask with alternative terms"
    }
  ],
  "regulatoryContext": {
    "applicableLaws": ["Specific laws referenced or applicable"],
    "complianceRequirements": ["Specific compliance obligations"],
    "potentiallyProblematicClauses": ["Clauses that may conflict with applicable law — e.g. waiver of consumer forum access"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Specific assessment of which party has more protection and exactly why",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 specific sentences referencing actual clauses and numbers",
    "topThreeRisks": [
      "Risk 1: specific clause number, exact mechanism, exact numbers e.g. Clause 7 — Franchisor can terminate immediately if payment is 3 days late, with no cure period",
      "Risk 2: specific clause number, exact mechanism, exact numbers",
      "Risk 3: specific clause number, exact mechanism, exact numbers"
    ]
  }
}
 
Do not include any text outside the JSON object.`;
 
// ============================================================
// CALL 2: Full clause-by-clause analysis — detailed, specific, complete
// ============================================================
const SYSTEM_PROMPT_CLAUSES = `You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements.
 
Your task: Write a detailed, specific analysis of EVERY numbered clause or section in the document.
Return a clauseAnalysis array with one entry per clause. Do not merge or skip any clause.
 
PRECISION RULES — NON-NEGOTIABLE:
- whatItSays must be 3-5 sentences containing ALL specific numbers, amounts, percentages, timeframes, distances, multipliers, and triggers from that clause
- Do NOT generalize: write "3x the discrepancy amount plus all audit costs" not "a penalty"
- Do NOT generalize: write "termination within 3 days of missed payment, no cure period" not "termination for non-payment"  
- Do NOT generalize: write "Franchisor can open outlets within 500 metres including under different brand names or delivery-only formats" not "nearby outlets"
- Do NOT generalize: write "3 customer complaints in any 30-day period as determined solely by the Franchisor" not "customer complaints"
- Do NOT generalize: write "5km non-compete radius for 3 years post-termination" not "non-compete clause"
- Do NOT generalize: write "supplier prices can be revised by Franchisor at any time without notice" not "supplier price controls"
- Do NOT generalize: write "Franchisee indemnifies Franchisor even for claims arising from Franchisor's own guidelines, products, or instructions" not "indemnity obligations"
- Do NOT generalize: write "all IP including innovations and improvements developed BY the Franchisee during the term vest irrevocably in the Franchisor" not "IP vests in Franchisor"
- Do NOT generalize: write "renewal fee of INR 5,00,000 plus execution of a new agreement on terms current at that time which may differ materially" not "renewal requires payment"
- whyItMatters must be 1-2 sentences stating the specific commercial or legal risk with numbers where relevant
- negotiationSuggestion must be a specific ask e.g. "Reduce penalty from 3x to 1x discrepancy; add right to dispute audit findings" not just "negotiate the clause"
- isFavorableToStrongerParty must be boolean true or false
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "clauseAnalysis": [
    {
      "clauseId": "Clause 1",
      "clauseTitle": "Short name max 5 words",
      "category": "one of: Financial, Legal Rights, Intellectual Property, Termination, Dispute Resolution, Obligations, Exclusivity, Ownership & Transfer, Governance, Confidentiality, Force Majeure, Indemnity, General",
      "whatItSays": "3-5 sentences. Plain English with ALL specific numbers, amounts, percentages, timeframes, distances, multipliers, and triggers from this clause. State consequences clearly.",
      "whyItMatters": "1-2 sentences. The specific commercial or legal risk with numbers where relevant.",
      "riskLevel": "low | medium | high | critical",
      "riskBearing": "franchisee | franchisor | both | borrower | lender | employee | employer",
      "isFavorableToStrongerParty": true,
      "keyQuestionsToAsk": ["One specific question referencing the exact clause mechanism and numbers"],
      "negotiationSuggestion": "Specific alternative terms to propose — not generic advice"
    }
  ],
  "termCount": 11,
  "criticalFlagCount": 3
}
 
Do not include any text outside the JSON object.`;
 
const toRiskLevel = (r: string): 'low' | 'medium' | 'high' => {
  if (r === 'high' || r === 'critical') return 'high';
  if (r === 'medium') return 'medium';
  return 'low';
};
 
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
 
    const [summaryResult, clausesResult] = await Promise.all([
      groq.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
          { role: 'user', content: userContent },
        ],
      }),
      groq.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_CLAUSES },
          { role: 'user', content: userContent },
        ],
      }),
    ]);
 
    const summaryContent = summaryResult.choices[0]?.message?.content;
    const clausesContent = clausesResult.choices[0]?.message?.content;
 
    console.log('Summary:', summaryContent?.length, 'chars | finish:', summaryResult.choices[0]?.finish_reason);
    console.log('Clauses:', clausesContent?.length, 'chars | finish:', clausesResult.choices[0]?.finish_reason);
 
    if (!summaryContent || !clausesContent) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Failed to analyze document' },
        { status: 500 }
      );
    }
 
    const rawSummary = JSON.parse(summaryContent.replace(/```json\n?|\n?```/g, '').trim());
    const rawClauses = JSON.parse(clausesContent.replace(/```json\n?|\n?```/g, '').trim());
 
    const data = mapToAnalysisResult(rawSummary, rawClauses);
    console.log('Final terms count:', data.termCount);
 
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
