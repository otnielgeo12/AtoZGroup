import { ObjectUploader } from "@workspace/object-storage-web";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { useRef, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/assets";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

/**
 * Compress an image File on the client side using the Canvas API before upload.
 * Resizes so neither dimension exceeds `maxDim` pixels and encodes as JPEG at
 * the given quality — yielding 60–80 % smaller payloads for typical photos.
 */
async function clientCompressImage(file: File, maxDim = 1920, quality = 0.82): Promise<File> {
  // Skip non-image files or SVGs (canvas can't round-trip SVG faithfully).
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Scale down so neither side exceeds maxDim.
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression made the file larger (e.g. already optimised JPEG), keep original.
            resolve(file);
            return;
          }
          // Rename to .jpg so the server still recognises it as an image.
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, "") + ".jpg",
            { type: "image/jpeg" }
          );
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const requestUploadUrl = useRequestUploadUrl();
  const [isUploading, setIsUploading] = useState(false);
  const pathMap = useRef<Record<string, string>>({});

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {value ? (
        <div className="relative rounded-md overflow-hidden border border-border aspect-video max-w-sm group">
          <img
            src={getImageUrl(value)}
            alt="Uploaded content"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-white font-medium text-sm">Image uploaded</span>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md aspect-video max-w-sm flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
          <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">No image selected</span>
          <span className="text-xs opacity-60 mt-1">JPG, PNG, WebP • max 1920 px</span>
        </div>
      )}

      <div>
        <ObjectUploader
          maxNumberOfFiles={1}
          onGetUploadParameters={async (file: any) => {
            setIsUploading(true);
            try {
              // file is a UppyFile — the actual File/Blob is in file.data
              const actualFile = (file.data as File) ?? file;
              const compressed = await clientCompressImage(actualFile);

              const res = await requestUploadUrl.mutateAsync({
                data: {
                  name: compressed.name,
                  size: compressed.size,
                  contentType: compressed.type || "application/octet-stream",
                },
              });

              // Map compressed name back to original so onComplete can find it.
              pathMap.current[compressed.name] = res.objectPath;
              // Also map the original filename in case the uploader uses it.
              pathMap.current[file.name] = res.objectPath;

              const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || "";
              const baseUrl = rawBaseUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
              const fullUploadUrl = `${baseUrl}${res.uploadURL}`;

              return {
                method: "POST",
                url: fullUploadUrl,
                headers: { 
                  "Content-Type": compressed.type || "application/octet-stream",
                  "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`
                },
                // Pass the compressed file so the uploader sends it instead of the original.
                file: compressed,
              };
            } catch (error) {
              setIsUploading(false);
              throw error;
            }
          }}
          onComplete={(result: any) => {
            setIsUploading(false);
            if (result.successful?.[0]) {
              const file = result.successful[0];
              const p = pathMap.current[file.name] ?? pathMap.current[file.data?.name];
              if (p) onChange(p);
            }
          }}
          buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading…" : "Upload Image"}
        </ObjectUploader>
      </div>
    </div>
  );
}
