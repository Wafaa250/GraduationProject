import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GraduationCap, Plus, Upload, UserPlus, Users } from "lucide-react";
import {
  getDoctorSectionStudents,
  addStudentsToDoctorSection,
  type DoctorCourseStudent,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";

type AddStudentsTab = "manual" | "upload";

type LocationState = {
  sectionName?: string;
};

export default function SectionStudentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>();
  const { showToast } = useToast();

  const sectionName =
    (location.state as LocationState | null)?.sectionName?.trim() ||
    (sectionId ? `Section ${sectionId}` : "Section");

  const backendSectionId = sectionId && /^\d+$/.test(sectionId) ? Number(sectionId) : null;

  const [students, setStudents] = useState<DoctorCourseStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [showAddStudents, setShowAddStudents] = useState(false);
  const [addStudentsTab, setAddStudentsTab] = useState<AddStudentsTab>("manual");

  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileLabel, setUploadFileLabel] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (backendSectionId == null) {
      setLoadingStudents(false);
      return;
    }
    let cancelled = false;
    setLoadingStudents(true);
    getDoctorSectionStudents(backendSectionId)
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch((err) => {
        if (!cancelled) showToast(parseApiErrorMessage(err), "error");
      })
      .finally(() => {
        if (!cancelled) setLoadingStudents(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendSectionId]);

  function parseIds(raw: string): string[] {
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const handleAddManual = async (e: FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const ids = parseIds(inputValue);
    if (ids.length === 0) {
      setInputError("Enter at least one student ID or email.");
      return;
    }
    if (backendSectionId == null) {
      setInputError("Cannot save — section ID is not a valid number.");
      return;
    }
    setSubmitting(true);
    try {
      await addStudentsToDoctorSection(backendSectionId, ids);
      const updated = await getDoctorSectionStudents(backendSectionId);
      setStudents(updated);
      setInputValue("");
      setShowAddStudents(false);
      showToast(`${ids.length} student(s) added successfully.`, "success");
    } catch (err) {
      setInputError(parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFilePick = () => uploadInputRef.current?.click();

  const handleUploadInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setUploadError(null);
    setUploadFile(f);
    setUploadFileLabel(f ? f.name : null);
  };

  const handleUploadAndAddStudents = async () => {
    setUploadError(null);
    if (!uploadFile) {
      setUploadError("Choose a file first.");
      return;
    }
    if (backendSectionId == null) {
      setUploadError("Cannot save — section ID is not valid.");
      return;
    }
    let ids: string[] = [];
    try {
      const text = await uploadFile.text();
      ids = parseIds(text);
      if (ids.length === 0) {
        setUploadError("No entries found in this file.");
        return;
      }
    } catch {
      setUploadError("Could not read this file.");
      return;
    }
    setUploading(true);
    try {
      await addStudentsToDoctorSection(backendSectionId, ids);
      const updated = await getDoctorSectionStudents(backendSectionId);
      setStudents(updated);
      setUploadFile(null);
      setUploadFileLabel(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      setShowAddStudents(false);
      showToast(`${ids.length} student(s) added successfully.`, "success");
    } catch (err) {
      setUploadError(parseApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const backTo = courseId ? `/courses/${courseId}` : "/doctor-dashboard?section=courses";

  return (
    <DoctorSubpageLayout backTo={backTo} backLabel="Back to course">
      <DoctorHubPageHeader
        eyebrow={courseId ? `Course ${courseId}` : "Course"}
        title={sectionName}
        description="Enroll students by university ID. Manual entry and file upload use the same enrollment API."
        actions={
          <Button type="button" onClick={() => setShowAddStudents(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add students
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground mb-4 -mt-2">
        {loadingStudents
          ? "Loading roster…"
          : `${students.length} student${students.length === 1 ? "" : "s"} enrolled`}
      </p>

      {showAddStudents ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs
              value={addStudentsTab}
              onValueChange={(v) => setAddStudentsTab(v as AddStudentsTab)}
            >
              <TabsList>
                <TabsTrigger value="manual">Manual entry</TabsTrigger>
                <TabsTrigger value="upload">Upload file</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground m-0">
                  Enter one or more university student IDs separated by commas or new lines.
                </p>
                <form onSubmit={(e) => void handleAddManual(e)} className="space-y-3">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setInputError(null);
                    }}
                    placeholder={"2021001\n2021002, 2021003"}
                    rows={5}
                    className="resize-y"
                  />
                  {inputError ? (
                    <p className="text-sm font-medium text-destructive m-0">{inputError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddStudents(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      <Plus className="h-4 w-4 mr-2" />
                      {submitting ? "Adding…" : "Add students"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="upload" className="mt-4 space-y-3">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  className="hidden"
                  onChange={handleUploadInputChange}
                />
                <p className="text-sm text-muted-foreground m-0">
                  Each line (or comma-separated value) should contain one university student ID.
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button type="button" variant="outline" onClick={handleUploadFilePick}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose file
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {uploadFileLabel ?? "No file selected"}
                  </span>
                </div>
                {uploadError ? (
                  <p className="text-sm font-medium text-destructive m-0">{uploadError}</p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddStudents(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleUploadAndAddStudents()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading…" : "Upload & add"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      {loadingStudents ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : null}

      {!loadingStudents && students.length === 0 && !showAddStudents ? (
        <DoctorHubEmptyState
          icon={Users}
          title="No students yet"
          description="Use Add students to enroll learners by their university ID."
          action={
            <Button type="button" onClick={() => setShowAddStudents(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add students
            </Button>
          }
        />
      ) : null}

      {!loadingStudents && students.length > 0 ? (
        <div className="space-y-2 border border-border rounded-lg overflow-hidden bg-card">
          {students.map((s) => (
            <div
              key={s.studentId}
              className="flex items-center gap-3 border-b border-border last:border-b-0 p-3 hover:bg-accent/30"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                  {(s.name?.trim()[0] ?? "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {s.universityId ? <span>ID: {s.universityId}</span> : null}
                  {s.major ? <span>{s.major}</span> : null}
                  {s.university ? <span>{s.university}</span> : null}
                </div>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            </div>
          ))}
        </div>
      ) : null}
    </DoctorSubpageLayout>
  );
}
