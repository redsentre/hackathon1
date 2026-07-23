import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPDF } from '@/lib/pdfParser';
import { jsonrepair } from 'jsonrepair';
import { MAX_TEXT_LENGTH, MAX_PDF_SIZE_MB } from '@/lib/constants';
import type { AnalyzeRequest, AnalyzeResponse, AnalysisResult, JargonTerm } from '@/types';

const MODEL = process.env.NVIDIA_MODEL ?? 'gpt-oss-120b';

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

PRECISION RULES — NON-NEGOTIABLE

NUMBERS: Always state exact rupee/currency amounts, percentages, timeframes, distances,
multipliers, and penalties exactly as written. Never approximate.

FINANCIAL SNAPSHOT:
- Capture EVERY financial obligation — upfront fees, recurring fees, setup costs,
  penalties, renewal fees, hidden costs
- For employment contracts: separate fixed vs variable pay and state the guaranteed
  monthly take-home amount explicitly as (fixed component divided by 12)
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
- Any clause where cause, performance, or material adverse change is defined
  solely by the stronger party
- Any IP clause covering work done OUTSIDE working hours or WITHOUT company resources
- Any IP clause that does NOT explicitly exclude pre-employment work
- Any ESOP clause — always state: (a) vesting cliff, (b) forfeiture before cliff,
  (c) exact post-termination exercise window, (d) what happens if window lapses
- Any probation period that can be extended unilaterally — state maximum possible duration
- Any non-compete — always calculate: monthly compensation x duration = total paid,
  express as percentage of annual salary, flag if under 25% as inadequate
- Any arbitration clause where the arbitrator is appointed by the stronger party
- Any clause waiving access to courts, labour tribunals, consumer forums, or the
  Banking Ombudsman
- Any termination or acceleration clause with no cure period or less than 7 days
- Any confidentiality clause with no end date
- [LOAN DOCUMENTS] Any clause where interest is calculated on a higher amount than
  the net disbursed amount
- [LOAN DOCUMENTS] Any insurance or add-on product described as optional in one
  clause but added by default in another
