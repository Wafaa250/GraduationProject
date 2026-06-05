import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getPublicCompanyProfileDetail,
  listPublicCompanyOpportunities,
  type PublicCompanyOpportunitySummary,
  type PublicCompanyProfile,
} from "@/api/organizationsPublicApi";
import { followCompany, unfollowCompany } from "@/api/feedApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/routes/paths";
import "@/styles/student-company-profile.css";

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

type InfoItem = {
  key: string;
  label: string;
  value: string;
  href?: string;
  icon: typeof Mail;
};

export default function CompanyPublicProfilePage() {
  const { companyProfileId: idParam } = useParams<{ companyProfileId: string }>();
  const companyProfileId = Number(idParam);
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PublicCompanyOpportunitySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(companyProfileId) || companyProfileId <= 0) {
      setLoading(false);
      setError("Invalid company link.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getPublicCompanyProfileDetail(companyProfileId),
      listPublicCompanyOpportunities(companyProfileId),
    ])
      .then(([profile, opps]) => {
        if (cancelled) return;
        setCompany(profile);
        setOpportunities(opps);
        setIsFollowing(!!profile?.isFollowing);
        setError(profile ? null : "Company not found.");
      })
      .catch((err) => {
        if (cancelled) return;
        setCompany(null);
        setOpportunities([]);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyProfileId]);

  const areas = useMemo(() => {
    const raw = company?.areasOfInterest;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [company?.areasOfInterest]);

  const locationLabel =
    company?.headquartersLocation?.trim() || company?.location?.trim() || null;

  const infoItems = useMemo((): InfoItem[] => {
    if (!company) return [];
    const items: InfoItem[] = [];
    if (company.websiteUrl?.trim()) {
      items.push({
        key: "website",
        label: "Website",
        value: displayUrl(company.websiteUrl),
        href: normalizeUrl(company.websiteUrl),
        icon: Globe,
      });
    }
    if (company.linkedInUrl?.trim()) {
      items.push({
        key: "linkedin",
        label: "LinkedIn",
        value: displayUrl(company.linkedInUrl),
        href: normalizeUrl(company.linkedInUrl),
        icon: Linkedin,
      });
    }
    if (company.contactEmail?.trim()) {
      items.push({
        key: "email",
        label: "Contact email",
        value: company.contactEmail.trim(),
        href: `mailto:${company.contactEmail.trim()}`,
        icon: Mail,
      });
    }
    if (locationLabel) {
      items.push({
        key: "location",
        label: "Location",
        value: locationLabel,
        icon: MapPin,
      });
    }
    if (company.workingStyle?.trim()) {
      items.push({
        key: "working-style",
        label: "Working style",
        value: company.workingStyle.trim(),
        icon: Users,
      });
    }
    if (company.optionalContactLink?.trim()) {
      items.push({
        key: "contact-link",
        label: "Contact link",
        value: displayUrl(company.optionalContactLink),
        href: normalizeUrl(company.optionalContactLink),
        icon: Globe,
      });
    }
    return items;
  }, [company, locationLabel]);

  const toggleFollow = useCallback(async () => {
    if (followBusy || !company) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowCompany(company.id);
        setIsFollowing(false);
        toast({ title: "Unfollowed company" });
      } else {
        await followCompany(company.id);
        setIsFollowing(true);
        toast({ title: "Now following company" });
      }
    } catch (err) {
      toast({
        title: "Could not update follow",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setFollowBusy(false);
    }
  }, [company, followBusy, isFollowing]);

  const backState = location.state as { fromOpportunity?: boolean } | null;
  const backLabel = backState?.fromOpportunity
    ? "Back to opportunity"
    : "Back to Communication Hub";
  const backTo = backState?.fromOpportunity
    ? -1
    : ROUTES.communicationHub;

  const initials = companyInitials(company?.companyName ?? "");

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6 lg:px-8">
      {typeof backTo === "number" ? (
        <button type="button" onClick={() => navigate(-1)} className="company-public-profile__back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </button>
      ) : (
        <Link to={backTo} className="company-public-profile__back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !company ? (
        <p className="text-sm text-muted-foreground">{error ?? "Company not found."}</p>
      ) : (
        <div className="company-public-profile">
          <section className="company-public-profile__card">
            <div className="company-public-profile__header">
              <div className="company-public-profile__identity">
                <div className="company-public-profile__avatar" aria-hidden>
                  {initials || <Building2 className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <h1 className="company-public-profile__name">{company.companyName}</h1>
                  {company.industry ? (
                    <span className="company-public-profile__badge">{company.industry}</span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className={`company-public-profile__follow${
                  isFollowing ? " company-public-profile__follow--active" : ""
                }`}
                disabled={followBusy}
                aria-pressed={isFollowing}
                onClick={() => void toggleFollow()}
              >
                {!isFollowing ? <UserPlus className="h-4 w-4" aria-hidden /> : null}
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          </section>

          <section className="company-public-profile__card">
            <h2 className="company-public-profile__section-title">About</h2>
            {company.description?.trim() ? (
              <p className="company-public-profile__about">{company.description}</p>
            ) : (
              <p className="company-public-profile__about company-public-profile__about--empty">
                No company description provided yet.
              </p>
            )}
            {areas.length > 0 ? (
              <div className="company-public-profile__tags" aria-label="Areas of interest">
                {areas.map((area) => (
                  <span key={area} className="company-public-profile__tag">
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {infoItems.length > 0 ? (
            <section className="company-public-profile__card">
              <h2 className="company-public-profile__section-title">Information</h2>
              <div className="company-public-profile__info-grid">
                {infoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="company-public-profile__info-row">
                      <span className="company-public-profile__info-icon">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="company-public-profile__info-label">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                            rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                            className="company-public-profile__info-value company-public-profile__info-link"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="company-public-profile__info-value">{item.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="company-public-profile__card">
            <h2 className="company-public-profile__section-title">Active opportunities</h2>
            {opportunities.length === 0 ? (
              <p className="company-public-profile__empty">
                No published opportunities at the moment.
              </p>
            ) : (
              <div className="company-public-profile__opportunities">
                {opportunities.map((opp) => {
                  const meta = [opp.category, opp.collaborationFormat, opp.durationLabel]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <article key={opp.id} className="company-public-profile__opportunity">
                      <div className="min-w-0">
                        <h3 className="company-public-profile__opportunity-title">{opp.title}</h3>
                        {meta ? (
                          <p className="company-public-profile__opportunity-meta">{meta}</p>
                        ) : null}
                      </div>
                      <Link
                        to={ROUTES.companyOpportunityDetail(company.id, opp.id)}
                        className="company-public-profile__opportunity-cta"
                      >
                        View Opportunity
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
