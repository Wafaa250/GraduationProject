import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

type Props = {
  label: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
};

export function DoctorProfileSkillTagsField({
  label,
  inputValue,
  onInputChange,
  tags,
  onAdd,
  onRemove,
  placeholder = "Type and press Enter",
}: Props) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      onAdd(inputValue);
      onInputChange("");
    }
  };

  const onBlur = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      onInputChange("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <Badge key={`${tag}-${idx}`} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => onRemove(idx)}
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
