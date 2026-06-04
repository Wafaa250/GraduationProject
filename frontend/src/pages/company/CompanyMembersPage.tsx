import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CompanyLuxHero,
  CompanyLuxPanel,
  CompanyLuxStat,
} from "@/components/company/CompanyPremiumUI";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanySkeleton } from "@/components/company/CompanySkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  addCompanyMember,
  listCompanyMembers,
  parseApiErrorMessage,
  removeCompanyMember,
  type CompanyMember,
} from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { formatCompanyRole, isCompanyOwner } from "@/lib/companyWorkspace";

function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InviteFormField({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cw-members-field">
      <Label htmlFor={id} className="cw-members-field-label">
        {label}
      </Label>
      <div className="cw-members-field-control">{children}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isOwnerRole = role === "owner";

  if (isOwnerRole) {
    return (
      <Badge className="cw-members-owner-badge border-0 shrink-0">
        <Crown className="h-3 w-3 mr-1" aria-hidden />
        {formatCompanyRole(role)}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-lg shrink-0 font-medium">
      {formatCompanyRole(role)}
    </Badge>
  );
}

function MemberRow({
  member,
  isSelf,
  removing,
  onRemove,
}: {
  member: CompanyMember;
  isSelf: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  const isOwnerRow = member.role === "owner";

  return (
    <div
      className={cn("cw-members-row group", isOwnerRow && "cw-members-row--owner")}
    >
      <Avatar
        className={cn(
          "cw-members-avatar",
          isOwnerRow && "cw-members-avatar--owner",
        )}
      >
        <AvatarFallback
          className={cn(
            "rounded-xl text-sm font-semibold",
            isOwnerRow ? "cw-avatar-gradient" : "bg-muted text-foreground",
          )}
        >
          {memberInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="cw-members-row-main">
        <div className="flex flex-wrap items-center gap-2">
          <p className="cw-members-row-name">{member.name}</p>
          {isSelf ? (
            <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0 h-5 shrink-0">
              You
            </Badge>
          ) : null}
        </div>
        <p className="cw-members-row-email">{member.email}</p>
      </div>

      <div className="cw-members-row-actions">
        <RoleBadge role={member.role} />
        {!isSelf ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cw-members-remove-btn"
            disabled={removing}
            onClick={onRemove}
            aria-label={`Remove ${member.name}`}
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="cw-members-remove-spacer" aria-hidden />
        )}
      </div>
    </div>
  );
}

function MembersEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="cw-members-empty">
      <div className="cw-team-state-icon cw-members-empty-icon">
        <Users className="h-8 w-8" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">No members yet</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
        Invite teammates to share access to project requests, recommendations, and workspace
        settings.
      </p>
      <Button
        type="button"
        className="rounded-lg cw-btn-gradient border-0 shadow-sm h-10"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add your first member
      </Button>
    </div>
  );
}

function MembersListSkeleton() {
  return (
    <div className="cw-members-list" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <CompanySkeleton key={i} className="cw-members-row-skeleton" />
      ))}
    </div>
  );
}

