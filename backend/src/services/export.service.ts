import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';

async function checkAccess(userId: string, documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { invites: { where: { userId } } },
  });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== userId && doc.invites.length === 0) {
    throw new HttpError(403, 'FORBIDDEN', 'Accès refusé');
  }
  return doc;
}

function buildHtml(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.6; }
    h1 { font-size: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div>${content}</div>
</body>
</html>`;
}

export const exportPdf = async (userId: string, documentId: string): Promise<Buffer> => {
  const doc = await checkAccess(userId, documentId);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(doc.title, doc.content), { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};
