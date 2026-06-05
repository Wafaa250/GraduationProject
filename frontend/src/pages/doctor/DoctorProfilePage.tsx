import { DoctorProfileView } from "@/components/doctor/profile/DoctorProfileView";
import { useDoctorProfilePage } from "@/hooks/useDoctorProfilePage";

export default function DoctorProfilePage() {
  const { loading, data } = useDoctorProfilePage("owner");

  return <DoctorProfileView mode="owner" loading={loading} data={data} />;
}
