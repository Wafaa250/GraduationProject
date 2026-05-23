import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { createDoctorCourse } from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [useSharedProjectAcrossSections, setUseSharedProjectAcrossSections] = useState(false);
  const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const nameTrim = name.trim();
    const codeTrim = code.trim();
    if (!nameTrim || !codeTrim) {
      showToast("Please enter name and code.", "error");
      return;
    }
    const semesterTrim = semester.trim();
    const shared = useSharedProjectAcrossSections;
    const allowCross = shared ? allowCrossSectionTeams : false;

    setSubmitting(true);
    try {
      await createDoctorCourse({
        name: nameTrim,
        code: codeTrim,
        semester: semesterTrim.length > 0 ? semesterTrim : null,
        useSharedProjectAcrossSections: shared,
        allowCrossSectionTeams: allowCross,
      });
      showToast("Course created", "success");
      navigate("/doctor-dashboard?section=courses", { replace: true });
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
      setSubmitting(false);
    }
  };

  return (
    <DoctorSubpageLayout backTo="/doctor-dashboard?section=courses" backLabel="Back to courses">
      <DoctorHubPageHeader
        eyebrow="Course setup"
        title="Create course"
        description="Add a new course with optional shared project settings across sections."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Course details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Software Engineering"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS401"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Fall 2026 (optional)"
                autoComplete="off"
              />
            </div>

            <div className="rounded-lg border border-border p-4 space-y-4 bg-secondary/30">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="shared-project"
                  checked={useSharedProjectAcrossSections}
                  onCheckedChange={(v) => setUseSharedProjectAcrossSections(v === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="shared-project" className="font-medium cursor-pointer">
                    Use one shared project across all sections
                  </Label>
                  <p className="text-xs text-muted-foreground m-0">
                    When enabled, a single course-level project applies to every section.
                  </p>
                </div>
              </div>
              {useSharedProjectAcrossSections ? (
                <div className="flex items-start gap-3 pl-1">
                  <Checkbox
                    id="cross-section"
                    checked={allowCrossSectionTeams}
                    onCheckedChange={(v) => setAllowCrossSectionTeams(v === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="cross-section" className="font-medium cursor-pointer">
                      Allow cross-section teams
                    </Label>
                    <p className="text-xs text-muted-foreground m-0">
                      Students from different sections can be placed on the same team.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/doctor-dashboard?section=courses")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create course"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DoctorSubpageLayout>
  );
}
