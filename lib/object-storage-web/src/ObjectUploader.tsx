import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import type { UppyFile, UploadResult } from "@uppy/core";
import DashboardModal from "@uppy/react/dashboard-modal";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import XHRUpload from "@uppy/xhr-upload";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  /**
   * Function to get upload parameters for each file.
   * IMPORTANT: This receives the file object - use file.name, file.size, file.type
   * to request per-file presigned URLs from your backend.
   */
  onGetUploadParameters: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>
  ) => Promise<{
    method: "PUT" | "POST";
    url: string;
    headers?: Record<string, string>;
    file?: File | Blob;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 *
 * The component uses Uppy v5 under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 *
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters for each file.
 *   Receives the UppyFile object with file.name, file.size, file.type properties.
 *   Use these to request per-file presigned URLs from your backend. Returns method,
 *   url, and optional headers for the upload request.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const onCompleteRef = useRef(onComplete);
  const onGetUploadParametersRef = useRef(onGetUploadParameters);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onGetUploadParametersRef.current = onGetUploadParameters; }, [onGetUploadParameters]);

  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    });

    uppyInstance.use(XHRUpload, {
      endpoint: "/placeholder",
      formData: false,
      getResponseData: (xhr) => {
        return { url: xhr.responseURL };
      },
    });

    uppyInstance.addPreProcessor(async (fileIDs) => {
      for (const fileID of fileIDs) {
        const file = uppyInstance.getFile(fileID);
        try {
          const params = await onGetUploadParametersRef.current(file);
          if (params.file) {
            uppyInstance.setFileState(fileID, {
              data: params.file,
              size: params.file.size,
            });
          }
          uppyInstance.setFileState(fileID, {
            xhrUpload: {
              endpoint: params.url,
              method: params.method,
              headers: params.headers,
            },
          });
        } catch (error) {
          console.error("[ObjectUploader] Failed to get upload parameters:", error);
          uppyInstance.info({ message: "Failed to get upload URL", details: String(error) }, "error", 3000);
          throw error; // This prevents the upload from continuing with invalid config
        }
      }
    });

    uppyInstance.on("complete", (result) => {
      onCompleteRef.current?.(result);
    });

    return uppyInstance;
  });

  return (
    <div>
      <button type="button" onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
