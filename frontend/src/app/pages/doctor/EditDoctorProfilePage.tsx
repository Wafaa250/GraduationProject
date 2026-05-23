import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Save } from "lucide-react";
import { apiClient } from "../../../api/client";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { normalizeSkillStringList, useUser } from "../../../context/UserContext";
import { useToast } from "../../../context/ToastContext";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorProfileSkillTagsField } from "../../components/doctor/profile/DoctorProfileSkillTagsField";
import { doctorProfileInitials } from "./doctorProfileMappers";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

const doctorSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  bio: z.string().max(600, "Bio must be 600 characters or less").optional(),
  department: z.string().max(120, "Department is too long").optional(),
  faculty: z.string().max(120, "Faculty is too long").optional(),
  specialization: z.string().max(120, "Specialization is too long").optional(),
  linkedin: z.string().max(300, "LinkedIn URL is too long").optional(),
  officeHours: z.string().max(120, "Office hours is too long").optional(),
  yearsOfExperience: z.string().max(20, "Years of experience is too long").optional(),
  profilePictureBase64: z.string().nullable().optional(),
  technicalSkills: z.array(z.string()).default([]),
  researchSkills: z.array(z.string()).default([]),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

function normalizeLinkedin(v?: string): boolean {
  if (!v) return true;
  return /^https?:\/\/.+/i.test(v) || /^linkedin\.com\/.+/i.test(v);
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive font-medium m-0">{error}</p> : null}
    </div>
  );
}

