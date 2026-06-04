import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Loader2, UserMinus } from "lucide-react";
import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getFollowing,
  unfollowCompany,
  unfollowOrganization,
  type FollowingAssociation,
  type FollowingCompany,
} from "@/api/followingApi";
import { AssociationAvatar } from "@/components/association/associationBrand";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/routes/paths";
import "@/styles/student-hub.css";
import "@/styles/student-workspace-pages.css";

type FollowingTab = "all" | "companies" | "associations";

function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function CompanyFollowingRow({
  company,
  unfollowing,
  onUnfollow,
}: {
  company: FollowingCompany;
  unfollowing: boolean;
  onUnfollow: (id: number) => void;
}) {
  const initials = companyInitials(company.name);
  const logoSrc = company.logoUrl ? resolveApiFileUrl(company.logoUrl) ?? company.logoUrl : null;
  const detail = company.industry?.trim() || "Industry not listed";
  const detailMuted = !company.industry?.trim();

  return (
    <li className="following-row">
      <div className="following-row__main">
        {logoSrc ? (
          <img src={logoSrc} alt="" className="following-row__avatar" />
        ) : (
          <div className="following-row__avatar following-row__avatar--fallback" aria-hidden>
            {initials || <Building2 className="h-5 w-5" />}
          </div>
        )}
        <div className="following-row__info">
          <p className="following-row__name">{company.name}</p>
          <p className={detailMuted ? "following-row__detail following-row__detail--muted" : "following-row__detail"}>
            {detail}
          </p>
        </div>
      </div>
      <div className="following-row__actions">
        <Button size="sm" variant="default" asChild>
          <Link
            to={ROUTES.companyPublicProfile(company.id)}
            state={{ companyName: company.name }}
          >
            View Company
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={unfollowing}
          onClick={() => onUnfollow(company.id)}
        >
          {unfollowing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <UserMinus className="h-4 w-4" aria-hidden />
          )}
          Unfollow
        </Button>
      </div>
    </li>
  );
}

function AssociationFollowingRow({
  association,
  unfollowing,
  onUnfollow,
}: {
  association: FollowingAssociation;
  unfollowing: boolean;
  onUnfollow: (id: number) => void;
}) {
  const detail = association.category?.trim() || "Category not listed";
  const detailMuted = !association.category?.trim();

  return (
    <li className="following-row">
      <div className="following-row__main">
        <AssociationAvatar
          name={association.name}
          logoUrl={association.logoUrl}
          size="sm"
          style={{ margin: 0 }}
        />
        <div className="following-row__info">
          <p className="following-row__name">{association.name}</p>
          <p className={detailMuted ? "following-row__detail following-row__detail--muted" : "following-row__detail"}>
            {detail}
          </p>
        </div>
      </div>
      <div className="following-row__actions">
        <Button size="sm" variant="default" asChild>
          <Link to={ROUTES.organizationPublicProfile(association.id)}>View Association</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={unfollowing}
          onClick={() => onUnfollow(association.id)}
        >
          {unfollowing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <UserMinus className="h-4 w-4" aria-hidden />
          )}
          Unfollow
        </Button>
      </div>
    </li>
  );
}

function FollowingList({ children }: { children: ReactNode }) {
  return <ul className="following-list">{children}</ul>;
}

function FollowingEmptyState({ tab }: { tab: FollowingTab }) {
  const message =
    tab === "companies"
      ? "You are not following any companies yet. Discover companies in the Communication Hub."
      : tab === "associations"
        ? "You are not following any associations yet. Discover associations in the Communication Hub."
        : "You are not following any organizations yet. Follow companies and associations from the Communication Hub.";

  return (
    <div className="following-empty">
      <p className="following-empty__text">{message}</p>
      <Button size="sm" className="mt-4" asChild>
        <Link to={ROUTES.communicationHub}>Go to Communication Hub</Link>
      </Button>
    </div>
  );
}

