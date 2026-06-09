import FileUpload from "./FileUpload";
import ModalOverlay from "./ModalOverlay";
import { UploadIcon } from "./icons";

export default function UploadModal({ onClose, onSuccess }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <UploadIcon className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Upload CSV</h2>
            <p className="text-xs text-slate-500">Queue ticket lookups without a full sync</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 text-xl transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div className="p-6">
        <FileUpload onSuccess={onSuccess} />
      </div>
    </ModalOverlay>
  );
}
