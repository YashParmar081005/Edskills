import PDFDocument from 'pdfkit';

/**
 * Render a completion certificate to a PDF Buffer.
 * @returns {Promise<Buffer>}
 */
export function generateCertificatePdf({
  studentName,
  courseTitle,
  instructorName,
  certificateId,
  issuedAt,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // Background + double border
    doc.rect(0, 0, W, H).fill('#f8fbff');
    doc.lineWidth(4).strokeColor('#2563eb').rect(24, 24, W - 48, H - 48).stroke();
    doc.lineWidth(1).strokeColor('#38bdf8').rect(36, 36, W - 72, H - 72).stroke();

    // Brand
    doc
      .fillColor('#0ea5e9')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('EdSkill.ai', 0, 72, { align: 'center' });

    // Title
    doc
      .fillColor('#1e3a8a')
      .font('Helvetica-Bold')
      .fontSize(36)
      .text('Certificate of Completion', 0, 104, { align: 'center' });

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(14)
      .text('This is proudly presented to', 0, 172, { align: 'center' });

    // Student name
    doc
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(32)
      .text(studentName, 0, 198, { align: 'center' });

    doc
      .fillColor('#64748b')
      .font('Helvetica')
      .fontSize(14)
      .text('for successfully completing the course', 0, 250, { align: 'center' });

    // Course title
    doc
      .fillColor('#2563eb')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(courseTitle, 80, 278, { align: 'center', width: W - 160 });

    // Footer details
    const dateStr = new Date(issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const footY = H - 120;
    doc.font('Helvetica').fontSize(12).fillColor('#334155');
    doc.text(`Issued: ${dateStr}`, 70, footY, { width: 220, align: 'left' });
    doc.text(`Instructor: ${instructorName}`, 0, footY, { align: 'center' });
    doc.text(`Certificate ID: ${certificateId}`, W - 290, footY, {
      width: 220,
      align: 'right',
    });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#94a3b8')
      .text(`Verify the authenticity of this certificate at /verify/${certificateId}`, 0, H - 64, {
        align: 'center',
      });

    doc.end();
  });
}
