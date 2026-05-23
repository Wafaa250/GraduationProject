import type { CSSProperties } from "react";
import { dash } from "../doctorDashTokens";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  border?: boolean;
};

export function Avatar({ name, size = 32, className, style, border }: Props) {
  return (
    <div
      className={className ? `dd-avatar ${className}` : "dd-avatar"}
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        border: border ? "2px solid #fff" : undefined,
        ...style,
      }}
    >
      {initialsFromName(name)}
    </div>
  );
}

export function AvatarGradient({ name, size = 32, border, className, style }: Props) {
  return (
    <div
      className={className ? `dd-avatar dd-avatar-gradient ${className}` : "dd-avatar dd-avatar-gradient"}
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        border: border ? "2px solid #fff" : undefined,
        position: "relative",
        ...style,
      }}
    >
      {initialsFromName(name)}
    </div>
  );
}
