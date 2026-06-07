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
- The financialSnapshot must capture EVERY financial obligation — upfront fees, recurring fees, setup costs, penalties, renewal fees
- hiddenOrAdditionalCosts must list ALL costs not immediately obvious from the headline fee
- topThreeRisks must be specific — name the exact clause mechanism, not a generic category
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "documentProfile": {
    "documentType": "Precise document type e.g. Franchise Agreement, Personal Loan Agreement",
    "parties": [
      {
        "name": "Party name as in document",
        "role": "Their role e.g. Franchisor, Franchisee, Lender",
        "powerPosition": "stronger | weaker | equal"
      }
    ],
    "coreTransaction": "One precise sentence: what is fundamentally being exchanged",
    "termDuration": "Exact duration e.g. 5 years initial term, renewable for 5 more years",
    "governingLaw": "Exact jurisdiction and governing law",
    "effectiveDate": "Date or To be determined"
  },
  "executiveSummary": "4-5 sentences for a busy professional. State the document type, exact key financial terms with numbers, the top 2-3 specific risks with clause references, and which party holds more power. No jargon. Be specific.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial exposure over full term with exact numbers — include ALL fees, setup costs, royalties, levies, renewal fees",
    "immediatePaymentOnSigning": "Exact amount due immediately on signing or null",
    "keyPaymentMilestones": [
      {
        "period": "e.g. On signing / Year 1 / Monthly",
        "amount": "Exact amount",
        "description": "What this payment covers",
        "dueDate": "Exact due date or trigger",
        "consequences": "Exact consequence of non-payment e.g. termination within 3 days"
      }
    ],
    "revenueShareStructure": "Exact revenue share percentages and how they are calculated",
    "hiddenOrAdditionalCosts": [
      "Setup/fit-out costs: exact range if stated",
      "Any other cost not included in the headline fee"
    ],
    "taxImplications": "GST and tax obligations — who bears them"
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
    "parties": "Who the parties are and the power dynamic between them",
    "financialTerms": "Complete summary of all money with exact figures",
    "intellectualProperty": "Who owns what IP, what licenses are granted, what happens to IP and innovations on termination",
    "obligations": "Key ongoing obligations of each party with specifics",
    "termination": "Exact conditions for termination — list every trigger with specifics",
    "disputeResolution": "Exactly how disputes are resolved, who appoints arbitrators, where",
    "exitAndTransfer": "Exact post-termination obligations including non-compete scope and duration"
  },
  "negotiationPriorityList": [
    {
      "priority": 1,
      "clause": "Exact clause reference",
      "issue": "Specific issue to negotiate",
      "suggestedPosition": "Specific ask"
    }
  ],
  "regulatoryContext": {
    "applicableLaws": ["Specific laws referenced or applicable"],
    "complianceRequirements": ["Specific compliance obligations"],
    "potentiallyProblematicClauses": ["Clauses that may conflict with applicable law"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Specific assessment of which party has more protection and why",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 specific sentences referencing actual clauses",
    "topThreeRisks": [
      "Risk 1: specific clause mechanism with exact numbers",
      "Risk 2: specific clause mechanism with exact numbers",
      "Risk 3: specific clause mechanism with exact numbers"
    ]
  }
}
 
Do not include any text outside the JSON object.`;
 
// ============================================================
// CALL 2: Clause-by-clause coverage — every clause, no skipping
// ============================================================
const SYSTEM_PROMPT_CLAUSES = `You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements.
 
Your task: Analyze EVERY numbered clause or section in the document and return a clauseAnalysis array.
You must produce one entry per clause — do not merge, skip, or summarize multiple clauses into one.
 
PRECISION RULES — NON-NEGOTIABLE:
- State EXACT numbers, amounts, percentages, timeframes, distances, and multipliers as they appear in the document
- Do NOT generalize: say "3x the discrepancy amount plus all audit costs" not "a penalty"
- Do NOT generalize: say "termination within 3 days of missed payment" not "termination for non-payment"
- Do NOT generalize: say "500 metres" not "nearby"
- Do NOT generalize: say "3 customer complaints in any 30-day period" not "customer complaints"
- Do NOT generalize: say "5km non-compete for 3 years post-termination" not "non-compete"
- The whatItSays field must contain ALL the specific numbers and triggers from that clause
- isFavorableToStrongerParty must be a boolean true or false
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "clauseAnalysis": [
    {
      "clauseId": "Clause 1",
      "clauseTitle": "Short name max 5 words",
      "category": "one of: Financial, Legal Rights, Intellectual Property, Termination, Dispute Resolution, Obligations, Exclusivity, Ownership & Transfer, Governance, Confidentiality, Force Majeure, Indemnity, General",
      "whatItSays": "3-4 sentences. Plain English with ALL specific numbers, amounts, percentages, timeframes, distances, multipliers, and triggers from this clause. State the consequence clearly.",
      "whyItMatters": "1-2 sentences. The specific commercial or legal risk — with numbers where relevant.",
      "riskLevel": "low | medium | high | critical",
      "riskBearing": "franchisee | franchisor | both | borrower | lender | employee | employer",
      "isFavorableToStrongerParty": true,
      "keyQuestionsToAsk": ["One specific question referencing the exact clause mechanism"],
      "negotiationSuggestion": "Specific ask — e.g. reduce penalty from 3x to 1x, add 30-day cure period before termination"
    }
  ],
  "termCount": 11,
  "criticalFlagCount": 3
}
 
