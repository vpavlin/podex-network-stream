
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border border-black p-12 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">Page Not Found</p>
        <Link to="/" className="border border-black px-4 py-2 hover:bg-black hover:text-white">
          Return to Discovery
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
