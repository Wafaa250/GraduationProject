import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, MapPin, Wifi } from "lucide-react";
import {
  getPublicOrganizationProfile,
  type PublicOrganizationProfile,
} from "@/api/organizationsPublicApi";
import { resolveApiFileUrl, parseApiErrorMessage } from "@/api/axiosInstance";
import { ASSOCIATION_ROUTES, ROUTES } from "@/routes/paths";
import { AssociationProfileHeader } from "@/components/association/AssociationProfileHeader";
import { SocialLinksList } from "@/components/association/SocialLinksList";
import { LeadershipProfileCard } from "@/components/association/LeadershipProfileCard";
import { formatEventDate } from "@/pages/association/events/eventFormUtils";
import type { StudentAssociationProfile } from "@/api/associationApi";
import "@/styles/association-profile.css";

export default function OrganizationPublicProfilePage() {
  const { organizationId: idParam } = useParams<{ organizationId: string }>();
  const organizationId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<PublicOrganizationProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(organizationId)) return;
    setLoading(true);
    void getPublicOrganizationProfile(organizationId)
      .then((data) => {
        setOrg(data);
        setError(null);
      })
      .catch((err) => {
        setOrg(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  const headerProfile = useMemo((): StudentAssociationProfile | null => {
    if (!org) return null;
    return {
      id: org.organizationId,
      userId: 0,
      role: "studentassociation",
      associationName: org.organizationName,
      username: org.organizationName.replace(/\s+/g, "").slice(0, 24).toLowerCase() || "org",
      email: "",
      description: org.description ?? null,
      faculty: org.faculty ?? "",
      category: org.category ?? "",
      logoUrl: org.logoUrl ?? null,
      instagramUrl: org.instagramUrl ?? null,
      facebookUrl: org.facebookUrl ?? null,
      linkedInUrl: org.linkedInUrl ?? null,
      isVerified: org.isVerified,
      createdAt: org.createdAt,
    };
  }, [org]);

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Communication Hub
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !org || !headerProfile ? (
        <p className="text-sm text-muted-foreground">{error ?? "Organization not found."}</p>
      ) : (
        <div className="assoc-profile-page mx-auto max-w-3xl space-y-6">
          <AssociationProfileHeader profile={headerProfile} />

          <p className="text-sm text-muted-foreground">
            {org.followersCount} follower{org.followersCount === 1 ? "" : "s"}
          </p>

          {org.description ? (
            <section className="hub-card p-5">
              <h2 className="font-display text-lg font-bold">About</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{org.description}</p>
            </section>
          ) : null}

          <SocialLinksList
            instagramUrl={org.instagramUrl}
            facebookUrl={org.facebookUrl}
            linkedInUrl={org.linkedInUrl}
          />

          {org.leadershipTeam.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-bold">Leadership board</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {org.leadershipTeam.map((member) => (
                  <LeadershipProfileCard
                    key={member.id}
                    fullName={member.fullName}
                    roleTitle={member.roleTitle}
                    major={member.major}
                    imageUrl={member.imageUrl}
                    linkedInUrl={member.linkedInUrl}
                    organizationName={org.organizationName}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {org.upcomingEvents.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-bold">Upcoming events</h2>
              <ul className="mt-3 space-y-3">
                {org.upcomingEvents.map((event) => {
                  const cover = event.coverImageUrl
                    ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
                    : null;
                  const eventPath = `${ASSOCIATION_ROUTES.eventDetail(event.id)}?orgId=${organizationId}`;
                  return (
                    <li key={event.id}>
                      <Link
                        to={eventPath}
                        className="hub-card flex gap-4 overflow-hidden p-0 transition hover:border-primary/40"
                      >
                        {cover ? (
                          <img src={cover} alt="" className="h-24 w-28 shrink-0 object-cover" />
                        ) : (
                          <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-muted text-xs text-muted-foreground">
                            Event
                          </div>
                        )}
                        <div className="min-w-0 py-3 pr-4">
                          <p className="font-semibold">{event.title}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" aria-hidden />
                              {formatEventDate(event.eventDate)}
                            </span>
                            {event.isOnline ? (
                              <span className="inline-flex items-center gap-1">
                                <Wifi className="h-3.5 w-3.5" aria-hidden />
                                Online
                              </span>
                            ) : event.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                {event.location}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-primary">View Event</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {org.members.length > 0 ? (
            <section className="hub-card p-5">
              <h2 className="font-display text-lg font-bold">Members</h2>
              <ul className="mt-3 space-y-2">
                {org.members.map((m) => (
                  <li key={`${m.studentUserId}-${m.roleTitle}`} className="text-sm">
                    <span className="font-medium">{m.studentName}</span>
                    {m.roleTitle ? (
                      <span className="text-muted-foreground"> · {m.roleTitle}</span>
                    ) : null}
                    {m.major ? <span className="text-muted-foreground"> · {m.major}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
