import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
};

export function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus = true,
  "aria-label": ariaLabel = "Verification code",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputRefs.current[0]?.focus();
  }, [autoFocus, disabled]);

  const updateAt = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, OTP_LENGTH));
  };

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      updateAt(index, "");
      return;
    }
    if (cleaned.length > 1) {
      const merged = (digits.join("") + cleaned).replace(/\D/g, "").slice(0, OTP_LENGTH);
      onChange(merged);
      focusIndex(Math.min(merged.length, OTP_LENGTH - 1));
      return;
    }
    updateAt(index, cleaned);
    if (index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      updateAt(index - 1, "");
      focusIndex(index - 1);
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div
      className="flex justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={6}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={cn(
            "h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-semibold text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-11",
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

export const OTP_CODE_LENGTH = OTP_LENGTH;
