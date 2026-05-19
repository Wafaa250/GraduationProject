import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Megaphone,
  Stethoscope,
} from "lucide-react";

import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthStepProgress } from "../../components/auth/AuthStepProgress";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import type { GoogleAuthRole } from "../../../api/authApi";
import { Button } from "../../components/ui/button";
import CompanyRegisterForm from "../forms/CompanyRegisterForm";
import DoctorRegisterForm from "../forms/DoctorRegisterForm";
import StudentRegisterForm from "../forms/StudentRegisterForm";

type UserRole = "student" | "doctor" | "company" | "association" | null;

const ROLES = [
  {
    id: "student" as UserRole,
    icon: GraduationCap,
    title: "Student",
    desc: "Find teams, supervisors, and opportunities",
  },
  {
    id: "doctor" as UserRole,
    icon: Stethoscope,
    title: "Doctor / Supervisor",
    desc: "Supervise projects in your research area",
  },
  {
    id: "company" as UserRole,
    icon: Building2,
    title: "Company",
    desc: "Find students or teams for real work",
  },
  {
    id: "association" as UserRole,
    icon: Megaphone,
    title: "Student Association",
    desc: "Form campaign and event teams",
  },
] as const;

const REGISTER_STEPS = ["Choose role", "Account info"];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const navigate = useNavigate();

  const selectedRoleData = ROLES.find((r) => r.id === selectedRole);

  const handleNext = () => {
    if (!selectedRole) return;
    sessionStorage.setItem("selectedRole", selectedRole);
    if (selectedRole === "association") {
      navigate("/register/association");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    sessionStorage.removeItem("selectedRole");
    setStep(1);
  };

  const renderRoleForm = () => {
    switch (selectedRole) {
      case "student":
        return <StudentRegisterForm onBack={handleBack} />;
      case "doctor":
        return <DoctorRegisterForm onBack={handleBack} />;
      case "company":
        return <CompanyRegisterForm onBack={handleBack} />;
      case "association":
        return <ComingSoon role="Student Organization" onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (step === 2) {
    return renderRoleForm();
  }

  return (
    <AuthLayout
      maxWidth="2xl"
      title="Welcome to SkillSwap"
      subtitle="Set up your account in a few simple steps."
      footer={
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthStepProgress steps={REGISTER_STEPS} currentStep={0} />

      <div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Who are you on SkillSwap?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          This shapes your dashboard and collaboration matches.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const active = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      active
                        ? "bg-gradient-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  {active ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
                </div>
                <p className="mt-3 font-display font-semibold text-foreground">{role.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{role.desc}</p>
              </button>
            );
          })}
        </div>

        {selectedRole === "association" ? (
          <GoogleSignInButton role="association" className="mt-6 h-12 w-full" />
        ) : null}

        {selectedRole && selectedRole !== "association" ? (
          <>
            <GoogleSignInButton
              role={selectedRole as GoogleAuthRole}
              className="mt-6 h-12 w-full"
            />
            <div className="mt-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">or register with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        <Button
          type="button"
          variant="gradient"
          size="lg"
          disabled={!selectedRole}
          onClick={handleNext}
          className="mt-6 h-12 w-full rounded-xl text-base font-semibold"
        >
          Continue as {selectedRoleData?.title ?? "…"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </AuthLayout>
  );
}

function ComingSoon({ role, onBack }: { role: string; onBack: () => void }) {
  return (
    <AuthLayout
      title="Coming soon"
      subtitle={`${role} registration is not available in this flow yet.`}
      footer={
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-primary hover:text-primary/80"
        >
          ← Back to role selection
        </button>
      }
    >
      <p className="text-center text-sm text-muted-foreground">
        Use the association registration path from the role selection screen.
      </p>
    </AuthLayout>
  );
}
