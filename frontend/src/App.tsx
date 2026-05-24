import { Toaster } from "react-hot-toast";
import { AppRouter } from "@/routes/AppRouter";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppRouter />
        <ThemeToggle />
        <Toaster position="top-center" />
      </UserProvider>
    </ThemeProvider>
  );
}
