import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DoctorShareUpdateForm } from "@/components/doctor/hub/DoctorShareUpdateForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
};

export function DoctorShareUpdateModal({ open, onOpenChange, onPublished }: Props) {
  const handlePublished = () => {
    onPublished();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-visible p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Share Update</DialogTitle>
          <DialogDescription>
            Publish an announcement to the student Communication Hub feed.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <DoctorShareUpdateForm active={open} onPublished={handlePublished} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
