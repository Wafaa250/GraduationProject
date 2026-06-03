import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordFlowLayout } from "@/pages/auth/forgot-password/ForgotPasswordFlowLayout";
import { FORGOT_PASSWORD_RETURN_PATH } from "@/pages/auth/forgot-password/forgotPasswordFlow";
export default function ForgotPasswordSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast({
      title: "Password updated successfully",
      description: "Your password has been updated successfully.",
    });
  }, []);

  return (
    <ForgotPasswordFlowLayout showTopBack={false}>
      <div className="space-y-6 py-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Password Updated Successfully
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated successfully.
          </p>
        </header>
        <Button
          type="button"
          className="h-11 w-full rounded-lg bg-gradient-brand text-primary-foreground hover:opacity-95"
          onClick={() => navigate(FORGOT_PASSWORD_RETURN_PATH, { replace: true })}
        >
          Back to Settings
        </Button>
      </div>
    </ForgotPasswordFlowLayout>
  );
}
