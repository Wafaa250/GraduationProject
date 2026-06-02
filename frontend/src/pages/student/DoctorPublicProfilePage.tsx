import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getDoctorPublicProfile, type DoctorPublicProfile } from "@/api/doctorPublicApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { ROUTES } from "@/routes/paths";

export default function DoctorPublicProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;
    setLoading(true);
    void getDoctorPublicProfile(userId)
      .then(setProfile)
      .catch((err) => {
        setProfile(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const photo =
    profilePhotoUrl(profile?.doctorProfile?.profilePictureBase64) ??
    profilePhotoUrl(profile?.user?.profilePictureBase64);

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !profile ? (
        <p className="text-sm text-muted-foreground">{error ?? "Doctor not found."}</p>
      ) : (
        <article className="hub-card max-w-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-bold">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.user.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{profile.user.name}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.doctorProfile.department}
                {profile.doctorProfile.specialization
                  ? ` · ${profile.doctorProfile.specialization}`
                  : ""}
              </p>
            </div>
          </div>
          {profile.doctorProfile.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.doctorProfile.bio}</p>
          ) : null}
        </article>
      )}
    </div>
  );
}
