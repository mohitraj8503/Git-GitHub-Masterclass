import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  fileName?: string;
  elementId?: string;
  /** When provided, auto-registers the certificate in the DB on export */
  certData?: CertificateRegistrationData;
}

/** Data needed to auto-register a certificate in the DB on export */
export interface CertificateRegistrationData {
  recipientName: string;
  enrollmentId: string;
  completionDate: string;
  customCertificateId?: string;
}

/**
 * Silently registers the certificate in the DB so it's instantly verifiable.
 * Uses upsert — safe to call on re-exports.
 */
async function registerCertificate(cert: CertificateRegistrationData): Promise<void> {
  try {
    await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientName: cert.recipientName,
        enrollmentId: cert.enrollmentId,
        completionDate: cert.completionDate,
        customCertificateId: cert.customCertificateId || undefined,
      }),
    });
  } catch (err) {
    console.warn('[certificateExport] Auto-registration failed:', err);
  }
}

/**
 * Captures the certificate element using html2canvas cleanly.
 * Waits for fonts to be ready and renders in an off-screen unscaled 1200x820 container
 * so parent CSS transforms or font loading delays do NOT warp text spacing or layout.
 */
async function captureCertificateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  container.style.height = '820px';
  container.style.zIndex = '-9999';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#ffffff';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.position = 'static';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '1200px';
  clone.style.height = '820px';

  container.appendChild(clone);
  document.body.appendChild(container);

  // Short pause for full layout calculation & font rendering
  await new Promise((res) => setTimeout(res, 200));

  const canvas = await html2canvas(clone, {
    scale: 2, // High resolution (2400x1640)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 1200,
    height: 820,
    windowWidth: 1200,
    windowHeight: 820,
  });

  document.body.removeChild(container);
  return canvas;
}

export const downloadCertificatePNG = async (options?: ExportOptions): Promise<void> => {
  const elementId = options?.elementId || 'certificate-canvas';
  const fileName = options?.fileName || 'Git_GitHub_Masterclass_Certificate.png';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id '${elementId}' not found.`);
    return;
  }

  if (options?.certData) {
    registerCertificate(options.certData);
  }

  try {
    const canvas = await captureCertificateCanvas(element);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error generating PNG:', error);
  }
};

export const downloadCertificatePDF = async (options?: ExportOptions): Promise<void> => {
  const elementId = options?.elementId || 'certificate-canvas';
  const fileName = options?.fileName || 'Git_GitHub_Masterclass_Certificate.pdf';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id '${elementId}' not found.`);
    return;
  }

  if (options?.certData) {
    registerCertificate(options.certData);
  }

  try {
    const canvas = await captureCertificateCanvas(element);
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 Landscape size: 297mm x 210mm
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

export const printCertificate = (): void => {
  const element = document.getElementById('certificate-canvas');
  if (!element) {
    console.error('Certificate canvas element not found.');
    return;
  }

  const certHtml = element.outerHTML;
  const styleTagsHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const printWindow = window.open('', '_blank', 'width=1200,height=820');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print.');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Completion</title>
  ${styleTagsHtml}
  <style>
    @page {
      size: 1200px 820px;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      width: 1200px;
      height: 820px;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: hidden !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #certificate-canvas {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 1200px !important;
      height: 820px !important;
      transform: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }
  </style>
</head>
<body>
  ${certHtml}
</body>
</html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }, 300);
  };

  setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }
  }, 1500);
};
