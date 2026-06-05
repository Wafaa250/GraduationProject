import { useParams } from "react-router-dom";
import { StudentProfileView } from "@/pages/student/StudentProfilePage";

export default function StudentDirectoryProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);

  return <StudentProfileView mode="visitor" userId={userId} />;
}
