import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * 📄 Export data to PDF
 * @param {string} title - Title of the report
 * @param {Array} data - Array of objects [{key:value}]
 * @param {Array} columns - Keys of data to include
 */
export const exportToPDF = (title, data, columns) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  const tableData = data.map((row) => columns.map((col) => row[col]));

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: tableData,
  });

  doc.save(`${title}.pdf`);
};

/**
 * 📊 Export data to Excel
 * @param {string} title - File name
 * @param {Array} data - Array of objects
 */
export const exportToExcel = (title, data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `${title}.xlsx`);
};
