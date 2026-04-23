/**
 * Export the text content of an HTML element to a PDF.
 *
 * Only plain text is preserved; styling and layout are not captured.
 * To capture full styling, consider a different approach such as html2canvas.
 */
import type { JsPdf } from "@/types/pdfExport";

export async function exportElementToPdf(element: HTMLElement, fileName = "export.pdf") {
  if (typeof window === "undefined") return;
  try {
    const { jsPDF } = (await eval("import('jspdf')")) as { jsPDF: JsPdf };
    const doc = new jsPDF();
    doc.text(element.innerText, 10, 10);
    doc.save(fileName);
  } catch {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(element.outerHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}
