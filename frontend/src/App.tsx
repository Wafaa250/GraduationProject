import { Toaster } from "react-hot-toast";
import { AppRouter } from "@/routes/AppRouter";
import { UserProvider } from "@/context/UserContext";

export function App() {
  return (
    <UserProvider>
      <AppRouter />
      <Toaster position="top-center" />
    </UserProvider>
  );
}
