export function getImageUrl(imagePath?: string | null, width?: number): string {
  if (!imagePath) return "";
  
  // If it's already a full URL or data URI, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_CRM_API_URL || "https://apiclone.atozgroupsemarang.com";
  const cleanedBaseUrl = rawBaseUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
  const baseUrl = (!cleanedBaseUrl || cleanedBaseUrl === "/" || cleanedBaseUrl.includes("dashboard.atozgroupsemarang.com")) ? "https://apiclone.atozgroupsemarang.com" : cleanedBaseUrl;
  const url = `${baseUrl}/api/storage${imagePath}`;
  
  // Append width parameter if provided to trigger server-side resizing
  return width ? `${url}?w=${width}` : url;
}
