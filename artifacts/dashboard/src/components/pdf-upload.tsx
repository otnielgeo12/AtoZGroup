import { ObjectUploader } from "@workspace/object-storage-web";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { getImageUrl } from "@/lib/assets";

interface PdfUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export function PdfUpload({ value, onChange, className }: PdfUploadProps) {
  const requestUploadUrl = useRequestUploadUrl();
  const [isUploading, setIsUploading] = useState(false);
  const pathMap = useRef<Record<string, string>>({});

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {value ? (
        <div className="relative rounded-md overflow-hidden border border-border h-32 max-w-sm group flex flex-col items-center justify-center bg-muted/20">
          <FileText className="w-8 h-8 mb-2 text-primary" />
          <span className="text-sm font-medium">PDF Uploaded</span>
          <a href={getImageUrl(value)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1">View PDF</a>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md aspect-video max-w-sm flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
          <FileText className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">No PDF selected</span>
          <span className="text-xs opacity-60 mt-1">PDF files only</span>
        </div>
      )}

      <div>
        <ObjectUploader
          maxNumberOfFiles={1}
          allowedFileTypes={[".pdf", "application/pdf"]}
          onGetUploadParameters={async (file: any) => {
            setIsUploading(true);
            try {
              const actualFile = (file.data as File) ?? file;
              const res = await requestUploadUrl.mutateAsync({
                data: {
                  name: actualFile.name,
                  size: actualFile.size,
                  contentType: actualFile.type || "application/pdf",
                },
              });

              pathMap.current[actualFile.name] = res.objectPath;
              pathMap.current[file.name] = res.objectPath;

              const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || "https://apiserver.atozgroupsemarang.com";
              const cleanedBaseUrl = rawBaseUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
              const baseUrl = (!cleanedBaseUrl || cleanedBaseUrl === "/" || cleanedBaseUrl.includes("dashboard.atozgroupsemarang.com")) ? "https://apiserver.atozgroupsemarang.com" : cleanedBaseUrl;
              
              const isDev = import.meta.env.DEV;
              const fullUploadUrl = isDev ? res.uploadURL : `${baseUrl}${res.uploadURL}`;

              return {
                method: "POST",
                url: fullUploadUrl,
                headers: { 
                  "Content-Type": actualFile.type || "application/pdf",
                  "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`
                },
                file: actualFile,
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
              if (p) {
                onChange(p);
              }
            }
          }}
          buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading…" : "Upload PDF"}
        </ObjectUploader>
      </div>
    </div>
  );
}
