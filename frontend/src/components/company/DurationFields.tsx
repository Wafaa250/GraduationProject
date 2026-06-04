import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DURATION_UNITS, type DurationUnit } from "@/constants/companyRequestCatalog";
import { cn } from "@/lib/utils";

type Props = {
  ongoing: boolean;
  onOngoingChange: (v: boolean) => void;
  value: number | "";
  onValueChange: (v: number | "") => void;
  unit: DurationUnit | "";
  onUnitChange: (u: DurationUnit | "") => void;
  className?: string;
  hideLabel?: boolean;
};

export function DurationFields({
  ongoing,
  onOngoingChange,
  value,
  onValueChange,
  unit,
  onUnitChange,
  className,
  hideLabel = false,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      {hideLabel ? null : <label className="cw-wizard-field-label">Duration</label>}

      <label className="cw-wizard-duration-toggle">
        <Checkbox
          checked={ongoing}
          onCheckedChange={(c) => onOngoingChange(c === true)}
        />
        <span className="text-sm font-medium">Ongoing collaboration</span>
      </label>

      {!ongoing && (
        <div className="grid grid-cols-2 gap-3">
          <div className="cw-wizard-field">
            <label htmlFor="duration-value" className="cw-wizard-field-label text-xs">
              Length
            </label>
            <Input
              id="duration-value"
              type="number"
              min={1}
              max={99}
              value={value === "" ? "" : value}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") onValueChange("");
                else onValueChange(Math.min(99, Math.max(1, parseInt(v, 10) || 1)));
              }}
              placeholder="e.g. 3"
              className="cw-wizard-input mt-1.5"
            />
          </div>
          <div className="cw-wizard-field">
            <Label className="cw-wizard-field-label text-xs">Unit</Label>
            <Select
              value={unit || undefined}
              onValueChange={(u) => onUnitChange(u as DurationUnit)}
            >
              <SelectTrigger className="cw-wizard-input mt-1.5 h-11">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="cw-select-popover">
                {DURATION_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
