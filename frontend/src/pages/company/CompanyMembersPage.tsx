import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Building2,
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
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
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
  className,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="cw-card-elevated overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-6 md:p-7 border-b border-border/60 bg-muted/20">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl cw-btn-gradient shrink-0 mt-0.5">
            <Icon className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight text-foreground leading-snug">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-lg leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0 self-start">{action}</div> : null}
      </div>
      <div className="p-6 md:p-7">{children}</div>
    </section>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isOwner = role === "owner";

  if (isOwner) {
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
  const isOwner = member.role === "owner";

  return (
    <div
      className={cn(
        "cw-members-row group flex items-center gap-4 rounded-xl border px-4 py-4 transition-colors",
        isOwner
          ? "border-primary/15 bg-gradient-to-r from-primary/[0.04] to-transparent"
          : "border-border/60 bg-card hover:bg-muted/30",
      )}
    >
      <Avatar
        className={cn(
          "h-12 w-12 rounded-xl shrink-0 ring-2 ring-background shadow-sm",
          isOwner && "ring-primary/20",
        )}
      >
        <AvatarFallback
          className={cn(
            "rounded-xl text-sm font-semibold",
            isOwner
              ? "bg-gradient-to-br from-primary to-accent text-white"
              : "bg-muted text-foreground",
          )}
        >
          {memberInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground truncate">{member.name}</p>
          {isSelf ? (
            <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0 h-5 shrink-0">
              You
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">{member.email}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <RoleBadge role={member.role} />
        {!isSelf ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
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
          <span className="hidden sm:block w-9" aria-hidden />
        )}
      </div>
    </div>
  );
}

function MembersEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="cw-members-empty py-12 px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Users className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold tracking-tight">No members yet</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
        Invite teammates to share access to project requests, recommendations, and workspace
        settings.
      </p>
      <Button
        type="button"
        className="mt-6 rounded-xl cw-btn-gradient border-0 shadow-sm"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add your first member
      </Button>
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
    <CompanyPageShell>
      {/* Hero — matches Settings */}
      <div className={cwLayout.hero}>
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/10">
              <Users className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 mb-3">
                <Building2 className="h-3 w-3 mr-1.5" />
                Company Workspace
              </Badge>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                Company Members
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
                Manage who can access your shared company workspace.
              </p>
            </div>
          </div>
          {!showForm && (
            <Button
              type="button"
              size="lg"
              className="rounded-xl cw-btn-gradient border-0 shadow-sm shrink-0"
              onClick={() => setShowForm(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Add member */}
      {showForm ? (
        <SectionCard
          icon={UserPlus}
          eyebrow="Invite"
          title="Add workspace member"
          description="New users receive login credentials by email and must set a personal password on first sign-in."
          action={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg shrink-0"
              onClick={resetForm}
              aria-label="Close add member form"
            >
              <X className="h-4 w-4" />
            </Button>
          }
        >
          {credentialsEmailed && addedMemberEmail ? (
            <div className="cw-members-invite-form max-w-2xl">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm font-medium">Member added successfully.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm font-medium">
                    Login credentials were sent to the member&apos;s email.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Email sent to:{" "}
                  <a
                    href={`mailto:${addedMemberEmail}`}
                    className="text-foreground font-medium hover:text-primary transition-colors"
                  >
                    {addedMemberEmail}
                  </a>
                </span>
              </div>
              <Button type="button" onClick={resetForm} className="rounded-xl cw-btn-gradient border-0">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={onAddMember} className="cw-members-invite-form">
              <div className={cn("grid sm:grid-cols-2", cwLayout.grid)}>
                <InviteFormField id="member-name" label="Full name">
                  <Input
                    id="member-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-lg h-11 w-full border-border/70"
                    required
                  />
                </InviteFormField>
                <InviteFormField id="member-email" label="Email">
                  <Input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg h-11 w-full border-border/70"
                    required
                  />
                </InviteFormField>
                <InviteFormField label="Role">
                  <Select value={role} onValueChange={(v) => setRole(v as "owner" | "member")}>
                    <SelectTrigger className="rounded-lg h-11 w-full border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </InviteFormField>
              </div>

              <div className="cw-members-invite-actions">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-4" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl cw-btn-gradient border-0 shadow-sm h-10 px-5"
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
        </SectionCard>
      ) : null}

      {/* Member list */}
      <SectionCard
        icon={Users}
        eyebrow="Team"
        title="Workspace access"
        description="Everyone listed here can sign in and collaborate within your company workspace."
        action={
          !showForm && members.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          ) : null
        }
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading members…
          </div>
        ) : members.length === 0 ? (
          <MembersEmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className={cn(cwLayout.section, "max-w-4xl")}>
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
      </SectionCard>
    </CompanyPageShell>
  );
}
