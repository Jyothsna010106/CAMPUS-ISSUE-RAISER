const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const sourcePath = path.join(__dirname, '..', 'docs', 'CAMPUS_ISSUE_RAISER_DEEP_DIVE_DETAILED.md');
const outPath = path.join(__dirname, '..', 'docs', 'CAMPUS_ISSUE_RAISER_DEEP_DIVE_DETAILED.pdf');

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, left: 50, right: 50, bottom: 50 },
  info: {
    Title: 'Campus Issue Raiser - Deep Dive',
    Author: 'GitHub Copilot',
  },
});

doc.pipe(fs.createWriteStream(outPath));

const renderLine = (line) => {
  if (line.trim().length === 0) {
    doc.moveDown(0.4);
    return;
  }

  if (line.startsWith('# ')) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(line.slice(2));
    doc.moveDown(0.3);
    return;
  }

  if (line.startsWith('## ')) {
    doc.moveDown(0.35);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(line.slice(3));
    doc.moveDown(0.2);
    return;
  }

  if (line.startsWith('### ')) {
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b').text(line.slice(4));
    return;
  }

  if (line.startsWith('---')) {
    const y = doc.y + 4;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(0.8);
    return;
  }

  doc.font('Helvetica').fontSize(10.5).fillColor('#111827').text(line, {
    lineGap: 2,
  });
};

lines.forEach(renderLine);

doc.end();

console.log(`PDF generated: ${outPath}`);
