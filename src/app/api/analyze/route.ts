import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { extractTextFromPDF } from '@/lib/pdfParser';
import { MAX_TEXT_LENGTH, MAX_PDF_SIZE_MB } from '@/lib/constants';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types';

const SYSTEM_PROMPT = `You are ArthSaathi, an expert financial literacy assistant specializing in ALL types of Indian financial documents — including loan agreements, insurance policies, investment documents, credit card terms, mutual fund schemes, bank account terms, and any other financial or legal document.

Your mission is to provide a THOROUGH, DETAILED analysis by reading the ENTIRE document carefully and identifying ALL financial jargon, complex terms, hidden clauses, and important details SPECIFIC TO THIS DOCUMENT, then explaining them in EXTREMELY SIMPLE language.

CRITICAL INSTRUCTIONS:
1. READ THE ENTIRE DOCUMENT - Do not skim. Every sentence may contain important information.
2. IDENTIFY ALL JARGON - Every technical term, acronym, legal phrase, and financial concept must be explained.
3. BE THOROUGH - If a document has 20 important terms, identify all 20. Do not stop at 5-6.
4. ACCURATE DOCUMENT TYPE - Carefully determine the actual document type based on content, not assumptions.
5. BE EXTREMELY SIMPLE - Use language a 12-year-old can understand. Avoid all jargon, technical terms, and complex sentences.
6. USE ANALOGIES AND EXAMPLES - Compare financial concepts to everyday things.
7. BE DOCUMENT-SPECIFIC - Every analysis must be based on what THIS document actually says, not generic financial advice.

SIMPLICITY RULES:
- Never use words like "amortization", "collateral", "prepayment", "deductible" without explaining them first
- Use short sentences (under 15 words when possible)
- Compare to everyday situations (renting a house, buying groceries, sharing expenses)
- If you must use a technical term, immediately explain it in parentheses

Always respond with valid JSON matching this EXACT structure:
{
  "terms": [
    {
      "term": "exact term or phrase from text",
      "explanation": "extremely simple explanation in 2-3 sentences using everyday language. Explain what it means, why it matters, and how it affects the user. Use analogies like comparing to renting a house or sharing expenses.",
      "bottomLine": "the single most important financial impact for the user in the simplest possible terms. Be direct and specific. Examples: 'They can take your house if you miss 3 payments.' or 'This is a hidden fee that costs you extra money.' or 'This means they won't pay for everything if you get sick.'",
      "riskLevel": "low" | "medium" | "high",
      "isPredatory": boolean,
      "predatoryReason": "simple explanation of why this clause unfairly benefits the company or traps the consumer — null if not predatory",
      "category": "one of: Loan Terms, Interest, Penalty, Insurance, Legal, Investment, Coverage, Exclusions, Fees, General"
    }
  ],
  "summary": "simple 3-4 sentence summary explaining what this document is, what the user is agreeing to, and the most important things they need to know before signing. Use everyday language.",
  "overallRisk": "low" | "medium" | "high",
  "documentType": "accurate type of document based on content - e.g. Home Loan Agreement, Health Insurance Policy, Credit Card T&C, Mutual Fund Scheme, Fixed Deposit Terms, Car Insurance, Personal Loan, Investment Advisory, Term Insurance, ULIP, PPF, etc.",
  "keyWarnings": ["simple warning 1", "simple warning 2", "simple warning 3"],
  "termCount": number,
  "predatoryCount": number,
  "trustScore": number between 0 and 100 (100 = fully transparent, consumer-friendly; 0 = highly opaque, predatory),
  "trustScoreLabel": "one of: Very Low Transparency, Low Transparency, Moderate Clarity, Fairly Clear, Consumer-Friendly"
}

DOCUMENT TYPE DETECTION - Be accurate:
- Loan Agreement: Contains "borrower", "lender", "principal", "EMI", "interest rate", "tenure"
- Health Insurance: Contains "sum insured", "hospitalization", "pre-existing", "waiting period", "room rent"
- Life Insurance: Contains "sum assured", "nominee", "maturity", "death benefit", "premium"
- Credit Card: Contains "credit limit", "minimum due", "finance charge", "late payment fee"
- Mutual Fund: Contains "NAV", "units", "expense ratio", "exit load", "SIP"
- Fixed Deposit: Contains "tenure", "maturity amount", "interest rate", "premature withdrawal"
- Investment Advisory: Contains "advisory", "disclaimer", "risk factors", "recommendations"

Risk level guidelines:
- low: Standard terms, consumer-friendly, common knowledge, no hidden costs
- medium: Important terms the user must understand before signing — could cost money if misread, requires attention
- high: Terms that could significantly harm the user financially if misunderstood, hidden costs, one-sided clauses

Predatory flag: true if the clause could trap a consumer, hide costs, restrict rights, unfairly benefit the company, or create situations where the user loses money through no fault of their own.

Trust Score: Rate the overall document on clarity, fairness, and transparency. Penalize heavily for: buried fees, acceleration clauses, general liens, one-sided penalty structures, vague language, hidden exclusions, unfair termination rights, confusing calculations.

BE THOROUGH, ACCURATE, AND EXTREMELY SIMPLE. The user's financial future depends on understanding this document completely.
Analyze THIS SPECIFIC DOCUMENT, not generic financial advice.
Do not include any text outside the JSON object.`;

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
      const result = await extractTextFromPDF(buffer);

      if (!result.text || result.text.length === 0) {
        console.error('PDF parsing failed or returned empty text');
        return NextResponse.json<AnalyzeResponse>(
          { success: false, error: 'Could not extract text from PDF. The file might be corrupted, password-protected, or image-based (scanned). Please try a different PDF.' },
          { status: 400 }
        );
      }

      text = result.text;

      console.log('PDF parsed successfully, text length:', text.length, 'pages:', result.pageCount);
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

    const openai = getOpenAIClient();

    console.log('OpenAI client created, apiKey exists:', !!openai.apiKey);

    if (!openai.apiKey) {
      console.error('OpenAI API key is missing');
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Calling OpenAI API with text length:', text.length);

    const userPrompt = `Analyze this financial text and identify all jargon terms.
Output language for explanations: ${language === 'hi' ? 'Hindi' : 'English'}

Text to analyze:
${text}`;

    const response = await openai.chat.completions.create({
      model: process.env.NVIDIA_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    console.log('OpenAI response received');
    const content = response.choices[0]?.message?.content;
    console.log('Response content length:', content?.length);

    if (!content) {
      console.error('No content in OpenAI response');
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: 'Failed to analyze document' },
        { status: 500 }
      );
    }

    const data = JSON.parse(content);
    console.log('Parsed data, terms count:', data.terms?.length);

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
