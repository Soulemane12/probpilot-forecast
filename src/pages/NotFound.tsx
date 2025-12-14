import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-10">
      <div className="text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
