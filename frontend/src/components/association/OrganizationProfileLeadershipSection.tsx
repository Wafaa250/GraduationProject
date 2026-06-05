import { Link } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { LeadershipProfileCard } from "@/components/association/LeadershipProfileCard";
import { ASSOCIATION_ROUTES } from "@/routes/paths";
import { assocCard, assocDash } from "@/pages/association/dashboard/associationDashTokens";
import type { OrganizationProfileMode } from "./organizationProfileTypes";

export type OrganizationProfileLeadershipMember = {
  id: number;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
};

type Props = {
  mode: OrganizationProfileMode;
  organizationName: string;
  members: OrganizationProfileLeadershipMember[];
  loading: boolean;
};

export function OrganizationProfileLeadershipSection({
  mode,
  organizationName,
  members,
  loading,
}: Props) {
  const isOwner = mode === "owner";

  if (!loading && members.length === 0) {
    return (
      <section className="assoc-profile-view-card" style={assocCard}>
        <h2 className="assoc-profile-section-head__title" style={{ margin: "0 0 8px" }}>
          Leadership board
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>
          {isOwner
            ? "Add leadership members to showcase your team on your public profile."
            : "No leadership board published yet."}
        </p>
        {isOwner ? (
          <Link
            to={ASSOCIATION_ROUTES.leadership}
            className="assoc-profile-btn assoc-profile-btn--primary"
            style={{ marginTop: 16, display: "inline-flex" }}
          >
            <UsersRound size={15} strokeWidth={2.25} aria-hidden />
            Manage leadership board
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: assocDash.fontDisplay,
            color: assocDash.text,
          }}
        >
          Leadership board
        </h2>
        {isOwner ? (
          <Link
            to={ASSOCIATION_ROUTES.leadership}
            className="assoc-profile-btn assoc-profile-btn--ghost"
            style={{ display: "inline-flex" }}
          >
            <UsersRound size={15} strokeWidth={2.25} aria-hidden />
            Manage board
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: assocDash.muted }}>Loading leadership…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {members.map((member) => (
            <LeadershipProfileCard
              key={member.id}
              fullName={member.fullName}
              roleTitle={member.roleTitle}
              major={member.major}
              imageUrl={member.imageUrl}
              linkedInUrl={member.linkedInUrl}
              organizationName={organizationName}
              preview={mode === "visitor"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
