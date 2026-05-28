import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import { importStudentsToSection, type ImportSectionStudentsResult } from "@/api/doctorCoursesApi";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { cn } from "@/lib/utils";

const ACCEPT = ".csv,.xlsx,.docx,.pdf";
const ACCEPT_MIME =
  "text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

type ImportStudentsDialogProps = {
  open: boolean;
  sections: CourseSectionView[];
  defaultSectionId?: number | null;
  fixedSectionId?: number;
  onClose: () => void;
  onSaved: () => void;
  onUseManualAdd: () => void;
};

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".docx") ||
    name.endsWith(".pdf")
  );
}

export function ImportStudentsDialog({
  open,
  sections,
  defaultSectionId,
  fixedSectionId,
  onClose,
  onSaved,
  onUseManualAdd,
}: ImportStudentsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sectionId, setSectionId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSectionStudentsResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const initial =
      fixedSectionId != null
        ? String(fixedSectionId)
        : defaultSectionId != null
          ? String(defaultSectionId)
          : sections[0]
            ? String(sections[0].id)
            : "";
    setSectionId(initial);
    setFile(null);
    setDragOver(false);
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, [open, defaultSectionId, fixedSectionId, sections]);

  const pickFile = useCallback((next: File | null) => {
    setError(null);
    setResult(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isAcceptedFile(next)) {
      setError("Use CSV, Excel (.xlsx), Word (.docx), or PDF.");
      setFile(null);
      return;
    }
    setFile(next);
  }, []);

  const handleImport = async () => {
    const sid = Number(sectionId);
    if (!Number.isFinite(sid) || !file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const importResult = await importStudentsToSection(sid, file, setProgress);
      setResult(importResult);
      if (importResult.added > 0) onSaved();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    onClose();
  };

  return (
    <WorkspaceModal
      open={open}
      title="Import students"
      description="Upload a class roster containing university student IDs."
      onClose={handleClose}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {fixedSectionId == null ? (
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId} disabled={uploading || sections.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (uploading) return;
            pickFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => {
            if (!uploading) inputRef.current?.click();
          }}
          className={cn(
            "cursor-pointer rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={`${ACCEPT},${ACCEPT_MIME}`}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileUp className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">{file.name}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · Click or drop to replace
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-foreground">Drag & drop a roster file</p>
              <p className="mt-1 text-[12px] text-muted-foreground">CSV, Excel (.xlsx), Word (.docx), or PDF</p>
            </>
          )}
        </div>

        {uploading ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Uploading & processing…</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Import complete
            </div>
            <dl className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <dt className="text-muted-foreground">IDs found</dt>
                <dd className="font-semibold tabular-nums">{result.parsedCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Added</dt>
                <dd className="font-semibold tabular-nums text-foreground">{result.added}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Skipped</dt>
                <dd className="font-semibold tabular-nums">{result.skipped.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Invalid</dt>
                <dd className="font-semibold tabular-nums">{result.invalidIds.length}</dd>
              </div>
            </dl>
            {result.addedStudents.length > 0 ? (
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Added students</p>
                <ul className="max-h-28 space-y-0.5 overflow-y-auto text-[12px]">
                  {result.addedStudents.map((s) => (
                    <li key={s.universityId} className="truncate">
                      <span className="font-medium">{s.universityId}</span>
                      {s.name ? <span className="text-muted-foreground"> · {s.name}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.skipped.length > 0 ? (
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Skipped (already enrolled)</p>
                <p className="text-[12px] text-foreground">{result.skipped.join(", ")}</p>
              </div>
            ) : null}
            {result.invalidIds.length > 0 ? (
              <div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Invalid / not registered</p>
                <p className="text-[12px] text-foreground">{result.invalidIds.join(", ")}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={uploading}>
            {result ? "Done" : "Cancel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => {
              handleClose();
              onUseManualAdd();
            }}
          >
            Add by student ID
          </Button>
          {!result ? (
            <Button
              type="button"
              disabled={uploading || !file || sections.length === 0}
              onClick={() => void handleImport()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Import roster
            </Button>
          ) : null}
        </div>
      </div>
    </WorkspaceModal>
  );
}
