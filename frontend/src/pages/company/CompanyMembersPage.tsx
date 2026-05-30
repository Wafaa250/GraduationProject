import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, Plus, Trash2, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyCardHeader } from "@/components/company/CompanyCardHeader";
import { CompanyWorkspaceLoading } from "@/components/company/CompanyWorkspaceLoading";
import { CompanyWorkspaceEmptyState } from "@/components/company/CompanyWorkspaceEmptyState";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  addCompanyMember,
  listCompanyMembers,
  parseApiErrorMessage,
  removeCompanyMember,
  type CompanyMember,
} from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { formatCompanyRole, isCompanyOwner } from "@/lib/companyWorkspace";
import { cn } from "@/lib/utils";

function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
    <CompanyPageShell narrow>
      <CompanyPageHeader
        title="Company Members"
        subtitle="Manage who can access your shared company workspace."
        actions={
          !showForm ? (
            <Button
              type="button"
              className="cw-btn-gradient border-0 shadow-sm rounded-xl"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          ) : null
        }
      />

      {showForm ? (
        <Card className="cw-card-elevated overflow-hidden">
          <div className="h-0.5 cw-team-card-accent opacity-50" aria-hidden />
          <CompanyCardHeader
            icon={Plus}
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
          />
          <CardContent className="cw-card-body cw-card-body--flush-top">
            {credentialsEmailed && addedMemberEmail ? (
              <div className="space-y-5 max-w-md">
                <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-4 space-y-3">
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
                <Button type="button" onClick={resetForm} className="rounded-xl cw-btn-gradient border-0 shadow-sm">
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={onAddMember} className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="member-name">Full name</Label>
                  <Input
                    id="member-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "owner" | "member")}>
                    <SelectTrigger className="rounded-xl mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={submitting} className="rounded-xl cw-btn-gradient border-0 shadow-sm">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add member"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

        <Card className="cw-card-elevated">
          <CompanyCardHeader
            icon={Users}
            title="Workspace access"
            description={`${members.length} member${members.length === 1 ? "" : "s"} with access to this workspace`}
          />
          <CardContent className="cw-card-body cw-card-body--flush-top">
          {loading ? (
            <CompanyWorkspaceLoading message="Loading members…" />
          ) : members.length === 0 ? (
            <CompanyWorkspaceEmptyState
              compact
              icon={Users}
              title="No members yet"
              description="Add your first teammate to share this workspace and collaborate on project requests."
              action={
                !showForm
                  ? { label: "Add member", onClick: () => setShowForm(true) }
                  : undefined
              }
            />
          ) : (
            <div className="cw-list-stack">
              {members.map((member) => (
                <div key={member.id} className="cw-member-row">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="cw-member-avatar">{memberInitials(member.name)}</div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm cw-text-secondary truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={member.role === "owner" ? "default" : "secondary"}
                      className={cn(
                        "rounded-md",
                        member.role === "owner" && "cw-badge-premium border-0",
                      )}
                    >
                      {formatCompanyRole(member.role)}
                    </Badge>
                    {member.userId !== currentUserId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                        disabled={removingId === member.id}
                        onClick={() => onRemove(member)}
                        aria-label={`Remove ${member.name}`}
                      >
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </CompanyPageShell>
  );
}
