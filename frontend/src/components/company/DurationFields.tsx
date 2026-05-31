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
};

export function DurationFields({
  ongoing,
  onOngoingChange,
  value,
  onValueChange,
  unit,
  onUnitChange,
  className,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-sm font-medium">Duration</Label>

      <label className="flex items-center gap-3 rounded-xl border bg-secondary/20 px-4 py-3.5 cursor-pointer hover:bg-secondary/40 transition-colors">
        <Checkbox
          checked={ongoing}
          onCheckedChange={(c) => onOngoingChange(c === true)}
        />
        <span className="text-sm font-medium">Ongoing collaboration</span>
      </label>

      {!ongoing && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration-value" className="text-sm">
              Length
            </Label>
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
              className="rounded-xl mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm">Unit</Label>
            <Select
              value={unit || undefined}
              onValueChange={(u) => onUnitChange(u as DurationUnit)}
            >
              <SelectTrigger className="rounded-xl mt-1.5">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
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
