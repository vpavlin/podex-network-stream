
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <div className="fixed bottom-4 right-4">
        <Link 
          to="/settings" 
          className="border border-black p-2 bg-white hover:bg-black hover:text-white"
          title="Settings"
        >
          <Settings size={20} />
        </Link>
      </div>
    </div>
  );
};

export default AppLayout;
