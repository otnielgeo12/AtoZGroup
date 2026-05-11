export function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return "";
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const baseUrl = (import.meta as any).env?.VITE_API_URL || "";
  return `${baseUrl}/api/storage${imagePath}`;
}
