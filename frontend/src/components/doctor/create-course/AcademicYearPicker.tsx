import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAcademicYear, getStartYearOptions } from "@/lib/academicYear";
import { cn } from "@/lib/utils";

type AcademicYearPickerProps = {
  id?: string;
  value: number | null;
  onChange: (startYear: number | null) => void;
};

export function AcademicYearPicker({ id, value, onChange }: AcademicYearPickerProps) {
  const options = getStartYearOptions();
  const academicYearLabel = value != null ? formatAcademicYear(value) : null;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select
        value={value != null ? String(value) : undefined}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-11 rounded-xl border-border bg-surface text-[14px] text-foreground shadow-none",
            "focus:ring-4 focus:ring-ring/15 focus:border-ring hover:border-ring/40",
            "sm:max-w-[160px]",
          )}
        >
          <SelectValue placeholder="Start year" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {options.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        className={cn(
          "flex h-11 flex-1 items-center rounded-xl border border-border bg-surface-muted/50 px-3.5 text-[14px] font-medium",
          academicYearLabel ? "text-foreground" : "text-muted-foreground/70",
        )}
        aria-live="polite"
      >
        {academicYearLabel ?? "Select a start year"}
      </div>
    </div>
  );
}
