import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { ApiError } from '../utils/ApiError.js';

const MAX_CHARS = 60000; // hard cap on text we keep from one document

/**
 * Extract plain text from an uploaded document buffer.
 * Supports PDF, DOCX, TXT and Markdown.
 * @param {{buffer:Buffer, originalname?:string, mimetype?:string}} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const { buffer, originalname = '', mimetype = '' } = file;
  const name = originalname.toLowerCase();
  let text = '';

  try {
    if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result?.text || '';
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value || '';
    } else if (mimetype.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
      text = buffer.toString('utf8');
    } else {
      throw new ApiError(400, 'Unsupported file type. Upload a PDF, DOCX, TXT or MD file.');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(422, `Could not read that document: ${err.message}`);
  }

  // Normalise whitespace and strip NUL control chars.
  text = text
    .replace(/\x00/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text || text.length < 20) {
    throw new ApiError(
      422,
      'No readable text found. If this is a scanned PDF, it may be image-only (no selectable text).'
    );
  }

  return text.slice(0, MAX_CHARS);
}
