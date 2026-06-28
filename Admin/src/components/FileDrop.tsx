import { Upload } from "lucide-react";
import { Label } from "./ui/label";

// Consistent dashed upload dropzone with current-asset hint. Replaces the
// repeated inline upload blocks in the add/edit forms.
export function FileDrop({
  id,
  label,
  accept,
  file,
  currentUrl,
  hint,
  onSelect,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  currentUrl?: string | null;
  hint?: string;
  onSelect: (file: File | null) => void;
}) {
  return (
    <div>
      <Label className="text-neutral-300">{label}</Label>
      {currentUrl && !file && (
        <p className="text-xs text-neutral-500 mb-1 truncate">
          Current:{" "}
          <a className="text-[#fd7e14]" href={currentUrl} target="_blank" rel="noreferrer">
            {currentUrl}
          </a>
        </p>
      )}
      <label
        htmlFor={id}
        className="mt-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-5 text-center text-neutral-400 cursor-pointer transition-colors hover:border-[#fd7e14]/50 hover:bg-neutral-900/60"
      >
        <Upload className="h-5 w-5" />
        <span className="text-sm">{file ? `Selected: ${file.name}` : "Drop or click to upload"}</span>
        {hint && <span className="text-xs text-neutral-600">{hint}</span>}
      </label>
      <input
        type="file"
        accept={accept}
        className="hidden"
        id={id}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
