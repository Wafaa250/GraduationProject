import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

type ProfileRole = "student" | "doctor";

type ProfileUserLike = {
  role?: string | null;
  userRole?: string | null;
  type?: string | null;
  id?: number | string | null;
  userId?: number | string | null;
  studentId?: number | string | null;
  doctorId?: number | string | null;
};

type ProfileLinkProps = {
  userId: number | string | null | undefined;
  role: ProfileRole;
  children: ReactNode;
  style?: CSSProperties;
};

export function getProfileUrl(user: ProfileUserLike): string | null {
  const roleRaw = String(user.role ?? user.userRole ?? user.type ?? "").toLowerCase();
  const role: ProfileRole =
    roleRaw === "doctor" || roleRaw.includes("doctor") ? "doctor" : "student";

  const rawId = user.doctorId ?? user.studentId ?? user.userId ?? user.id;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return role === "doctor" ? `/doctors/${id}` : `/students/${id}`;
}

export default function ProfileLink({ userId, role, children, style }: ProfileLinkProps) {
  const href = getProfileUrl({ role, userId });
  if (!href) {
    return <span style={style}>{children}</span>;
  }

  return (
    <Link
      to={href}
      style={{
        color: "#4f46e5",
        textDecoration: "none",
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </Link>
  );
}
