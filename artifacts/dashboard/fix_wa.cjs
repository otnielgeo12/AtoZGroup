const fs = require('fs');

let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

// Strip out the dangling partial code that was left at the end
crm = crm.replace(/export interface SendWhatsAppParams \{[\s\S]*$/g, '');

const additionalCode = `
export interface SendWhatsAppParams {
  recipients: CustomerListItem[];
  message: string;
  imageFile?: File;
  imageUrl?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  message: string;
  jobId?: string;
  estimatedSeconds?: number;
  skippedDueToLimit?: number;
}

export interface WhatsAppJobProgress {
  status: "pending" | "processing" | "completed" | "failed";
  totalRecipients: number;
  sentCount: number;
  failCount: number;
  results: { name: string; phone: string; status: "sent" | "failed"; error?: string }[];
}

export async function getWhatsAppSendProgress(jobId: string): Promise<WhatsAppJobProgress | null> {
  return null;
}

export async function getWhatsAppStatus(tenant: string): Promise<{ dailyCount: number, dailyLimit: number }> {
  return { dailyCount: 0, dailyLimit: 15 };
}
`;

fs.writeFileSync('src/lib/crm-api.ts', crm + additionalCode);
