import { AlertCircle } from "lucide-react";

export function ForgotPasswordFlowAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive dark:bg-destructive/10"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
