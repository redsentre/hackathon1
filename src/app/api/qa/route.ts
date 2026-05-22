import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { QARequest, QAResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: QARequest = await req.json();
    const { question, documentText, language } = body;

    if (!question?.trim()) {
      return NextResponse.json<QAResponse>(
        { success: false, error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    if (!documentText?.trim()) {
      return NextResponse.json<QAResponse>(
        { success: false, error: 'Document text is required' },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are ArthSaathi, a friendly and patient financial assistant. The user has uploaded a financial document and is asking a question about it.

CRITICAL INSTRUCTIONS:
1. READ THE ENTIRE DOCUMENT CAREFULLY - Do not skim.
2. ANSWER BASED ONLY ON THIS SPECIFIC DOCUMENT.
3. BE EXTREMELY SIMPLE - Use language a 12-year-old can understand.
4. USE ANALOGIES AND EXAMPLES - Compare financial concepts to everyday things.
5. BE THOROUGH BUT SIMPLE - Break down into small, easy-to-digest pieces.
6. BE HONEST - If something is unclear or missing from the document, say so.

SIMPLICITY RULES:
- Never use technical terms without explaining them first
- Use short sentences (under 15 words when possible)
- Use bullet points for complex information
- Compare to everyday situations

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.

Document text:
${documentText}

Question: ${question}`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const answer = result.choices[0]?.message?.content;

    if (!answer) {
      return NextResponse.json<QAResponse>(
        { success: false, error: 'Failed to generate answer' },
        { status: 500 }
      );
    }

    return NextResponse.json<QAResponse>({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('QA error:', error);
    return NextResponse.json<QAResponse>(
      { success: false, error: 'An error occurred while processing your question' },
      { status: 500 }
    );
  }
}
