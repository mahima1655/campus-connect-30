import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white/10 backdrop-blur mb-6">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-6xl font-display font-bold text-white mb-4">404</h1>
        <p className="text-white/70 mb-8">Page not found</p>
        <Button asChild className="btn-hero">
          <Link to="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
