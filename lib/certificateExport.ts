import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  fileName?: string;
  elementId?: string;
}

export const downloadCertificatePNG = async (options?: ExportOptions): Promise<void> => {
  const elementId = options?.elementId || 'certificate-canvas';
  const fileName = options?.fileName || 'Git_GitHub_Masterclass_Certificate.png';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id '${elementId}' not found.`);
    return;
  }

  try {
    // Target the fixed 3508x2480 canvas directly at 1:1 native scale
    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (300 DPI 7016x4960 render downsampled or crisp PNG)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FCFCFB',
      logging: false,
      width: 3508,
      height: 2480,
      windowWidth: 3508,
      windowHeight: 2480,
    });

    element.style.transform = originalTransform;

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

  try {
    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution render
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FCFCFB',
      logging: false,
      width: 3508,
      height: 2480,
      windowWidth: 3508,
      windowHeight: 2480,
    });

    element.style.transform = originalTransform;

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
  window.print();
};
