import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/magic-maker";

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const onEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("auth_token", "demo-token");
      const displayName = email.split("@")[0] || "User";
      localStorage.setItem("auth_user", JSON.stringify({ name: displayName, email }));
      navigate(redirectTo, { replace: true });
    }
  };

  const onGoogle = () => {
    localStorage.setItem("auth_token", "google-demo-token");
    localStorage.setItem("auth_user", JSON.stringify({ name: "Google User" }));
    navigate(redirectTo, { replace: true });
  };

  const onFacebook = () => {
    localStorage.setItem("auth_token", "facebook-demo-token");
    localStorage.setItem("auth_user", JSON.stringify({ name: "Facebook User" }));
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center px-6 py-12 overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] bg-[#00f2ff]/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-8rem] right-1/4 w-[26rem] h-[26rem] bg-[#7000ff]/25 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-[#ff8a00]/10 rounded-full blur-[120px]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1
          className="text-8xl md:text-[11rem] lg:text-[14rem] font-bold text-white/5 select-none uppercase tracking-tight"
          style={{
            animation: "flowing 8s ease-in-out infinite, gradientShift 4s ease-in-out infinite",
            background: "linear-gradient(45deg, #00f2ff, #7000ff, #ff8a00)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            backgroundSize: "200% 200%",
          }}
        >
          3DGENI
        </h1>
      </div>

      <style>
        {`
          @keyframes flowing {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
            25% { transform: translateY(-20px) rotate(1deg); opacity: 0.15; }
            50% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
            75% { transform: translateY(20px) rotate(-1deg); opacity: 0.15; }
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(112,0,255,0.22)] p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ff]" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Secure Access</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              {isSignUp ? "Sign Up for" : "Sign In to"}
              <span className="block bg-gradient-to-r from-[#00f2ff] via-white to-[#7000ff] bg-clip-text text-transparent">
                3DGENI
              </span>
            </h1>
            <p className="text-white/50">Bring your ideas to life with AI</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onGoogle}
                className="glass hover:bg-white/10 border border-white/15 rounded-xl py-3 font-semibold text-[11px] uppercase tracking-widest text-white"
                type="button"
              >
                Google
              </Button>
              <Button
                onClick={onFacebook}
                className="glass hover:bg-white/10 border border-white/15 rounded-xl py-3 font-semibold text-[11px] uppercase tracking-widest text-white"
                type="button"
              >
                Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0a0f] px-2 text-white/40 tracking-widest text-[10px]">Or continue with</span>
              </div>
            </div>

            <form onSubmit={onEmailPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[11px] uppercase tracking-widest font-bold text-white/70 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/40 focus:border-[#00f2ff]/40"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-[11px] uppercase tracking-widest font-bold text-white/70 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#7000ff]/40 focus:border-[#7000ff]/40"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-action hover:opacity-95 text-white rounded-full py-3 text-[11px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(112,0,255,0.35)]"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-white/50 hover:text-[#00f2ff] transition-colors"
              >
                {isSignUp ? "Already have an account? Sign In" : "New user? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
