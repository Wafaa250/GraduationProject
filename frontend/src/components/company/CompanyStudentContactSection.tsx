import { ExternalLink, Mail, Github, Globe, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentDiscoveryContact } from "@/types/studentDiscoveryContact";

type Props = {
  contact: StudentDiscoveryContact;
  compact?: boolean;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 bg-background/40">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-sm truncate">{value}</p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0 h-8">
        <a href={href} target="_blank" rel="noopener noreferrer">
          Open <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </Button>
    </div>
  );
}

export function CompanyStudentContactSection({ contact, compact = false }: Props) {
  const email = contact.email?.trim();
  const linkedin = contact.linkedin?.trim();
  const github = contact.github?.trim();
  const portfolio = contact.portfolio?.trim();

  const hasAny = Boolean(email || linkedin || github || portfolio);

  if (!hasAny) {
    return (
      <div
        className={
          compact
            ? "text-xs text-muted-foreground"
            : "rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground"
        }
      >
        No contact links on this profile yet. Check back after the student completes their profile.
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Reach out directly — SkillSwap facilitates discovery; conversations happen outside the
          platform.
        </p>
      )}
      {email && (
        <ContactRow
          icon={Mail}
          label="Email"
          value={email}
          href={`mailto:${email}`}
        />
      )}
      {linkedin && (
        <ContactRow
          icon={Linkedin}
          label="LinkedIn"
          value={linkedin.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(linkedin)}
        />
      )}
      {github && (
        <ContactRow
          icon={Github}
          label="GitHub"
          value={github.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(github)}
        />
      )}
      {portfolio && (
        <ContactRow
          icon={Globe}
          label="Portfolio"
          value={portfolio.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(portfolio)}
        />
      )}
    </div>
  );
}
