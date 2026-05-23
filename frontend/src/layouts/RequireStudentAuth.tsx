import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

export function RequireStudentAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (!token || role !== "student") {
      navigate(ROUTES.login, { replace: true });
      return;
    }
    setAllowed(true);
  }, [navigate]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
