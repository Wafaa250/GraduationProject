import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { startConversation } from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorProfileView } from "@/components/doctor/profile/DoctorProfileView";
import { useDoctorProfilePage } from "@/hooks/useDoctorProfilePage";
import { ROUTES, studentMessageThreadPath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";

export default function DoctorPublicProfilePage() {
  const navigate = useNavigate();
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const validId = Number.isFinite(userId) && userId > 0;
  const { loading, data, error } = useDoctorProfilePage("visitor", validId ? userId : undefined);
  const [messaging, setMessaging] = useState(false);

  const handleMessage = async () => {
    if (!validId) return;
    setMessaging(true);
    try {
      const conversationId = await startConversation(userId);
      navigate(studentMessageThreadPath(conversationId), { state: { focusComposer: true } });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not start conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setMessaging(false);
    }
  };

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
      <DoctorProfileView
        mode="visitor"
        loading={loading}
        data={data}
        error={error}
        showMessageButton={validId}
        messaging={messaging}
        onMessage={() => void handleMessage()}
      />
    </div>
  );
}