Do not include any text outside the JSON object.`;
 
// ============================================================
// CALL 3: Deep detail enrichment — fills in anything Call 2 missed
// ============================================================
const SYSTEM_PROMPT_DETAIL = `You are ArthSaathi, a meticulous legal and financial document analyst.
 
Your task: You will be given a document. For each numbered clause, extract a "detailEnrichment" object containing ONLY the specific numbers, triggers, penalties, timeframes, distances, and multipliers that appear in that clause. This is a precision extraction task — your job is to make sure nothing specific is missed.
 
RULES:
- Extract every specific number, amount, percentage, timeframe, distance, and multiplier
- If a clause has no specific numbers, return an empty specificDetails array
- Do not paraphrase or explain — just extract the specific facts
- Cover every clause in the document
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "detailEnrichment": [
    {
      "clauseId": "Clause 1",
      "specificDetails": [
        "INR 15,00,000 non-refundable franchise fee payable on signing",
        "8% monthly royalty on gross revenue, due within 7 days of month end",
        "2% marketing levy on gross revenue",
        "Franchisee bears all fit-out costs estimated INR 25,00,000 to INR 40,00,000"
      ],
      "keyTriggers": [
        "Payment default triggers termination within 3 days",
        "No refund under any circumstances"
      ]
    }
  ]
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
 
// Merges Call 3 detail enrichment into Call 2 clause entries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enrichClauses = (clauses: any[], enrichments: any[]): any[] => {
  return clauses.map((clause) => {
    const enrichment = enrichments.find(
      (e) => e.clauseId?.toLowerCase() === clause.clauseId?.toLowerCase()
    );
    if (!enrichment) return clause;
 
    const details = [
      ...(enrichment.specificDetails ?? []),
      ...(enrichment.keyTriggers ?? []),
    ].join(' | ');
 
    if (!details) return clause;
 
    // Append detail to whatItSays if it adds new info
    const existingText: string = clause.whatItSays ?? '';
    const newDetails = details
      .split(' | ')
      .filter((d: string) => !existingText.toLowerCase().includes(d.toLowerCase().slice(0, 20)))
      .join(' ');
 
    return {
      ...clause,
      whatItSays: newDetails
        ? `${existingText} ${newDetails}`.trim()
        : existingText,
    };
  });
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
 
    console.log('Calling Groq API (3 parallel calls) with text length:', text.length);
 
    // Run all 3 calls in parallel
    const [summaryResult, clausesResult, detailResult] = await Promise.all([
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
        max_tokens: 6000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_CLAUSES },
          { role: 'user', content: userContent },
        ],
      }),
      groq.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_DETAIL },
          { role: 'user', content: `Extract all specific numbers, amounts, percentages, timeframes, distances, multipliers, and triggers from every clause in this document:\n\n${text}` },
        ],
      }),
    ]);
 
    const summaryContent = summaryResult.choices[0]?.message?.content;
    const clausesContent = clausesResult.choices[0]?.message?.content;
    const detailContent = detailResult.choices[0]?.message?.content;
 
    console.log('Summary:', summaryContent?.length, 'chars | finish:', summaryResult.choices[0]?.finish_reason);
    console.log('Clauses:', clausesContent?.length, 'chars | finish:', clausesResult.choices[0]?.finish_reason);
    console.log('Detail:', detailContent?.length, 'chars | finish:', detailResult.choices[0]?.finish_reason);
 
    if (!summaryContent || !clausesContent) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Failed to analyze document' },
        { status: 500 }
      );
    }
 
    const rawSummary = JSON.parse(summaryContent.replace(/```json\n?|\n?```/g, '').trim());
    const rawClauses = JSON.parse(clausesContent.replace(/```json\n?|\n?```/g, '').trim());
 
    // Merge detail enrichment into clauses if Call 3 succeeded
    if (detailContent) {
      try {
        const rawDetail = JSON.parse(detailContent.replace(/```json\n?|\n?```/g, '').trim());
        if (rawDetail.detailEnrichment && Array.isArray(rawDetail.detailEnrichment)) {
          rawClauses.clauseAnalysis = enrichClauses(
            rawClauses.clauseAnalysis ?? [],
            rawDetail.detailEnrichment
          );
          console.log('Detail enrichment applied successfully');
        }
      } catch (detailErr) {
        // Call 3 failing is non-fatal — we still return the 2-call result
        console.warn('Detail enrichment parse failed (non-fatal):', detailErr);
      }
    }
 
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
