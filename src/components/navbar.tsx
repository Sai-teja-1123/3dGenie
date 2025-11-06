import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  }, [location.key]);

  const displayName = useMemo(() => {
    const raw = String((user && user.name) || "U");
    const beforeAt = raw.includes("@") ? raw.split("@")[0] : raw;
    const firstToken = beforeAt.split(/[^A-Za-z]+/)[0] || beforeAt;
    return firstToken;
  }, [user]);

  const isMagicMaker = location.pathname.startsWith("/magic-maker");

  const onLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/");
  };

  const showLogout = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Brand */}
          <div className="text-2xl font-bold text-foreground">3DGENI</div>

          {/* Right aligned navigation */}
          <div className="ml-auto flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate("/")} className="text-foreground/90 hover:text-primary transition-colors">
                HOME
              </button>
              <button onClick={() => navigate("/pricing")} className="text-foreground/90 hover:text-primary transition-colors">
                PRICING
              </button>
            </div>
            {/* Auth area */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                  {String(displayName || "U").slice(0,1).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-foreground/80">{displayName}</span>
                {showLogout && (
                <Button onClick={onLogout} className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full px-4">
                  LOG OUT
                </Button>
                )}
              </div>
            ) : (
              !isMagicMaker && (
                <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 rounded-full px-5" onClick={() => navigate("/login") }>
                  SIGN UP
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
