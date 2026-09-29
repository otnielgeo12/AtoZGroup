const fs = require('fs');
let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

const code = `
export async function sendWhatsAppAtoZ(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppBosa(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppBodega(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppLakers(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppRedhare(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppOombee(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppShiraz(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppDistrict5(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
export async function sendWhatsAppInfinity(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: true, message: "Placeholder" };
}
`;

fs.writeFileSync('src/lib/crm-api.ts', crm + code);