export function CompanyMembersPage() {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");
  const [addedMemberEmail, setAddedMemberEmail] = useState<string | null>(null);
  const [credentialsEmailed, setCredentialsEmailed] = useState(false);

  const currentUserId = Number(localStorage.getItem("userId") ?? "0");
  const memberCount = members.length;

  useEffect(() => {
    let cancelled = false;
    listCompanyMembers()
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch((err) => {
        if (!cancelled) toast.error(parseApiErrorMessage(err) || "Failed to load members.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isCompanyOwner()) {
    return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  }

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setRole("member");
    setAddedMemberEmail(null);
    setCredentialsEmailed(false);
    setShowForm(false);
  };

  const onAddMember = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await addCompanyMember({ fullName, email, role });
      setMembers((prev) =>
        [...prev, result.member].sort((a, b) => {
          if (a.role === b.role) return a.name.localeCompare(b.name);
          return a.role === "owner" ? -1 : 1;
        }),
      );
      if (result.credentialsEmailSent) {
        setAddedMemberEmail(result.member.email);
        setCredentialsEmailed(true);
        toast.success("Member added. Login credentials were emailed.");
      } else {
        resetForm();
        toast.success("Existing user linked to this workspace.");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (member: CompanyMember) => {
    if (member.userId === currentUserId) return;
    setRemovingId(member.id);
    try {
      await removeCompanyMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Member removed.");
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <CompanyPageShell className="cw-members-page">
      <CompanyLuxHero
        eyebrow="Workspace access"
        title="Company Members"
        description="Invite teammates, assign roles, and control who runs hiring in your SkillSwap workspace."
        aside={
          !loading ? (
            <div className="cw-members-hero-stat">
              <CompanyLuxStat
                label="Members"
                value={memberCount}
                icon={Users}
                simple
              />
            </div>
          ) : undefined
        }
      />

      <CompanyLuxPanel
        title="Workspace access"
        description="Everyone listed here can sign in and collaborate within your company workspace."
        action={
          !showForm && memberCount > 0 ? (
            <Button
              type="button"
              className="rounded-lg h-9 cw-btn-gradient border-0 shadow-sm"
              onClick={() => setShowForm(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add member
            </Button>
          ) : undefined
        }
        className="cw-members-panel"
      >
        {showForm ? (
          <div className="cw-members-invite-panel">
            <div className="cw-members-invite-panel-head">
              <div>
                <p className="cw-lux-eyebrow">Invite</p>
                <h3 className="cw-members-invite-title">Add workspace member</h3>
                <p className="cw-members-invite-desc">
                  New users receive login credentials by email and must set a personal password on
                  first sign-in.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
                onClick={resetForm}
                aria-label="Close add member form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {credentialsEmailed && addedMemberEmail ? (
              <div className="cw-members-invite-form">
                <div className="cw-invite-success-panel cw-members-success-messages">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--cw-accent))] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">Member added successfully.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--cw-accent))] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                      Login credentials were sent to the member&apos;s email.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-[hsl(var(--cw-accent))]" />
                  <span>
                    Email sent to:{" "}
                    <a href={`mailto:${addedMemberEmail}`} className="cw-members-email-link">
                      {addedMemberEmail}
                    </a>
                  </span>
                </div>
                <div className="cw-members-invite-actions cw-members-invite-actions--solo">
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg cw-btn-gradient border-0 h-10"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onAddMember} className="cw-members-invite-form">
                <div className="cw-members-invite-fields">
                  <InviteFormField id="member-name" label="Full name">
                    <Input
                      id="member-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="cw-wizard-input cw-members-input"
                      required
                    />
                  </InviteFormField>
                  <InviteFormField id="member-email" label="Email">
                    <Input
                      id="member-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="cw-wizard-input cw-members-input"
                      required
                    />
                  </InviteFormField>
                  <InviteFormField label="Role">
                    <Select value={role} onValueChange={(v) => setRole(v as "owner" | "member")}>
                      <SelectTrigger className="cw-wizard-input cw-members-input h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="cw-select-popover">
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </InviteFormField>
                </div>
                <div className="cw-members-invite-actions">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg h-10 px-4"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg cw-btn-gradient border-0 shadow-sm h-10 px-5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding…
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add member
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        <div className={cn("cw-members-panel-content", showForm && "cw-members-panel-content--with-invite")}>
          {loading ? (
            <MembersListSkeleton />
          ) : memberCount === 0 && !showForm ? (
            <MembersEmptyState onAdd={() => setShowForm(true)} />
          ) : memberCount === 0 && showForm ? null : (
            <div className="cw-members-list">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelf={member.userId === currentUserId}
                  removing={removingId === member.id}
                  onRemove={() => onRemove(member)}
                />
              ))}
            </div>
          )}
        </div>
      </CompanyLuxPanel>
    </CompanyPageShell>
  );
}
