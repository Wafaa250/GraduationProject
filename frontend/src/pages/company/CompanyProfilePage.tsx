import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Building2, ExternalLink, Mail, Globe, Linkedin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import {
  getCompanyProfile,
  parseApiErrorMessage,
  updateCompanyProfile,
  type CompanyProfile,
} from "@/api/companyApi";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";

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
        <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0 h-8">
          <a href={href} target="_blank" rel="noopener noreferrer">
            Open <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [about, setAbout] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [headquartersLocation, setHeadquartersLocation] = useState("");
  const [workingStyle, setWorkingStyle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [optionalContactLink, setOptionalContactLink] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCompanyProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setLoadError(null);
        setStoredCompanyRole(data.workspaceRole ?? "owner");
        setCompanyName(data.companyName ?? "");
        setAbout(data.description ?? "");
        setIndustry(data.industry ?? "");
        setWebsite(data.websiteUrl ?? "");
        setHeadquartersLocation(data.headquartersLocation ?? data.location ?? "");
        setWorkingStyle(data.workingStyle ?? "");
        setContactEmail(data.contactEmail ?? data.email ?? "");
        setLinkedInUrl(data.linkedInUrl ?? "");
        setOptionalContactLink(data.optionalContactLink ?? "");
        setAreasOfInterest(data.areasOfInterest ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfile(null);
        setLoadError(parseApiErrorMessage(err) || "Failed to load company profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = companyName || profile?.companyName || "Company";
  const isOwner = (profile?.workspaceRole ?? "owner") === "owner";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    return (
      companyName !== (profile.companyName ?? "") ||
      about !== (profile.description ?? "") ||
      industry !== (profile.industry ?? "") ||
      website !== (profile.websiteUrl ?? "") ||
      headquartersLocation !== (profile.headquartersLocation ?? profile.location ?? "") ||
      workingStyle !== (profile.workingStyle ?? "") ||
      contactEmail !== (profile.contactEmail ?? profile.email ?? "") ||
      linkedInUrl !== (profile.linkedInUrl ?? "") ||
      optionalContactLink !== (profile.optionalContactLink ?? "") ||
      JSON.stringify(areasOfInterest) !== JSON.stringify(profile.areasOfInterest ?? [])
    );
  }, [
    about,
    areasOfInterest,
    companyName,
    contactEmail,
    headquartersLocation,
    industry,
    linkedInUrl,
    optionalContactLink,
    profile,
    website,
    workingStyle,
  ]);

  const addInterest = () => {
    const value = newInterest.trim();
    if (!value) return;
    if (areasOfInterest.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setNewInterest("");
      return;
    }
    setAreasOfInterest((prev) => [...prev, value]);
    setNewInterest("");
  };

  const removeInterest = (tag: string) => {
    setAreasOfInterest((prev) => prev.filter((x) => x !== tag));
  };

  const onInterestKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addInterest();
    }
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateCompanyProfile({
        companyName,
        description: about || null,
        industry: industry || null,
        headquartersLocation: headquartersLocation || null,
        workingStyle: workingStyle || null,
        areasOfInterest,
        websiteUrl: website || null,
        linkedInUrl: linkedInUrl || null,
        contactEmail: contactEmail || null,
        optionalContactLink: optionalContactLink || null,
      });
      setProfile(updated);
      setStoredCompanyRole(updated.workspaceRole ?? "owner");
      setCompanyName(updated.companyName ?? "");
      setAbout(updated.description ?? "");
      setIndustry(updated.industry ?? "");
      setWebsite(updated.websiteUrl ?? "");
      setHeadquartersLocation(updated.headquartersLocation ?? updated.location ?? "");
      setWorkingStyle(updated.workingStyle ?? "");
      setContactEmail(updated.contactEmail ?? updated.email ?? "");
      setLinkedInUrl(updated.linkedInUrl ?? "");
      setOptionalContactLink(updated.optionalContactLink ?? "");
      setAreasOfInterest(updated.areasOfInterest ?? []);
      toast.success("Company profile updated.");
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Company Profile"
        subtitle={
          isOwner
            ? "This is the information students see when SkillSwap recommends your company."
            : "Shared workspace profile. Contact an owner to request changes."
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
          {/* Left — main profile */}
          <Card className="cw-card-elevated lg:col-span-2 overflow-hidden">
            <div className="h-24 cw-hero-bg relative opacity-95">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10" />
            </div>

            <CardContent className="p-6 pt-0">
              <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10">
                <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-card shadow-lg shrink-0">
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 md:pb-1">
                  <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary shrink-0" />
                    <span className="truncate">{name}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[industry, headquartersLocation].filter(Boolean).join(" · ") ||
                      "Profile from registration"}
                  </p>
                </div>

                <Badge className="cw-status-active shrink-0">Onboarded</Badge>
              </div>

              <form className="mt-6 space-y-5" onSubmit={onSave}>
                <Field label="Company name">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="rounded-xl"
                    placeholder="Enter company name"
                    disabled={!isOwner}
                    readOnly={!isOwner}
                  />
                </Field>

                <Field label="About">
                  <Textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none"
                    placeholder="Describe your company and what students can expect."
                    disabled={!isOwner}
                    readOnly={!isOwner}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Industry">
                    <Input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="rounded-xl"
                      placeholder="No industry specified"
                      disabled={!isOwner}
                      readOnly={!isOwner}
                    />
                  </Field>
                  <Field label="Headquarters / location">
                    <Input
                      value={headquartersLocation}
                      onChange={(e) => setHeadquartersLocation(e.target.value)}
                      className="rounded-xl"
                      placeholder="No headquarters specified"
                      disabled={!isOwner}
                      readOnly={!isOwner}
                    />
                  </Field>
                  <Field label="Working style">
                    <Input
                      value={workingStyle}
                      onChange={(e) => setWorkingStyle(e.target.value)}
                      className="rounded-xl"
                      placeholder="No working style specified"
                      disabled={!isOwner}
                      readOnly={!isOwner}
                    />
                  </Field>
                </div>

                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Areas of interest
                  </Label>
                  <div className="space-y-2.5">
                    {isOwner ? (
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={onInterestKeyDown}
                        onBlur={addInterest}
                        className="rounded-xl"
                        placeholder="Type an area and press Enter (e.g. AI, Web Development)"
                      />
                    ) : null}
                    {areasOfInterest.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {areasOfInterest.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={cn(
                              "rounded-md bg-primary/10 text-primary border-0",
                              isOwner && "cursor-pointer hover:bg-primary/15",
                            )}
                            title={isOwner ? "Click to remove" : undefined}
                            onClick={isOwner ? () => removeInterest(tag) : undefined}
                          >
                            {tag} {isOwner ? "×" : ""}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No focus areas specified.</p>
                    )}
                  </div>
                </div>

                {isOwner ? (
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

          {/* Right — contact & visibility */}
          <Card className="cw-card-elevated">
            <CardContent className="space-y-4 text-sm pt-6">
              <Field label="LinkedIn">
                <Input
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  className="rounded-xl"
                  placeholder="No LinkedIn specified"
                  disabled={!isOwner}
                  readOnly={!isOwner}
                />
              </Field>

              <Field label="Optional contact link">
                <Input
                  value={optionalContactLink}
                  onChange={(e) => setOptionalContactLink(e.target.value)}
                  className="rounded-xl"
                  placeholder="No contact link specified"
                  disabled={!isOwner}
                  readOnly={!isOwner}
                />
              </Field>

              <div className="space-y-2">
                <InfoRow
                  icon={Mail}
                  label="Published contact email"
                  value={contactEmail || "No contact email specified"}
                />
                {website ? (
                  <InfoRow
                    icon={Globe}
                    label="Published website"
                    value={website.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(website)}
                  />
                ) : null}
                {linkedInUrl ? (
                  <InfoRow
                    icon={Linkedin}
                    label="Published LinkedIn"
                    value={linkedInUrl.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(linkedInUrl)}
                  />
                ) : null}
                {optionalContactLink ? (
                  <InfoRow
                    icon={ExternalLink}
                    label="Published contact link"
                    value={optionalContactLink.replace(/^https?:\/\//i, "")}
                    href={normalizeUrl(optionalContactLink)}
                  />
                ) : null}
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                Discovery only — SkillSwap helps students discover companies, then they contact you
                externally. No applications, pipelines, interviews, or recruitment workflows are
                managed inside the platform.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CompanyPageShell>
  );
}
