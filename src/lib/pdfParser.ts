import { SAMPLE_TEXT } from './constants';

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    console.log('Starting PDF extraction, buffer size:', buffer.length);

    const { extractText } = await import('unpdf');
    const uint8Array = new Uint8Array(buffer);
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });

    console.log('Text extracted successfully, length:', text.length);

    if (!text || text.trim().length === 0) {
      return { text: '', pageCount: 0 };
    }

    return {
      text: text.slice(0, 4000),
      pageCount: totalPages
    };

  } catch (error) {
    console.error('PDF parsing error:', error);
    return { text: '', pageCount: 0 };
  }
}

export function getSampleText(): { text: string; pageCount: number } {
  return { text: SAMPLE_TEXT, pageCount: 1 };
}
