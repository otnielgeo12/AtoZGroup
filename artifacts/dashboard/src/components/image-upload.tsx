import { ObjectUploader } from "@workspace/object-storage-web";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const requestUploadUrl = useRequestUploadUrl();
  const [isUploading, setIsUploading] = useState(false);
  const pathMap = useRef<Record<string, string>>({});

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {value ? (
        <div className="relative rounded-md overflow-hidden border border-border aspect-video max-w-sm group">
          <img src={`/api/storage${value}`} alt="Uploaded content" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-white font-medium text-sm">Image uploaded</span>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md aspect-video max-w-sm flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
          <Upload className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm">No image selected</span>
        </div>
      )}

      <div>
        <ObjectUploader
          maxNumberOfFiles={1}
          onGetUploadParameters={async (file: any) => {
            setIsUploading(true);
            try {
              const res = await requestUploadUrl.mutateAsync({
                data: {
                  name: file.name,
                  size: file.size,
                  contentType: file.type || "application/octet-stream",
                },
              });
              
              pathMap.current[file.name] = res.objectPath;

              return {
                method: "PUT",
                url: res.uploadURL,
                headers: { "Content-Type": file.type || "application/octet-stream" },
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
              const path = pathMap.current[file.name];
              if (path) {
                onChange(path);
              }
            }
          }}
          buttonClassName="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </ObjectUploader>
      </div>
    </div>
  );
}
