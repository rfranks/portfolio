type JsPdf = {
  new (): {
    text: (content: string, x: number, y: number) => void;
    save: (name: string) => void;
  };
};

export async function exportElementToPdf(
  element: HTMLElement,
  fileName = "export.pdf"
) {
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
