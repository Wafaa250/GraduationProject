import { useEffect, useState } from "react";
import { Building2, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { getCompanyProfile, type CompanyProfile } from "@/api/companyApi";

export function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCompanyProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile({
            id: 0,
            userId: Number(localStorage.getItem("userId") ?? 0),
            companyName: localStorage.getItem("name") ?? "Your company",
            industry: null,
            description: null,
            location: null,
            websiteUrl: null,
            linkedInUrl: null,
            email: localStorage.getItem("email") ?? "",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = profile?.companyName ?? "Company";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto">
      <CompanyPageHeader
        title="Company Profile"
        subtitle="Information collected during onboarding — used by SkillSwap AI for matching. No need to re-enter here."
      />

      {loading ? (
        <Card className="cw-card-elevated">
          <CardContent className="p-12 text-center text-muted-foreground">Loading profile…</CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="cw-card-elevated lg:col-span-2 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="p-6 -mt-12">
              <div className="flex items-end gap-4 flex-wrap">
                <Avatar className="h-20 w-20 ring-4 ring-card">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    {name}
                  </h2>
                  <div className="text-sm text-muted-foreground mt-1">
                    {[profile?.industry, profile?.location].filter(Boolean).join(" · ") ||
                      "Profile from registration"}
                  </div>
                </div>
                <Badge className="cw-status-active">Onboarded</Badge>
              </div>
              {profile?.description && (
                <p className="mt-4 text-sm text-muted-foreground">{profile.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                {profile?.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {profile?.linkedInUrl && (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="cw-ai-panel border-0 text-white">
            <CardContent className="p-6">
              <Sparkles className="h-6 w-6 mb-3" />
              <h3 className="font-semibold">How AI uses this profile</h3>
              <p className="text-sm opacity-90 mt-2">
                SkillSwap uses your industry, focus, and collaboration interests from signup to rank
                students and teams — not for job screening.
              </p>
              <p className="text-xs opacity-75 mt-4">
                To update company details, contact support or complete a profile refresh when
                available in Settings.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