export default function FollowingPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<FollowingCompany[]>([]);
  const [associations, setAssociations] = useState<FollowingAssociation[]>([]);
  const [tab, setTab] = useState<FollowingTab>("all");
  const [unfollowingCompanyId, setUnfollowingCompanyId] = useState<number | null>(null);
  const [unfollowingAssociationId, setUnfollowingAssociationId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFollowing();
      setCompanies(data.companies);
      setAssociations(data.associations);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load following",
        description: parseApiErrorMessage(err),
      });
      setCompanies([]);
      setAssociations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = companies.length + associations.length;

  const visibleCompanies = tab === "associations" ? [] : companies;
  const visibleAssociations = tab === "companies" ? [] : associations;
  const showEmpty =
    !loading &&
    ((tab === "all" && totalCount === 0) ||
      (tab === "companies" && companies.length === 0) ||
      (tab === "associations" && associations.length === 0));

  const handleUnfollowCompany = useCallback(async (companyProfileId: number) => {
    setUnfollowingCompanyId(companyProfileId);
    try {
      await unfollowCompany(companyProfileId);
      setCompanies((prev) => prev.filter((c) => c.id !== companyProfileId));
      toast({ title: "Unfollowed company" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not unfollow",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setUnfollowingCompanyId(null);
    }
  }, []);

  const handleUnfollowAssociation = useCallback(async (organizationId: number) => {
    setUnfollowingAssociationId(organizationId);
    try {
      await unfollowOrganization(organizationId);
      setAssociations((prev) => prev.filter((a) => a.id !== organizationId));
      toast({ title: "Unfollowed association" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not unfollow",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setUnfollowingAssociationId(null);
    }
  }, []);

  const tabLabel = useMemo(
    () => ({
      all: `All (${totalCount})`,
      companies: `Companies (${companies.length})`,
      associations: `Associations (${associations.length})`,
    }),
    [totalCount, companies.length, associations.length],
  );

  const companyRows = visibleCompanies.map((company) => (
    <CompanyFollowingRow
      key={`company-${company.id}`}
      company={company}
      unfollowing={unfollowingCompanyId === company.id}
      onUnfollow={handleUnfollowCompany}
    />
  ));

  const associationRows = visibleAssociations.map((association) => (
    <AssociationFollowingRow
      key={`association-${association.id}`}
      association={association}
      unfollowing={unfollowingAssociationId === association.id}
      onUnfollow={handleUnfollowAssociation}
    />
  ));

  return (
    <div className="student-hub min-h-full px-4 py-6 sm:px-6">
      <header className="student-ws-page-header">
        <p className="student-ws-eyebrow">Connections</p>
        <h1 className="student-ws-title">My Following</h1>
        <p className="student-ws-description">Organizations and companies you follow.</p>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as FollowingTab)}
        className="following-page w-full max-w-4xl"
      >
        <TabsList className="following-tabs mb-6 h-auto flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="all" className="rounded-lg px-4">
            {tabLabel.all}
          </TabsTrigger>
          <TabsTrigger value="companies" className="rounded-lg px-4">
            {tabLabel.companies}
          </TabsTrigger>
          <TabsTrigger value="associations" className="rounded-lg px-4">
            {tabLabel.associations}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : showEmpty ? (
          <FollowingEmptyState tab={tab} />
        ) : (
          <>
            <TabsContent value="all" className="mt-0 space-y-6">
              {visibleCompanies.length > 0 ? (
                <section className="following-section">
                  <h2 className="following-section-title">Companies</h2>
                  <FollowingList>{companyRows}</FollowingList>
                </section>
              ) : null}
              {visibleAssociations.length > 0 ? (
                <section className="following-section">
                  <h2 className="following-section-title">Associations</h2>
                  <FollowingList>{associationRows}</FollowingList>
                </section>
              ) : null}
            </TabsContent>

            <TabsContent value="companies" className="mt-0">
              <FollowingList>{companyRows}</FollowingList>
            </TabsContent>

            <TabsContent value="associations" className="mt-0">
              <FollowingList>{associationRows}</FollowingList>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
