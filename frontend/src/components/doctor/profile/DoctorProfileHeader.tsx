import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/paths";
import { initialsFromName } from "@/lib/doctorHubMappers";

type DoctorProfileHeaderProps = {
  name: string;
  email: string;
  faculty: string;
  department: string;
  specialization: string;
  photoUrl: string | null;
};

export function DoctorProfileHeader({
  name,
  email,
  faculty,
  department,
  specialization,
  photoUrl,
}: DoctorProfileHeaderProps) {
  const initials = initialsFromName(name || "?");

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24 shrink-0 ring-2 ring-primary/15">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback className="bg-gradient-primary text-xl font-bold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {name || "—"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{email || "—"}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <MetaItem label="Faculty" value={faculty} />
                <MetaItem label="Department" value={department} />
                <MetaItem label="Specialization" value={specialization} className="sm:col-span-2" />
              </dl>
            </div>
            <Button asChild className="shrink-0">
              <Link to={ROUTES.doctorEditProfile}>
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const text = value.trim();
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={text ? "mt-0.5 font-medium text-foreground" : "mt-0.5 italic text-muted-foreground"}>
        {text || "Not provided"}
      </dd>
    </div>
  );
}
