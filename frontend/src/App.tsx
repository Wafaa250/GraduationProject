import { Toaster } from "react-hot-toast";
import { AppRouter } from "@/routes/AppRouter";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppRouter />
        <Toaster position="top-center" />
      </UserProvider>
    </ThemeProvider>
  );
}
