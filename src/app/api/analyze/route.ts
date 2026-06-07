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
 
═══════════════════════════════════════
PRECISION RULES — NON-NEGOTIABLE
═══════════════════════════════════════
 
NUMBERS: Always state exact rupee/currency amounts, percentages, timeframes, distances,
multipliers, and penalties exactly as written. Never approximate.
 
FINANCIAL SNAPSHOT:
- Capture EVERY financial obligation — upfront fees, recurring fees, setup costs,
  penalties, renewal fees, hidden costs
- For employment contracts: separate fixed vs variable pay and state the guaranteed
  monthly take-home amount explicitly
- For franchise/commercial agreements: state total day-one exposure (all costs needed
  before operations begin), not just the headline fee
- hiddenOrAdditionalCosts must list every cost not in the headline number
 
TOP THREE RISKS — each must contain:
- The exact clause number
- The exact mechanism (what triggers it)
- The exact numbers or timeframes involved
- The worst realistic outcome for the weaker party in one concrete sentence
- Example: "Clause 7 — Franchisor can terminate immediately with no notice or cure
  period if payment is even 3 days late; the Franchisee loses their entire INR 40-55L
  investment with no recourse"
 
CRITICAL FLAGS — for every document, always check and flag if present:
- Any clause where "cause" or "performance" is defined solely by the stronger party
  (blank cheque for termination without severance)
- Any clause covering work done outside working hours or without company resources
  (means personal side projects belong to the company)
- Any IP clause where innovations made BY the weaker party vest in the stronger party
- Any probation period that can be extended unilaterally — state the maximum possible
  duration, not just the initial period
- Any non-compete where the compensation paid is less than 25% of the employee's
  annual salary — flag this as inadequate compensation
- Any arbitration clause where the arbitrator is appointed by the stronger party
- Any clause waiving access to courts, labour tribunals, or consumer forums
- Any termination clause with no cure period or less than 7 days cure period
- Any indemnity clause where the weaker party indemnifies the stronger party even
  for the stronger party's own actions, guidelines, or products
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "documentProfile": {
    "documentType": "Precise document type e.g. Franchise Agreement, Employment Agreement",
    "parties": [
      {
        "name": "Party name as in document",
        "role": "Their role e.g. Franchisor, Franchisee, Employer, Employee",
        "powerPosition": "stronger | weaker | equal"
      }
    ],
    "coreTransaction": "One precise sentence: what is fundamentally being exchanged",
    "termDuration": "Exact duration including any extension or renewal rights",
    "governingLaw": "Exact jurisdiction and governing law",
    "effectiveDate": "Date or To be determined"
  },
  "executiveSummary": "4-5 sentences for a busy professional. State: (1) document type and parties, (2) exact key financial terms with numbers, (3) the top 2-3 specific risks with clause numbers and exact mechanisms, (4) which party holds more power and why. No jargon. No vague language. Be specific with every number.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial exposure with exact numbers — for employment: state guaranteed annual CTC vs total CTC and guaranteed monthly take-home; for franchise: state total day-one exposure range before operations begin",
    "immediatePaymentOnSigning": "Exact amount due immediately on signing or null",
    "keyPaymentMilestones": [
      {
        "period": "e.g. On signing / Monthly / On renewal / During probation",
        "amount": "Exact amount",
        "description": "What this payment covers",
        "dueDate": "Exact due date or trigger",
        "consequences": "Exact consequence of non-payment or non-performance"
      }
    ],
    "revenueShareStructure": "Exact revenue share percentages and calculation method, or null if not applicable",
    "hiddenOrAdditionalCosts": [
      "Every cost not in the headline number — state exact amounts or ranges where available"
    ],
    "taxImplications": "GST and tax obligations — who bears them, whether stated or implied"
  },
  "criticalFlags": [
    {
      "flag": "Short title of the critical issue",
      "severity": "high | critical",
      "location": "Exact clause number",
      "explanation": "Specific plain English explanation with exact numbers and worst-case outcome for the weaker party",
      "questionsToRaise": "Specific question to raise before signing"
    }
  ],
  "sectionSummaries": {
    "parties": "Who the parties are, their roles, and the power dynamic",
    "financialTerms": "Complete summary of all money with exact figures — guaranteed vs discretionary",
    "intellectualProperty": "Who owns what IP — explicitly state if innovations or work done OUTSIDE working hours or WITHOUT company resources vest in the stronger party",
    "obligations": "Key ongoing obligations of each party with specifics — include moonlighting, social media, approval requirements",
    "termination": "Every exact trigger for termination — list each one with the exact threshold, timeframe, and whether cause is defined subjectively",
    "disputeResolution": "Exactly how disputes are resolved, who appoints arbitrators, seat of arbitration, whether courts or labour tribunals are waived",
    "exitAndTransfer": "Exact post-termination obligations — non-compete scope, distance or industry, duration, compensation paid for non-compete if any"
  },
  "negotiationPriorityList": [
    {
      "priority": 1,
      "clause": "Exact clause reference",
      "issue": "Specific issue — include the exact number or mechanism that is problematic",
      "suggestedPosition": "Specific alternative terms to propose with numbers e.g. reduce from 3x to 1x, add 30-day cure period, cap non-compete at 6 months"
    }
  ],
  "regulatoryContext": {
    "applicableLaws": ["Specific laws referenced or applicable — for employment include Industrial Disputes Act, for franchise include Consumer Protection Act"],
    "complianceRequirements": ["Specific compliance obligations"],
    "potentiallyProblematicClauses": ["Clauses that may conflict with applicable law — e.g. waiver of labour tribunal access may be unenforceable under Indian law"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Specific assessment of which party has more protection, exactly which clauses create the imbalance, and what leverage the weaker party has",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 specific sentences referencing actual clause numbers and exact mechanisms",
    "topThreeRisks": [
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence for weaker party]",
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence for weaker party]",
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence for weaker party]"
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
 
