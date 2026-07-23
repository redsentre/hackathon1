import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPDF } from '@/lib/pdfParser';
import { MAX_TEXT_LENGTH, MAX_PDF_SIZE_MB } from '@/lib/constants';
import type { AnalyzeRequest, AnalyzeResponse, AnalysisResult, JargonTerm } from '@/types';

const MODEL = process.env.NVIDIA_MODEL ?? 'llama-3.3-70b';

// ============================================================
// CALL 1: Document profile, summary, financial snapshot, assessment
// ============================================================
const SYSTEM_PROMPT_SUMMARY = `Do not include reasoning steps, internal deliberation, or <think> tags in your response. Respond directly with your answer only.
You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements. You combine the precision of
a senior corporate lawyer, the clarity of a financial advisor, and the accessibility of
a trusted friend who explains complex documents in plain language.

You must analyze the ENTIRE document including all Exhibits, Schedules, and Annexures
without exception. Do not stop or summarize early. Cover every financial term in every
Exhibit.

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
  monthly take-home amount explicitly as (fixed component ÷ 12)
- For franchise/commercial agreements: state total day-one exposure (all costs needed
  before operations begin), not just the headline fee
- For loan agreements: state (a) the net amount actually received by the Borrower,
  (b) the principal on which interest is calculated, (c) total repayment amount,
  and (d) real cost of borrowing = total repayment minus net amount received
- hiddenOrAdditionalCosts must list every cost not in the headline number

TOP THREE RISKS — each must contain:
- The exact clause number
- The exact mechanism (what triggers it)
- The exact numbers or timeframes involved
- The worst realistic outcome for the weaker party in one concrete sentence

CRITICAL FLAGS — for every document, always check and flag if present:
- Any clause where "cause", "performance", or "material adverse change" is defined
  solely by the stronger party — this is a blank cheque for acceleration,
  termination, or penalty without any objective threshold
- Any IP clause covering work done OUTSIDE working hours or WITHOUT company resources
- Any IP clause that does NOT explicitly exclude pre-employment work
- Any ESOP clause — always state: (a) vesting cliff, (b) forfeiture before cliff,
  (c) exact post-termination exercise window, (d) what happens if window lapses
- Any probation period that can be extended unilaterally — state maximum possible duration
- Any non-compete — always calculate: monthly compensation × duration = total paid,
  express as percentage of annual salary, flag if under 25% as inadequate
- Any arbitration clause where the arbitrator is appointed by the stronger party
- Any clause waiving access to courts, labour tribunals, consumer forums, or the
  Banking Ombudsman — Banking Ombudsman waiver is likely unenforceable under RBI
  guidelines as it is a statutory right that cannot be contracted away
- Any termination or acceleration clause with no cure period or less than 7 days
- Any confidentiality clause with no end date
- [LOAN DOCUMENTS] Any clause where interest is calculated on a higher amount than
  the net disbursed amount — state the exact gap and flag it explicitly
- [LOAN DOCUMENTS] Any insurance or add-on product described as optional in one
  clause but added by default in another — flag the contradiction by both clause
  numbers and state the opt-out window and total cost if not opted out
- [LOAN DOCUMENTS] Any unilateral amendment clause — flag that the Lender can
  change the interest rate with only 30 days notice and the Borrower's only
  recourse is to prepay with a penalty
- [LOAN DOCUMENTS] Any cross-default clause — flag that default on any product
  with any group company triggers default and acceleration on this loan

Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.

{
  "documentProfile": {
    "documentType": "Precise document type",
    "parties": [
      {
        "name": "Party name as in document",
        "role": "Their role e.g. Lender, Borrower, Employer, Employee",
        "powerPosition": "stronger | weaker | equal"
      }
    ],
    "coreTransaction": "One precise sentence: what is fundamentally being exchanged",
    "termDuration": "Exact duration including any extension or renewal rights",
    "governingLaw": "Exact jurisdiction and governing law",
    "effectiveDate": "Date or To be determined"
  },
  "executiveSummary": "4-5 sentences for a busy professional. State: (1) document type and parties, (2) exact key financial terms with numbers, (3) the top 2-3 specific risks with clause numbers and exact mechanisms, (4) which party holds more power and why. No jargon. Be specific with every number.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial exposure with exact numbers — for loans: net received vs interest principal vs total repayment and real borrowing cost; for employment: guaranteed monthly take-home (fixed ÷ 12); for franchise: total day-one exposure",
    "immediatePaymentOnSigning": "Exact amount due immediately on signing or null",
    "keyPaymentMilestones": [
      {
        "period": "e.g. On signing / Monthly / On renewal",
        "amount": "Exact amount",
        "description": "What this payment covers",
        "dueDate": "Exact due date or trigger",
        "consequences": "Exact consequence of non-payment"
      }
    ],
    "revenueShareStructure": "Exact revenue share percentages or null if not applicable",
    "hiddenOrAdditionalCosts": [
      "Every cost not in the headline number with exact amounts"
    ],
    "taxImplications": "GST and tax obligations — who bears them"
  },
  "criticalFlags": [
    {
      "flag": "Short title of the critical issue",
      "severity": "high | critical",
      "location": "Exact clause number",
      "explanation": "Specific plain English explanation with exact numbers and worst-case outcome",
      "questionsToRaise": "Specific question to raise before signing"
    }
  ],
  "sectionSummaries": {
    "parties": "Who the parties are, their roles, and the power dynamic",
    "financialTerms": "Complete summary of all money with exact figures",
    "intellectualProperty": "Who owns what IP — state if work outside working hours vests in stronger party; state whether pre-employment work is excluded",
    "obligations": "Key ongoing obligations of each party",
    "termination": "Every exact trigger for termination or acceleration — list each with threshold, timeframe, and whether defined subjectively",
    "disputeResolution": "How disputes are resolved, who appoints arbitrators, whether courts/tribunals/Banking Ombudsman are waived",
    "exitAndTransfer": "Post-termination obligations — non-compete, ESOP window, assignment rights, prepayment penalties"
  },
  "negotiationPriorityList": [
    {
      "priority": 1,
      "clause": "Exact clause reference",
      "issue": "Specific issue with exact number or mechanism",
      "suggestedPosition": "Specific alternative terms with numbers"
    }
  ],
  "regulatoryContext": {
    "applicableLaws": ["For employment: Industrial Disputes Act; for loans/NBFCs: RBI Fair Practices Code, Banking Ombudsman Scheme 2006; for franchise: Consumer Protection Act"],
    "complianceRequirements": ["Specific compliance obligations"],
    "potentiallyProblematicClauses": ["Banking Ombudsman waiver likely unenforceable under RBI guidelines; labour tribunal waiver may be unenforceable under Industrial Disputes Act; non-compete enforceability under Section 27 of the Indian Contract Act"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Which party has more protection and exactly which clauses create the imbalance",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 specific sentences referencing actual clause numbers and mechanisms",
    "topThreeRisks": [
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence]",
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence]",
      "Clause X — [exact mechanism] — [exact numbers/thresholds] — worst outcome: [concrete consequence]"
    ]
  }
}

Do not include any text outside the JSON object.`;

