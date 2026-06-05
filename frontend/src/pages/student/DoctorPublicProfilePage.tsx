import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DoctorProfileView } from "@/components/doctor/profile/DoctorProfileView";
import { useDoctorProfilePage } from "@/hooks/useDoctorProfilePage";
import { ROUTES } from "@/routes/paths";

export default function DoctorPublicProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const validId = Number.isFinite(userId) && userId > 0;
  const { loading, data, error } = useDoctorProfilePage("visitor", validId ? userId : undefined);

  return (
    <div className="doctor-hub min-h-full flex-1">
      <div className="mx-auto max-w-4xl px-4 pt-5 sm:px-6 lg:px-8">
        <Link
          to={ROUTES.communicationHub}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Communication Hub
        </Link>
      </div>
      <DoctorProfileView mode="visitor" loading={loading} data={data} error={error} />
    </div>
  );
}
