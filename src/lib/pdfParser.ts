import { SAMPLE_TEXT } from './constants';

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    console.log('Starting PDF extraction with pdf2json, buffer size:', buffer.length);

    // Dynamic import to avoid issues with Node.js environment
    const PDFParser = (await import('pdf2json')).default;

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (err: any) => {
        console.error('PDF parsing error:', err);
        reject(err);
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          console.log('PDF parsed successfully');

          // Extract text from all pages
          let fullText = '';

          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const r of textItem.R) {
                      if (r.T) {
                        fullText += decodeURIComponent(r.T) + ' ';
                      }
                    }
                  }
                }
              }
              fullText += '\n';
            }
          }

          console.log('Text extracted successfully, length:', fullText.length);

          if (!fullText || fullText.trim().length === 0) {
            console.error('PDF parsed but returned empty text');
            resolve({ text: '', pageCount: 0 });
            return;
          }

          // Return first 4000 characters
          const truncatedText = fullText.slice(0, 4000);
          console.log('Returning truncated text, length:', truncatedText.length);

          resolve({
            text: truncatedText,
            pageCount: pdfData.Pages?.length || 0
          });
        } catch (error) {
          console.error('Error processing PDF data:', error);
          reject(error);
        }
      });

      // Parse the PDF buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return { text: '', pageCount: 0 };
  }
}

export function getSampleText(): { text: string; pageCount: number } {
  return { text: SAMPLE_TEXT, pageCount: 1 };
}
