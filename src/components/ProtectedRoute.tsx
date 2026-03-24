import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  role: "client" | "pro";
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const isPro = profile?.is_labourer ?? false;

  if (role === "pro" && !isPro) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "client" && isPro) {
    return <Navigate to="/pro-panel" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;