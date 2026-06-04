import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CirclePause,
  CirclePlay,
  CircleX,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompanyRequestLifecycleStatus } from "@/api/companyApi";

type Props = {
  editHref: string;
  lifecycleStatus: CompanyRequestLifecycleStatus;
  onPause: () => void;
  onReactivate: () => void;
  onClose: () => void;
  onDelete: () => void;
  statusLoading?: boolean;
  deleteDisabled?: boolean;
};

export function CompanyRequestActionsMenu({
  editHref,
  lifecycleStatus,
  onPause,
  onReactivate,
  onClose,
  onDelete,
  statusLoading = false,
  deleteDisabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isClosed = lifecycleStatus === "closed";
  const isPaused = lifecycleStatus === "paused";
  const isViewOnly = isClosed || isPaused;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Request actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[200] mt-1.5 min-w-[220px] rounded-xl border bg-card py-1 shadow-lg"
        >
          {!isViewOnly ? (
            <Link
              role="menuitem"
              to={editHref}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={close}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit Request
            </Link>
          ) : (
            <div
              role="menuitem"
              aria-disabled
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Request
            </div>
          )}

          {!isClosed && !isPaused && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50"
              disabled={statusLoading}
              onClick={() => {
                close();
                onPause();
              }}
            >
              <CirclePause className="h-4 w-4 text-muted-foreground" />
              Pause Request
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50"
              disabled={statusLoading}
              onClick={() => {
                close();
                onReactivate();
              }}
            >
              <CirclePlay className="h-4 w-4 text-muted-foreground" />
              Reactivate Request
            </button>
          )}

          {!isClosed && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50"
              disabled={statusLoading}
              onClick={() => {
                close();
                onClose();
              }}
            >
              <CircleX className="h-4 w-4 text-muted-foreground" />
              Close Request
            </button>
          )}

          <div className="my-1 border-t" />
          <button
            type="button"
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors",
              deleteDisabled && "opacity-50 pointer-events-none",
            )}
            disabled={deleteDisabled}
            onClick={() => {
              close();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Request
          </button>
        </div>
      )}
    </div>
  );
}