═══════════════════════════════════════
PRECISION RULES — NON-NEGOTIABLE
═══════════════════════════════════════
 
WHAT IT SAYS (3-5 sentences required):
Must contain ALL specific numbers, amounts, percentages, timeframes, distances,
multipliers, and triggers from that clause. State consequences clearly.
Never generalize — use the exact language and numbers from the document.
 
SPECIFIC PATTERNS TO ALWAYS CATCH:
 
For COMPENSATION clauses:
- State fixed vs variable split explicitly with exact amounts
- Calculate the guaranteed monthly take-home (fixed component ÷ 12)
- State who determines variable pay and on what basis
- Flag if the company can restructure CTC — state the floor
 
For PROBATION clauses:
- State the initial period AND the maximum possible extension period
- State the notice period during probation with exact hours/days
- State the notice period after confirmation
- Flag: during probation the employee has almost no job security
 
For IP / INTELLECTUAL PROPERTY clauses:
- If the clause covers work done OUTSIDE working hours: explicitly state this —
  "this clause means personal side projects, apps, or ideas developed on your
  own time and on your own devices during the employment period belong to the company"
- If innovations or improvements made BY the weaker party vest in the stronger party:
  state this explicitly with the irrevocable assignment language
- Flag the moral rights waiver if present
 
For NON-COMPETE clauses:
- State the exact duration, geographic or industry scope
- State the exact monthly compensation paid for the non-compete
- Calculate total compensation paid vs annual salary as a percentage
- Flag if compensation is less than 25% of annual salary as inadequate
- Example: "INR 10,000/month for 12 months = INR 1,20,000 total, which is 5% of
  the INR 24,00,000 annual CTC — this is grossly inadequate compensation for a
  12-month career restriction"
 
For TERMINATION clauses:
- List every single trigger with its exact threshold
- Flag if "cause" or "non-performance" is defined solely by the stronger party
  — this is effectively termination without cause while avoiding severance
- State whether there is a cure period and its exact duration
- State exact severance or lack thereof
 
For INDEMNITY clauses:
- Flag explicitly if the weaker party indemnifies the stronger party even for
  claims arising from the stronger party's own actions, guidelines, or products
- State "this means if a customer is harmed by [company's product/instructions],
  [weaker party] pays the legal costs and damages, not [stronger party]"
 
For DISPUTE RESOLUTION clauses:
- State who appoints the arbitrator — if the stronger party appoints,
  flag this as a structural bias
- State whether courts, labour tribunals, or consumer forums are waived
- For employment agreements: flag that waiving labour tribunal access may be
  unenforceable under Indian law (Industrial Disputes Act)
- State the seat of arbitration
 
For CONFIDENTIALITY clauses:
- State whether the obligation is time-limited or perpetual ("at any time thereafter"
  means perpetual — flag this explicitly)
- State the scope of what is covered
- Flag if breach entitles the stronger party to unlimited damages
 
For MOONLIGHTING / OUTSIDE ACTIVITY clauses:
- State that "paid or unpaid" means even volunteering or open-source contributions
  could be a breach
- State the consequence (immediate termination without notice or severance)
 
For SOCIAL MEDIA clauses:
- Flag that posting on LinkedIn that you work at the company without prior approval
  could technically be a breach
- State the consequence (treated as misconduct = immediate termination)
 
WHY IT MATTERS (1-2 sentences):
State the worst realistic outcome for the weaker party in concrete terms —
use numbers where relevant. Not abstract risk categories.
 
NEGOTIATION SUGGESTION:
Must be a specific alternative to propose with numbers.
Never say "negotiate this clause" — always say what to ask for.
Examples:
- "Add a 30-day cure period before termination can be triggered for payment default"
- "Exclude pre-employment IP and work done on personal devices outside working hours"
- "Increase non-compete compensation to at least 50% of monthly salary (INR 75,000/month)"
- "Change arbitrator appointment to a neutral institution e.g. DIAC or ICADR"
- "Cap confidentiality obligation to 3 years post-termination, not perpetual"
 
isFavorableToStrongerParty must be boolean true or false — not a string.
 
Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
 
{
  "clauseAnalysis": [
    {
      "clauseId": "Clause 1",
      "clauseTitle": "Short name max 5 words",
      "category": "one of: Financial, Legal Rights, Intellectual Property, Termination, Dispute Resolution, Obligations, Exclusivity, Ownership & Transfer, Governance, Confidentiality, Force Majeure, Indemnity, General",
      "whatItSays": "3-5 sentences. Plain English with ALL specific numbers, amounts, percentages, timeframes, distances, multipliers, and triggers. State consequences. Never generalize.",
      "whyItMatters": "1-2 sentences. Worst realistic outcome for the weaker party in concrete terms with numbers.",
      "riskLevel": "low | medium | high | critical",
      "riskBearing": "franchisee | franchisor | both | borrower | lender | employee | employer",
      "isFavorableToStrongerParty": true,
      "keyQuestionsToAsk": ["One specific question referencing the exact clause mechanism and numbers"],
      "negotiationSuggestion": "Specific alternative terms with numbers — not generic advice"
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
 