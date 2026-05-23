import { Avatar, AvatarFallback } from "../../ui/avatar";

type Props = {
  names: string[];
  max?: number;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function MemberAvatarStack({ names, max = 5, className = "" }: Props) {
  const visible = names.filter(Boolean).slice(0, max);
  if (visible.length === 0) return null;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible.map((name, i) => (
        <Avatar key={`${name}-${i}`} className="h-8 w-8 border-2 border-background">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
