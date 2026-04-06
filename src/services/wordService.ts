import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * WordService - Version 22.0 FINAL STABLE (Bản chuẩn BUỔI TRƯA)
 * Provides 100% compatibility and pixel-perfect label layout.
 * Enforces Times New Roman and precise A4 grid cell rendering.
 */

const escapeXml = (unsafe: any) => {
  const str = (unsafe === null || unsafe === undefined) ? "" : String(unsafe);
  return str.replace(/[<>&"']/g, (m) => {
    switch (m) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
};

const normalizeKey = (key: string) => key.trim().toLowerCase();

export const wordService = {
  async generateFromDesign(
    lines: any[],
    excelData: any[],
    mode: 'single' | 'multiple',
    columns: number = 2,
    lineSpacing: number = 240
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // A4 Dimensions: approx 11906 x 16838 DXA. 
        // Table width set to avoid over-margining.
        const fullPageWidth = 10800;
        const cellWidth = Math.floor(fullPageWidth / columns);

        let tableRowsXml = '';

        for (let i = 0; i < excelData.length; i += columns) {
          let cellsXml = '';
          for (let j = 0; j < columns; j++) {
            const dataIndex = i + j;
            const rowData = excelData[dataIndex];

            let cellContentXml = '';
            if (rowData) {
              cellContentXml = lines.map(line => {
                let text = line.text;
                // Placeholders
                text = text.replace(/\{([^}]+)\}/g, (match: string, p1: string) => {
                  const targetKey = normalizeKey(p1);
                  const realKey = Object.keys(rowData).find(k => normalizeKey(k) === targetKey);
                  return realKey ? String(rowData[realKey]) : match;
                });

                const align = line.alignment === 'center' ? 'center' : line.alignment === 'right' ? 'right' : 'left';
                return `
                  <w:p>
                    <w:pPr>
                      <w:jc w:val="${align}"/>
                      <w:spacing w:line="${lineSpacing}" w:lineRule="auto" w:after="0"/>
                      <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr>
                    </w:pPr>
                    <w:r>
                      <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
                        <w:sz w:val="${line.fontSize * 2}"/><w:szCs w:val="${line.fontSize * 2}"/>
                        ${line.bold ? '<w:b/><w:bCs/>' : ''}
                      </w:rPr>
                      <w:t xml:space="preserve">${escapeXml(text)}</w:t>
                    </w:r>
                  </w:p>`;
              }).join('');
            } else {
              cellContentXml = '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>';
            }

            cellsXml += `
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="${cellWidth}" w:type="dxa"/>
                  <w:tcBorders>
                    <w:top w:val="single" w:sz="4" w:color="000000"/><w:left w:val="single" w:sz="4" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="4" w:color="000000"/><w:right w:val="single" w:sz="4" w:color="000000"/>
                  </w:tcBorders>
                  <w:vAlign w:val="center"/>
                  <w:tcMar>
                    <w:top w:w="80" w:type="dxa"/>
                    <w:left w:w="120" w:type="dxa"/>
                    <w:bottom w:w="80" w:type="dxa"/>
                    <w:right w:w="120" w:type="dxa"/>
                  </w:tcMar>
                </w:tcPr>
                ${cellContentXml}
              </w:tc>`;
          }

          tableRowsXml += `
            <w:tr>
              <w:trPr>
                <w:trHeight w:val="240" w:hRule="atLeast"/>
                <w:cantSplit w:val="1"/> 
              </w:trPr>
              ${cellsXml}
            </w:tr>`;
        }

        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${fullPageWidth}" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/><w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      ${tableRowsXml}
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

        const zip = new PizZip();
        zip.file('word/document.xml', documentXml);
        zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        const out = zip.generate({ type: 'blob' });
        saveAs(out, 'label_studio_export.docx');
        resolve();
      } catch (err) { reject(err); }
    });
  }
};
