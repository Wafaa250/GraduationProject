import type { FormEvent, KeyboardEvent } from "react";
import { Building2, ExternalLink, Globe, Linkedin, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CompanyLuxHero } from "@/components/company/CompanyPremiumUI";
import { cwLayout } from "@/lib/companyLayout";
import type { CompanyProfile } from "@/api/companyApi";
import type { CompanyProfileMode } from "@/components/company/companyProfileTypes";
import {
  COMPANY_PROFILE_OWNER_DESCRIPTION,
  COMPANY_PROFILE_WORKSPACE_NOTE,
} from "@/lib/companyWorkspaceCopy";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
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
      {href ? (
        <Button asChild size="sm" variant="outline" className="rounded-xl shrink-0 h-8">
          <a href={href} target="_blank" rel="noopener noreferrer">
            Open <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="cw-form-label mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

type FormState = {
  companyName: string;
  about: string;
  industry: string;
  website: string;
  headquartersLocation: string;
  workingStyle: string;
  contactEmail: string;
  linkedInUrl: string;
  optionalContactLink: string;
  areasOfInterest: string[];
};

type Props = {
  mode: CompanyProfileMode;
  profile: CompanyProfile | null;
  loading: boolean;
  loadError: string | null;
  saving: boolean;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  newInterest: string;
  setNewInterest: (value: string) => void;
  canEditProfile: boolean;
  hasUnsavedChanges: boolean;
  addInterest: () => void;
  removeInterest: (tag: string) => void;
  onSave: (e: FormEvent) => void;
};

export function CompanyProfileContent({
  mode,
  profile,
  loading,
  loadError,
  saving,
  form,
  setForm,
  newInterest,
  setNewInterest,
  canEditProfile,
  hasUnsavedChanges,
  addInterest,
  removeInterest,
  onSave,
}: Props) {
  const name = form.companyName || profile?.companyName || "Company";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onInterestKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <>
      <CompanyLuxHero
        eyebrow="Company workspace"
        title="Company Profile"
        description={
          canEditProfile
            ? COMPANY_PROFILE_OWNER_DESCRIPTION
            : mode === "visitor"
              ? "Company profile and contact details."
              : "Company identity and contact details. Contact your company owner to request changes."
        }
      />

      {loading ? (
        <Card className="cw-card-elevated">
          <CardContent className="p-12 text-center text-muted-foreground">Loading profile…</CardContent>
        </Card>
      ) : loadError ? (
        <Card className="cw-card-elevated">
          <CardContent className="p-12 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid lg:grid-cols-3 items-start", cwLayout.grid)}>
          <Card className="cw-card-elevated lg:col-span-2 overflow-hidden">
            <div className="relative h-28 overflow-hidden">
              <div className="cw-lux-hero-mesh absolute inset-0 opacity-90" aria-hidden />
              <div className="cw-lux-hero-grid absolute inset-0 opacity-40" aria-hidden />
            </div>

            <CardContent className="relative z-10 bg-card p-6 pt-0">
              <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10">
                <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-card shadow-lg shrink-0">
                  <AvatarFallback className="rounded-2xl cw-avatar-gradient text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 md:pb-1">
                  <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary shrink-0" />
                    <span className="truncate">{name}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[form.industry, form.headquartersLocation].filter(Boolean).join(" · ") ||
                      "Profile from registration"}
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={onSave}>
                <Field label="Company name">
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Enter company name"
                    disabled={!canEditProfile}
                    readOnly={!canEditProfile}
                  />
                </Field>

                <Field label="About">
                  <Textarea
                    value={form.about}
                    onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
                    rows={4}
                    className="rounded-xl resize-none"
                    placeholder="Company description"
                    disabled={!canEditProfile}
                    readOnly={!canEditProfile}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Industry">
                    <Input
                      value={form.industry}
                      onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                      className="rounded-xl"
                      placeholder="No industry specified"
                      disabled={!canEditProfile}
                      readOnly={!canEditProfile}
                    />
                  </Field>
                  <Field label="Headquarters / location">
                    <Input
                      value={form.headquartersLocation}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, headquartersLocation: e.target.value }))
                      }
                      className="rounded-xl"
                      placeholder="No headquarters specified"
                      disabled={!canEditProfile}
                      readOnly={!canEditProfile}
                    />
                  </Field>
                  <Field label="Working style">
                    <Input
                      value={form.workingStyle}
                      onChange={(e) => setForm((prev) => ({ ...prev, workingStyle: e.target.value }))}
                      className="rounded-xl"
                      placeholder="No working style specified"
                      disabled={!canEditProfile}
                      readOnly={!canEditProfile}
                    />
                  </Field>
                </div>

                <div>
                  <Label className="cw-form-label mb-1.5 block">Areas of interest</Label>
                  <div className="space-y-2.5">
                    {canEditProfile ? (
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={onInterestKeyDown}
                        onBlur={addInterest}
                        className="rounded-xl"
                        placeholder="Type an area and press Enter (e.g. AI, Web Development)"
                      />
                    ) : null}
                    {form.areasOfInterest.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {form.areasOfInterest.map((tag) => (
                          <Badge
                            key={tag}
                            className={cn(
                              "cw-request-skill-badge rounded-md",
                              canEditProfile && "cursor-pointer hover:bg-primary/15",
                            )}
                            title={canEditProfile ? "Click to remove" : undefined}
                            onClick={canEditProfile ? () => removeInterest(tag) : undefined}
                          >
                            {tag} {canEditProfile ? "×" : ""}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No focus areas specified.</p>
                    )}
                  </div>
                </div>

                {canEditProfile ? (
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      className="rounded-xl cw-btn-gradient border-0 shadow-sm"
                      disabled={saving || !hasUnsavedChanges}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="cw-card-elevated">
            <CardContent className="space-y-4 text-sm pt-6">
              <Field label="LinkedIn">
                <Input
                  value={form.linkedInUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkedInUrl: e.target.value }))}
                  className="rounded-xl"
                  placeholder="No LinkedIn specified"
                  disabled={!canEditProfile}
                  readOnly={!canEditProfile}
                />
              </Field>

              <Field label="Optional contact link">
                <Input
                  value={form.optionalContactLink}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, optionalContactLink: e.target.value }))
                  }
                  className="rounded-xl"
                  placeholder="No contact link specified"
                  disabled={!canEditProfile}
                  readOnly={!canEditProfile}
                />
              </Field>

              <div className="space-y-2">
                <InfoRow
                  icon={Mail}
                  label="Published contact email"
                  value={form.contactEmail || "No contact email specified"}
                />
                {form.website ? (
                  <InfoRow
                    icon={Globe}
                    label="Published website"
                    value={form.website.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(form.website)}
                  />
                ) : null}
                {form.linkedInUrl ? (
                  <InfoRow
                    icon={Linkedin}
                    label="Published LinkedIn"
                    value={form.linkedInUrl.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(form.linkedInUrl)}
                  />
                ) : null}
                {form.optionalContactLink ? (
                  <InfoRow
                    icon={ExternalLink}
                    label="Published contact link"
                    value={form.optionalContactLink.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(form.optionalContactLink)}
                  />
                ) : null}
              </div>

              <div className="rounded-xl cw-insight-panel px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                {COMPANY_PROFILE_WORKSPACE_NOTE}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
