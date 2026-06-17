/**
 * CRM Export Service — Vsoft Edition
 *
 * Handles client-side generation of Excel (.xlsx) and PDF reports
 * from customer data that is already fetched in the TanStack Query cache.
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { CustomerListItem } from "./crm-api";

// ─── Shared blob-download helper ──────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  // Clean up — revoke after a short delay so browser has time to initiate download
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }, 150);
}

// ─── Data transform ───────────────────────────────────────────────────────────

function toRows(customers: CustomerListItem[]) {
  return customers.map((c) => ({
    "Code":           c.id,
    "Full Name":      c.fullName,
    "Phone":          c.phone,
    "Email":          c.email || "—",
    "Category":       c.categoryName || "—",
    "Outlet":         c.primaryOutletName || "All Outlets",
    "Location":       [c.city, c.province].filter(Boolean).join(", ") || c.address || "—",
    "Food Prefs":     c.foodPreferences.length > 0 ? c.foodPreferences.join(", ") : "—",
    "Beverage Prefs": c.beveragePreferences.length > 0 ? c.beveragePreferences.join(", ") : "—",
    "Spending":       c.totalSpending > 0 ? c.totalSpending : "—",
    "Visits":         c.totalVisits > 0 ? c.totalVisits : "—",
    "Points":         c.pointBalance,
  }));
}

// ─── Excel export ─────────────────────────────────────────────────────────────

export function downloadExcel(customers: CustomerListItem[], filenameBase = "crm-customers"): void {
  const rows = toRows(customers);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-width for each column
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key]).length)) + 2,
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

  const xlsxBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const timestamp = format(new Date(), "yyyyMMdd_HHmm");
  triggerDownload(blob, `${filenameBase}_${timestamp}.xlsx`);
}

// ─── PDF export ───────────────────────────────────────────────────────────────

export function downloadPdf(customers: CustomerListItem[], filenameBase = "crm-customers"): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const now = format(new Date(), "dd MMMM yyyy, HH:mm");

  // ── Cover header ──────────────────────────────────────────────────────────
  doc.setFillColor(128, 48, 59); // primary wine colour
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 245, 220);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AtoZ Group — CRM Customer Report", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${now}  |  Total records: ${customers.length}`, 14, 19);

  // ── Table ─────────────────────────────────────────────────────────────────
  const rows = toRows(customers);
  const headers = Object.keys(rows[0] ?? {});
  const body = rows.map((r) => headers.map((h) => String((r as any)[h])));

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: {
      fillColor: [128, 48, 59],
      textColor: [255, 245, 220],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [252, 249, 245] },
    columnStyles: {
      0: { cellWidth: 16 },  // Code
      1: { cellWidth: 32 },  // Name
      2: { cellWidth: 24 },  // Phone
      3: { cellWidth: 32 },  // Email
      4: { cellWidth: 18 },  // Category
      5: { cellWidth: 30 },  // Outlet
      6: { cellWidth: 24 },  // Location
      7: { cellWidth: 18, halign: "right" }, // Spending
      8: { cellWidth: 14, halign: "right" }, // Points
    },
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}  |  Confidential — Internal Use Only`,
      14,
      doc.internal.pageSize.height - 6
    );
  }

  const pdfBlob = doc.output("blob");
  const timestamp = format(new Date(), "yyyyMMdd_HHmm");
  triggerDownload(pdfBlob, `${filenameBase}_${timestamp}.pdf`);
}
