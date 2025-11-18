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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
      <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary/25 rounded-full blur-2xl animate-pulse delay-500" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1
          className="text-9xl md:text-[12rem] lg:text-[16rem] font-bold text-primary/10 select-none"
          style={{
            animation: "flowing 8s ease-in-out infinite, gradientShift 4s ease-in-out infinite",
            background: "linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
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
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {isSignUp ? "Sign Up for" : "Sign In to"}
              <span className="block text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                3DGENI
              </span>
            </h1>
            <p className="text-muted-foreground">Bring your ideas to life with AI</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onGoogle}
                className="bg-white text-foreground hover:bg-white/90 border border-border rounded-lg py-3 font-medium text-sm"
                type="button"
              >
                Google
              </Button>
              <Button
                onClick={onFacebook}
                className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-lg py-3 font-medium text-sm"
                type="button"
              >
                Facebook
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={onEmailPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full py-3 font-medium"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