// ============================================================
// CALL 2: Full clause-by-clause analysis — detailed, specific, complete
// ============================================================
const SYSTEM_PROMPT_CLAUSES = `Do not include reasoning steps, internal deliberation, or <think> tags in your response. Respond directly with your answer only.
You are ArthSaathi, a world-class document intelligence assistant
specializing in financial, legal, and commercial agreements.

Your task: Write a detailed, specific analysis of EVERY numbered clause or section in the document.
Return a clauseAnalysis array with one entry per clause. Do not merge or skip any clause.
You must cover EVERY clause and EVERY Exhibit without exception.
Do not stop until you have reached the final clause and final Exhibit in the document.

═══════════════════════════════════════
PRECISION RULES — NON-NEGOTIABLE
═══════════════════════════════════════

WHAT IT SAYS (3-5 sentences required):
Must contain ALL specific numbers, amounts, percentages, timeframes, distances,
multipliers, and triggers from that clause. State consequences clearly.
Never generalize — use the exact language and numbers from the document.

LANGUAGE PRECISION — NON-NEGOTIABLE:
Never use "may" or "could" when the clause uses "shall" or states something
unconditionally. If the clause is unambiguous, state what IT IS.
"The Company owns" not "the Company may own."
"The obligation is perpetual" not "the obligation may be perpetual."
"The entire loan becomes immediately due" not "the loan may become due."

SPECIFIC PATTERNS TO ALWAYS CATCH:

For COMPENSATION clauses:
- State fixed vs variable split with exact amounts
- Calculate guaranteed monthly take-home: fixed component ÷ 12 = INR X
- State who determines variable pay and on what basis
- Flag CTC restructuring rights and state the guaranteed floor
- Be explicit: "Your guaranteed monthly take-home is INR X, not INR Y (total CTC ÷ 12)"

For PROBATION clauses:
- State initial period AND maximum extension period
- State total maximum probation duration
- State notice period during probation with exact hours/days
- Flag: "The Employee has almost no job security for up to [maximum duration]"

For ESOP / STOCK OPTION clauses — ALL FOUR points MANDATORY:
- (1) Vesting schedule with exact cliff and post-cliff monthly vesting
- (2) Forfeiture on termination before cliff: "All [X] options are forfeited"
- (3) Post-termination exercise window: "Vested options MUST be exercised within
  [X] days — after that they lapse permanently and cannot be recovered"
- (4) Company's right to modify ESOP scheme

For IP / INTELLECTUAL PROPERTY clauses:
- If covers work outside working hours: "This clause covers work done outside
  working hours and on personal devices — any app, tool, or side project
  developed during employment belongs to the Company, even if built at home"
- State pre/post-joining distinction: "Work created BEFORE joining is not
  covered. Any improvement added AFTER joining belongs to the Company."
- Never say "may claim" — use "the Company owns" or "vests exclusively in the Company"
- State irrevocable assignment and moral rights waiver if present

For NON-COMPETE clauses — calculation MANDATORY:
- State exact duration and scope
- Calculate: "[amount] × [months] = INR [total] = [X]% of INR [annual] annual salary"
- Flag if under 25% of annual salary as grossly inadequate
- Note enforceability under Section 27 of the Indian Contract Act

For TERMINATION clauses (employment) and DEFAULT/ACCELERATION clauses (loans):
- List every trigger with exact threshold
- Flag any trigger defined solely by the stronger party with no objective threshold:
  Employment: "'non-performance as determined by the Company' is a blank cheque
  to terminate without severance"
  Loans: "'material adverse change as determined by the Lender' allows the Lender
  to accelerate the entire outstanding loan at any time without objective trigger"
- State cure period (or absence) with exact duration
- State severance (employment) or full acceleration consequence (loans) with numbers

For LOAN DISBURSEMENT clauses:
- State headline amount, all fees deducted, and net amount actually received
- Flag: "Interest is calculated on INR [full amount] but the Borrower only receives
  INR [net amount] — the Borrower pays interest on INR [gap] they never received"
- State total repayment and real cost: "INR [total repayment] on INR [net received]
  = INR [difference] total cost over the loan tenure"

For INTEREST RATE clauses:
- State contracted rate, EAR, and penal rate — all three if present
- State penal rate in both monthly and annual terms
- Bottom line must name all three rates with numbers explicitly

For INSURANCE clauses in loan documents:
- If two clauses contradict each other, flag both clause numbers explicitly:
  "Clause [X] says optional. Clause [Y] has already added INR [amount] to your
  loan principal by default. You have [Z] days from disbursement to opt out in
  writing. If you do not, you pay INR [amount] plus interest at [rate]% for
  [tenure] — approximately INR [total] extra."

For AMENDMENT clauses in loan documents:
- Flag: "The Lender can raise the interest rate, fees, or charges with only
  30 days notice. The Borrower's only option is to prepay in full — subject
  to a [X]% prepayment penalty under Clause [Y]. There is no protection
  against rate increases for the entire loan tenure."

For CROSS-DEFAULT clauses:
- Flag: "A default on any credit card, loan, or product with [Lender] or any
  group company triggers default on this loan — the entire outstanding
  INR [amount] becomes immediately due"
- Flag the set-off right: "The Lender can debit any of your accounts with
  them or their group companies without prior notice to recover dues"

For COLLECTION AND RECOVERY clauses:
- Calculate collection fee in rupees: "[X]% of INR [outstanding] = INR [amount]"
- Flag: "The Borrower pays the cost of their own debt collection"
- Flag the right to contact employer and emergency contacts

For DISPUTE RESOLUTION clauses:
- State who appoints arbitrator — if stronger party: flag structural bias
- State every forum waived
- For loan/NBFC documents: "The Banking Ombudsman waiver is unenforceable —
  the Banking Ombudsman Scheme is established under RBI guidelines and a
  borrower cannot be made to waive this statutory right by contract"
- For employment: "Labour tribunal waiver may be unenforceable under the
  Industrial Disputes Act"

For CONFIDENTIALITY clauses:
- If perpetual: "This obligation has no end date — it is perpetual"
- Flag unlimited damages with no cap

For MOONLIGHTING clauses:
- State "paid or unpaid" scope covers volunteering and open-source
- State consequence: immediate termination without notice or severance

For SOCIAL MEDIA clauses:
- Flag that posting on LinkedIn that you work there without approval is a breach
- State consequence: treated as misconduct = immediate termination

For ASSIGNMENT clauses:
- Flag loan can be sold to debt collector without Borrower consent

WHY IT MATTERS (1-2 sentences):
Worst realistic outcome for the weaker party in concrete terms with numbers.
Never use "may" — state what IS the worst outcome.

NEGOTIATION SUGGESTION:
Specific alternative with numbers. Never "negotiate this clause" — say what to ask for.

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

// Robust JSON recovery — handles truncated responses from token limit hits
// Strategy: attempt full parse, then try to salvage a partial clauseAnalysis array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeParseJSON = (raw: string, isClauses = false): any => {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

  // Attempt 1: clean parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt 2: for clause responses, salvage complete clause objects from a truncated array
    if (isClauses) {
      try {
        // Find the start of the clauseAnalysis array
        const arrayStart = cleaned.indexOf('"clauseAnalysis"');
        if (arrayStart !== -1) {
          const bracketStart = cleaned.indexOf('[', arrayStart);
          if (bracketStart !== -1) {
            // Collect all complete clause objects — each ends with a closing }
            // We walk backwards from the truncation point to find the last complete object
            let depth = 0;
            let lastCompleteClose = -1;
            let inString = false;
            let escape = false;

            for (let i = bracketStart; i < cleaned.length; i++) {
              const ch = cleaned[i];
              if (escape) { escape = false; continue; }
              if (ch === '\\' && inString) { escape = true; continue; }
              if (ch === '"') { inString = !inString; continue; }
              if (inString) continue;
              if (ch === '{') depth++;
              if (ch === '}') {
                depth--;
                if (depth === 0) lastCompleteClose = i;
              }
            }

            if (lastCompleteClose !== -1) {
              // Reconstruct a valid JSON object with the salvaged clauses
              const salvaged = cleaned.substring(bracketStart, lastCompleteClose + 1);
              const recovered = `{"clauseAnalysis":${salvaged}],"termCount":0,"criticalFlagCount":0}`;
              const result = JSON.parse(recovered);
              console.warn(`JSON truncation recovery: salvaged ${result.clauseAnalysis?.length ?? 0} clauses`);
              return result;
            }
          }
        }
      } catch {
        // fall through to attempt 3
      }
    }

    // Attempt 3: find last complete top-level closing brace
    try {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        const truncated = cleaned.substring(0, lastBrace + 1);
        const result = JSON.parse(truncated);
        console.warn('JSON truncation recovery: used lastIndexOf fallback');
        return result;
      }
    } catch {
      // fall through
    }

    // All attempts failed
    console.error('JSON parse failed after all recovery attempts');
    throw new Error('Could not parse model response as JSON');
  }
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

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.NVIDIA_API_BASE_URL,
    });

    const userContent = `Output language: ${language === 'hi' ? 'Hindi' : 'English'}\n\nDocument to analyze:\n${text}`;

    console.log('Calling Cerebras API (2 parallel calls) with text length:', text.length);

    const [summaryResult, clausesResult] = await Promise.all([
      client.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 6000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
          { role: 'user', content: userContent },
        ],
      }),
      client.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 8192,
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

    const rawSummary = safeParseJSON(summaryContent, false);
    const rawClauses = safeParseJSON(clausesContent, true);

    const data = mapToAnalysisResult(rawSummary, rawClauses);
    console.log('Final terms count:', data.termCount);

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json<AnalyzeResponse>(
      { success: false, error: 'An error occurred while analyzing the document' },
      { status: 500 }
    );
  }
}
