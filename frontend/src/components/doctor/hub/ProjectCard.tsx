import { Link } from "react-router-dom";
import { Users, ArrowUpRight, LogOut } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { doctorProjectChatPath, doctorProjectPath } from "@/routes/paths";
import type { DoctorHubProjectCardModel } from "@/lib/doctorHubMappers";

type ProjectCardProps = {
  p: DoctorHubProjectCardModel;
  onResign?: (projectId: number) => void;
  resigning?: boolean;
};

export function ProjectCard({ p, onResign, resigning }: ProjectCardProps) {
  const projectId = Number(p.id);

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-smooth flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">
            {p.category}
          </div>
          <h3 className="mt-1 font-display text-[16px] font-bold text-foreground leading-snug">
            {p.title}
          </h3>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {p.members.slice(0, 4).map((m, i) => (
            <div
              key={i}
              title={m.name}
              className="h-7 w-7 rounded-full ring-2 ring-white bg-secondary grid place-items-center text-[10px] font-semibold text-foreground"
            >
              {m.initials}
            </div>
          ))}
          {p.memberCount > p.members.length && (
            <div className="h-7 w-7 rounded-full ring-2 ring-white bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground">
              +{p.memberCount - p.members.length}
            </div>
          )}
        </div>
        <div className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {p.memberCount} members
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11.5px] text-muted-foreground">{p.updated}</span>
        <div className="flex items-center gap-1.5">
          <Link
            to={doctorProjectChatPath(projectId)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold px-3.5 py-2 border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-smooth"
          >
            Team Chat
          </Link>
          <Link
            to={doctorProjectPath(projectId)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold px-3.5 py-2 bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 transition-smooth"
          >
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          {onResign && (
            <ActionButton
              variant="danger"
              type="button"
              disabled={resigning}
              onClick={() => onResign(projectId)}
            >
              <LogOut className="h-3.5 w-3.5" /> Resign
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
