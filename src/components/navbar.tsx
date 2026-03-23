import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoMark from "@/components/logo-mark";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6">
      <nav
        className={`flex items-center justify-between gap-8 px-6 py-3 rounded-full transition-all duration-500 ${
          scrolled ? "glass-dark shadow-2xl w-full max-w-4xl" : "bg-transparent w-full max-w-7xl"
        }`}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/");
              setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tighter uppercase">3DGENI</span>
        </button>

        {/* Center navigation (anchors + pricing) */}
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.14em] text-white/50">
          <button
            type="button"
            onClick={() => goToSection("how")}
            className="hover:text-white transition-colors"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => goToSection("showcase")}
            className="hover:text-white transition-colors"
          >
            Showcase
          </button>
          <button
            type="button"
            onClick={() => goToSection("reviews")}
            className="hover:text-white transition-colors"
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="hover:text-white transition-colors"
          >
            Pricing
          </button>
        </div>

        {/* Right aligned auth / CTA */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                {String(displayName || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-foreground/80">{displayName}</span>
              {showLogout && (
                <Button
                  onClick={onLogout}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full px-4"
                >
                  LOG OUT
                </Button>
              )}
            </div>
          ) : (
            !isMagicMaker && (
              <Button
                className="bg-gradient-action text-white hover:opacity-90 rounded-full px-5 shadow-[0_0_20px_rgba(112,0,255,0.3)]"
                onClick={() => navigate("/login")}
              >
                Get Started
              </Button>
            )
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
