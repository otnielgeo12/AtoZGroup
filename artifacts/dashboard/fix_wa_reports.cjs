const fs = require('fs');
let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

const code = `
export interface WhatsAppMessageLog {
  id: string;
  sent_at?: string;
  created_at: string;
  customer_name?: string;
  recipient_number: string;
  message_text: string;
  image_url?: string;
  brand_id: string;
  status: "pending" | "success" | "failed";
  delivery_status?: "pending" | "sent" | "read" | "failed";
  wablas_message_id?: string;
  read_at?: string;
  error_message?: string;
}

export interface WhatsAppReportsSummary {
  totalMessages: number;
  totalSent: number;
  totalRead: number;
  totalFailed: number;
}

export async function fetchWhatsAppReports(
  startDate?: string,
  endDate?: string,
  brandFilter?: string
): Promise<{ data: WhatsAppMessageLog[]; summary: WhatsAppReportsSummary }> {
  return {
    data: [],
    summary: { totalMessages: 0, totalSent: 0, totalRead: 0, totalFailed: 0 }
  };
}
`;

if (!crm.includes('export async function fetchWhatsAppReports')) {
  fs.writeFileSync('src/lib/crm-api.ts', crm + code);
}