export default function EditDoctorProfilePage() {
  const navigate = useNavigate();
  const { refetch } = useUser();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [researchInput, setResearchInput] = useState("");

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(
      doctorSchema.refine((v) => normalizeLinkedin(v.linkedin), {
        message: "Enter a valid LinkedIn URL",
        path: ["linkedin"],
      }),
    ),
    defaultValues: {
      fullName: "",
      bio: "",
      department: "",
      faculty: "",
      specialization: "",
      linkedin: "",
      officeHours: "",
      yearsOfExperience: "",
      profilePictureBase64: null,
      technicalSkills: [],
      researchSkills: [],
    },
  });

  const watchedFullName = form.watch("fullName");
  const avatarText = useMemo(
    () => doctorProfileInitials(watchedFullName || "DR"),
    [watchedFullName],
  );

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await apiClient.get("/me");
        const data = res.data;
        const user = data?.user ?? data ?? {};
        const doctorProfile = data?.doctorProfile ?? data ?? {};
        const technicalSkills = normalizeSkillStringList(doctorProfile.technicalSkills);
        const researchSkills = normalizeSkillStringList(doctorProfile.researchSkills);

        form.reset({
          fullName: user.name || user.fullName || "",
          bio: doctorProfile.bio || user.bio || "",
          department: doctorProfile.department || "",
          faculty: doctorProfile.faculty || "",
          specialization: doctorProfile.specialization || "",
          linkedin: doctorProfile.linkedin || user.linkedin || "",
          officeHours: doctorProfile.officeHours || "",
          yearsOfExperience:
            doctorProfile.yearsOfExperience != null
              ? String(doctorProfile.yearsOfExperience)
              : "",
          profilePictureBase64:
            user.profilePictureBase64 || doctorProfile.profilePictureBase64 || null,
          technicalSkills,
          researchSkills,
        });
      } finally {
        setLoading(false);
      }
    };
    void fetchDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  const addTag = (field: "technicalSkills" | "researchSkills", value: string) => {
    const tag = value.trim();
    if (!tag) return;
    const list = form.getValues(field) || [];
    if (list.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    form.setValue(field, [...list, tag], { shouldValidate: true, shouldDirty: true });
  };

  const removeTag = (field: "technicalSkills" | "researchSkills", index: number) => {
    const list = form.getValues(field) || [];
    form.setValue(
      field,
      list.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const handlePicture = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        form.setValue("profilePictureBase64", ev.target.result as string, { shouldDirty: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const collectSkillsForSubmit = () => {
    let tech = [...(form.getValues("technicalSkills") ?? [])].map((s) => s.trim()).filter(Boolean);
    let res = [...(form.getValues("researchSkills") ?? [])].map((s) => s.trim()).filter(Boolean);
    const pendingTech = techInput.trim();
    const pendingRes = researchInput.trim();
    if (pendingTech && !tech.some((t) => t.toLowerCase() === pendingTech.toLowerCase())) {
      tech = [...tech, pendingTech];
      form.setValue("technicalSkills", tech, { shouldDirty: true, shouldValidate: true });
    }
    if (pendingRes && !res.some((r) => r.toLowerCase() === pendingRes.toLowerCase())) {
      res = [...res, pendingRes];
      form.setValue("researchSkills", res, { shouldDirty: true, shouldValidate: true });
    }
    return { technicalSkills: tech, researchSkills: res };
  };

  const onSubmit = async (values: DoctorFormValues) => {
    setSaving(true);
    try {
      const { technicalSkills, researchSkills } = collectSkillsForSubmit();

      const yoeRaw = values.yearsOfExperience?.trim() ?? "";
      let yearsOfExperience: number | null = null;
      if (yoeRaw) {
        const n = Number(yoeRaw);
        yearsOfExperience = Number.isFinite(n) ? Math.trunc(n) : null;
      }

      const payload = {
        fullName: values.fullName?.trim() ?? "",
        department: values.department?.trim() ?? "",
        faculty: values.faculty?.trim() ?? "",
        specialization: values.specialization?.trim() ?? "",
        yearsOfExperience,
        linkedin: values.linkedin?.trim() ?? "",
        officeHours: values.officeHours?.trim() ?? "",
        bio: values.bio?.trim() ?? "",
        profilePictureBase64: values.profilePictureBase64 ?? null,
        technicalSkills,
        researchSkills,
      };

      await apiClient.put("/profile/doctor", payload, {
        headers: { "Content-Type": "application/json" },
      });
      await refetch(true);
      showToast("Doctor profile updated successfully.", "success");
      navigate("/doctor/profile", { replace: true });
    } catch (err: unknown) {
      showToast(parseApiErrorMessage(err) || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const technicalSkills = form.watch("technicalSkills") || [];
  const researchSkills = form.watch("researchSkills") || [];
  const profilePic = form.watch("profilePictureBase64");
  const errors = form.formState.errors;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm mt-3">Loading doctor profile…</p>
      </div>
    );
  }

  return (
    <form className="max-w-5xl mx-auto space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <DoctorHubPageHeader
          title="Edit profile"
          description="Update your academic details, contact information, and skills."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/doctor/profile">View profile</Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <button
                type="button"
                className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => fileRef.current?.click()}
              >
                <Avatar className="h-24 w-24 border-4 border-background shadow">
                  {profilePic ? <AvatarImage src={profilePic} alt="Doctor" /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {avatarText}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 rounded-full bg-foreground/30 flex items-center justify-center text-primary-foreground opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePicture(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Change picture
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Full name" error={errors.fullName?.message}>
                    <Input {...form.register("fullName")} />
                  </FormField>
                  <FormField label="Department" error={errors.department?.message}>
                    <Input {...form.register("department")} />
                  </FormField>
                  <FormField label="Faculty" error={errors.faculty?.message}>
                    <Input {...form.register("faculty")} />
                  </FormField>
                  <FormField label="Specialization" error={errors.specialization?.message}>
                    <Input {...form.register("specialization")} />
                  </FormField>
                  <FormField label="Years of experience" error={errors.yearsOfExperience?.message}>
                    <Input placeholder="e.g. 8" {...form.register("yearsOfExperience")} />
                  </FormField>
                  <FormField label="Office hours" error={errors.officeHours?.message}>
                    <Input placeholder="Mon 10:00 – 12:00" {...form.register("officeHours")} />
                  </FormField>
                  <FormField label="LinkedIn" error={errors.linkedin?.message}>
                    <Input
                      placeholder="https://linkedin.com/in/..."
                      {...form.register("linkedin")}
                    />
                  </FormField>
                </div>
                <FormField label="Bio" error={errors.bio?.message}>
                  <Textarea rows={4} {...form.register("bio")} />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills & research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <DoctorProfileSkillTagsField
                  label="Technical skills"
                  inputValue={techInput}
                  onInputChange={setTechInput}
                  tags={technicalSkills}
                  onAdd={(v) => addTag("technicalSkills", v)}
                  onRemove={(idx) => removeTag("technicalSkills", idx)}
                />
                <DoctorProfileSkillTagsField
                  label="Research interests"
                  inputValue={researchInput}
                  onInputChange={setResearchInput}
                  tags={researchSkills}
                  onAdd={(v) => addTag("researchSkills", v)}
                  onRemove={(idx) => removeTag("researchSkills", idx)}
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" asChild>
                <Link to="/doctor/profile">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
    </form>
  );
}
