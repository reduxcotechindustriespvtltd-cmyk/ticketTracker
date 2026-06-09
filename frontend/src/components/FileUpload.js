import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadCSV } from "../api/tickets";
import { UploadIcon } from "./icons";

export default function FileUpload({ onSuccess }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const data = await uploadCSV(file);
      onSuccess?.(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
      setStatus("error");
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: status === "uploading",
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-brand-400 bg-brand-50"
            : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
        } ${status === "uploading" ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <UploadIcon className="w-6 h-6 text-slate-400" />
        </div>
        {isDragActive ? (
          <p className="text-brand-600 font-medium">Drop the CSV here...</p>
        ) : (
          <>
            <p className="text-slate-700 font-medium">Drag & drop a CSV, or click to browse</p>
            <p className="text-slate-400 text-xs mt-2">
              Required column: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ticket_number</code> (13 digits per row)
            </p>
          </>
        )}
        {status === "uploading" && (
          <p className="text-brand-600 mt-3 text-sm animate-pulse font-medium">Uploading and queuing jobs...</p>
        )}
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}
    </div>
  );
}
