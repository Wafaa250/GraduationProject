import { Link2, Share2 } from "lucide-react";
import { SocialLinksList } from "@/components/association/SocialLinksList";
import type { StudentAssociationProfile } from "@/api/associationApi";
import { assocCard } from "@/pages/association/dashboard/associationDashTokens";

type Props = {
  profile: StudentAssociationProfile;
  followersCount?: number;
};

export function AssociationProfileReadOnlyView({ profile, followersCount }: Props) {
  const about = profile.description?.trim();
  const hasSocial =
    !!profile.instagramUrl?.trim() ||
    !!profile.facebookUrl?.trim() ||
    !!profile.linkedInUrl?.trim();

  return (
    <div className="assoc-profile-view-stack">
      {typeof followersCount === "number" ? (
        <p className="assoc-profile-followers" style={{ margin: "0 0 4px", fontSize: 14 }}>
          {followersCount} follower{followersCount === 1 ? "" : "s"}
        </p>
      ) : null}

      <section className="assoc-profile-view-card" style={assocCard}>
        <SectionHeader icon={<Share2 size={17} strokeWidth={2} />} title="About" />
        <p className={`assoc-profile-about${about ? "" : " assoc-profile-about--empty"}`}>
          {about || "No description provided yet."}
        </p>
        <dl className="assoc-profile-meta-grid">
          <MetaItem label="Faculty" value={profile.faculty?.trim() || "—"} />
          <MetaItem label="Category" value={profile.category?.trim() || "—"} />
        </dl>
      </section>

      <section className="assoc-profile-view-card" style={assocCard}>
        <SectionHeader icon={<Link2 size={17} strokeWidth={2} />} title="Social links" />
        {hasSocial ? (
          <div className="assoc-profile-social-wrap">
            <SocialLinksList
              instagramUrl={profile.instagramUrl}
              facebookUrl={profile.facebookUrl}
              linkedInUrl={profile.linkedInUrl}
            />
          </div>
        ) : (
          <p className="assoc-profile-about assoc-profile-about--empty" style={{ margin: 0 }}>
            No social links published yet.
          </p>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="assoc-profile-section-head">
      {icon ? <span className="assoc-profile-section-head__icon">{icon}</span> : null}
      <div>
        <h2 className="assoc-profile-section-head__title">{title}</h2>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="assoc-profile-meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
