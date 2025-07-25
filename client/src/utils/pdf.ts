import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set up PDF.js worker for Vite using jsdelivr CDN with the correct .mjs extension
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const parsePdf = async (file: File, maxPages: number): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  let text = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ');
  }

  return text;
};