- [LOAN DOCUMENTS] Any unilateral amendment clause
- [LOAN DOCUMENTS] Any cross-default clause

Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.
When writing string values, never use double quotes inside the string. Use single quotes instead.

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
  "executiveSummary": "4-5 sentences for a busy professional.",
  "financialSnapshot": {
    "totalCommitmentSummary": "Total financial exposure with exact numbers",
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
    "intellectualProperty": "Who owns what IP",
    "obligations": "Key ongoing obligations of each party",
    "termination": "Every exact trigger for termination or acceleration",
    "disputeResolution": "How disputes are resolved",
    "exitAndTransfer": "Post-termination obligations"
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
    "applicableLaws": ["Applicable laws"],
    "complianceRequirements": ["Specific compliance obligations"],
    "potentiallyProblematicClauses": ["Problematic clauses"]
  },
  "overallAssessment": {
    "fairnessScore": 50,
    "fairnessLabel": "one of: Heavily One-Sided, Significantly Skewed, Moderate Imbalance, Reasonably Balanced, Well-Balanced",
    "powerBalance": "Which party has more protection and exactly which clauses create the imbalance",
    "recommendation": "one of: Proceed with Caution | Seek Legal Advice Before Signing | Negotiate Key Clauses | Acceptable with Minor Modifications | Do Not Sign Without Major Changes",
    "recommendationReason": "2-3 specific sentences referencing actual clause numbers and mechanisms",
    "topThreeRisks": [
      "Clause X — exact mechanism — exact numbers/thresholds — worst outcome: concrete consequence",
      "Clause X — exact mechanism — exact numbers/thresholds — worst outcome: concrete consequence",
      "Clause X — exact mechanism — exact numbers/thresholds — worst outcome: concrete consequence"
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

PRECISION RULES — NON-NEGOTIABLE

WHAT IT SAYS (3-5 sentences required):
Must contain ALL specific numbers, amounts, percentages, timeframes, distances,
multipliers, and triggers from that clause. State consequences clearly.
Never generalize — use the exact language and numbers from the document.

LANGUAGE PRECISION — NON-NEGOTIABLE:
Never use may or could when the clause uses shall or states something unconditionally.
The Company owns — not the Company may own.
The obligation is perpetual — not the obligation may be perpetual.
The entire loan becomes immediately due — not the loan may become due.

When writing string values in JSON, never use double quotes inside the string.
Use single quotes instead. For example: write 'Premium' not "Premium".

isFavorableToStrongerParty must be boolean true or false — not a string.

Always respond with valid JSON matching this EXACT structure.
Do not include any text outside the JSON object.

{
  "clauseAnalysis": [
    {
      "clauseId": "Clause 1",
      "clauseTitle": "Short name max 5 words",
      "category": "one of: Financial, Legal Rights, Intellectual Property, Termination, Dispute Resolution, Obligations, Exclusivity, Ownership & Transfer, Governance, Confidentiality, Force Majeure, Indemnity, General",
      "whatItSays": "3-5 sentences. Plain English with ALL specific numbers, amounts, percentages, timeframes. Use single quotes for any quoted terms.",
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
const safeParseJSON = (raw: string): any => {
  // Step 1: normalize unicode punctuation and strip code fences
  let cleaned = raw
    .replace(/```json\n?|\n?```/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  // Step 2: pre-process — escape any unescaped double quotes that appear
  // inside JSON string values. This catches the model writing "Premium"
  // inside a string value, which breaks every parser downstream.
  // Strategy: walk character by character tracking whether we are inside
  // a JSON string, and escape any " that is not already escaped and is
  // not the opening or closing delimiter of the string.
  const chars = cleaned.split('');
  let inString = false;
  let escaped = false;
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (escaped) {
      result.push(ch);
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      result.push(ch);
      escaped = true;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        // Opening delimiter — enter string mode
        inString = true;
        result.push(ch);
      } else {
        // Could be closing delimiter or an unescaped inner quote.
        // Look ahead: after this quote, skip whitespace and check if
        // next non-whitespace char is a JSON structural character
        // (: , } ]) — if so, this is a closing delimiter.
        let j = i + 1;
        while (j < chars.length && /\s/.test(chars[j])) j++;
        const next = chars[j];
        if (next === ':' || next === ',' || next === '}' || next === ']') {
          // Closing delimiter
          inString = false;
          result.push(ch);
        } else {
          // Unescaped inner quote — escape it
          result.push('\\');
          result.push(ch);
        }
      }
      continue;
    }

    result.push(ch);
  }

  cleaned = result.join('');

  // Step 3: attempt clean parse
  try {
    return JSON.parse(cleaned);
  } catch (e1: any) {
    console.log('Initial parse failed:', e1.message);

    // Step 4: jsonrepair on the pre-processed string
    try {
      const repaired = jsonrepair(cleaned);
      console.log('jsonrepair succeeded');
      return JSON.parse(repaired);
    } catch (e2: any) {
      console.log('jsonrepair also failed:', e2.message);
    }
  }

  // Step 5: lastIndexOf fallback + jsonrepair on original cleaned
  try {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      const truncated = cleaned.substring(0, lastBrace + 1);
      const result = JSON.parse(jsonrepair(truncated));
      console.warn('JSON recovery: used lastIndexOf + jsonrepair fallback');
      return result;
    }
  } catch {
    // fall through
  }

  // All attempts failed — log context around the error position for debugging
  console.error('JSON parse failed after all recovery attempts');
  console.error('Failed content length:', cleaned.length);
  try {
    JSON.parse(cleaned);
  } catch (e: any) {
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      console.error(`Parse error at position ${pos}:`, JSON.stringify(cleaned.substring(pos - 100, pos + 100)));
    } else {
      console.error('Parse error message:', e.message);
    }
  }
  throw new Error('Could not parse model response as JSON');
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

console.log('MODEL ENV:', process.env.NVIDIA_MODEL, 'BASE URL:', process.env.NVIDIA_API_BASE_URL);

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
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_SUMMARY },
          { role: 'user', content: userContent },
        ],
      }),
      client.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_CLAUSES },
          { role: 'user', content: userContent },
        ],
      }),
    ]);

    const summaryContent = summaryResult.choices[0]?.message?.content;
    const clausesContent = clausesResult.choices[0]?.message?.content;

    console.log('Raw summary (first 1000):', summaryContent?.substring(0, 1000));
    console.log('Raw summary (last 500):', summaryContent?.substring((summaryContent?.length ?? 0) - 500));
    console.log('Raw clauses (first 500):', clausesContent?.substring(0, 500));
    console.log('Summary:', summaryContent?.length, 'chars | finish:', summaryResult.choices[0]?.finish_reason);
    console.log('Clauses:', clausesContent?.length, 'chars | finish:', clausesResult.choices[0]?.finish_reason);

    if (!summaryContent || !clausesContent) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Failed to analyze document' },
        { status: 500 }
      );
    }

    const rawSummary = safeParseJSON(summaryContent);
    const rawClauses = safeParseJSON(clausesContent);

    const data = mapToAnalysisResult(rawSummary, rawClauses);
    console.log('clauseAnalysis array length:', rawClauses.clauseAnalysis?.length);
    console.log('mapped terms length:', data.termCount);
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
