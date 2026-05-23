import { useNavigate } from "react-router-dom";
import { Calendar, PlusCircle, Users } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import {
  CreateSectionForm,
  formatSectionSchedule,
  type NewSectionPayload,
} from "./CreateSectionForm";

export type WorkspaceSectionRow = NewSectionPayload & {
  id: string;
  students?: { id: string; name: string; email?: string }[];
};

type Props = {
  courseId: string | undefined;
  sections: WorkspaceSectionRow[];
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  creatingSection: boolean;
  onAddSection: (payload: NewSectionPayload) => void;
};

export function CourseWorkspaceSectionsPanel({
  courseId,
  sections,
  createOpen,
  onCreateOpenChange,
  creatingSection,
  onAddSection,
}: Props) {
  const navigate = useNavigate();

  const handleSubmit = (payload: NewSectionPayload) => {
    onAddSection(payload);
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button type="button" onClick={() => onCreateOpenChange(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add section
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New section</DialogTitle>
          </DialogHeader>
          <CreateSectionForm
            submitting={creatingSection}
            onSubmit={handleSubmit}
            onCancel={() => onCreateOpenChange(false)}
          />
        </DialogContent>
      </Dialog>

      {sections.length === 0 && !createOpen ? (
        <DoctorHubEmptyState
          icon={Calendar}
          title="No sections yet"
          description="Add a section so students can be enrolled and organized."
          action={
            <Button type="button" onClick={() => onCreateOpenChange(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add section
            </Button>
          }
        />
      ) : null}

      {sections.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((s) => {
            const enrolled = s.students?.length ?? 0;
            return (
              <Card
                key={s.id}
                className="hover:border-primary/40 transition-colors overflow-hidden"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{s.name}</div>
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {formatSectionSchedule(s.days, s.timeFrom, s.timeTo)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {enrolled}/{s.capacity}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!courseId) return;
                      navigate(`/courses/${courseId}/sections/${s.id}/students`, {
                        state: { sectionName: s.name },
                      });
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage students
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
