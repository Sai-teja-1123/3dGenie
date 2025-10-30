import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "phone", label: "Continue with Phone (OTP)" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Destination after login (default to magic-maker)
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/magic-maker";

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const onEmailPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo auth: accept any non-empty email/password
    if (email && password) {
      localStorage.setItem("auth_token", "demo-token");
      const displayName = email.split("@")[0] || "User";
      localStorage.setItem("auth_user", JSON.stringify({ name: displayName, email }));
      navigate(redirectTo, { replace: true });
    }
  };

  const onGoogle = () => {
    // Demo: simulate oauth success
    localStorage.setItem("auth_token", "google-demo-token");
    localStorage.setItem("auth_user", JSON.stringify({ name: "Google User" }));
    navigate(redirectTo, { replace: true });
  };

  const onSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) setOtpSent(true);
  };

  const onVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: any OTP works
    localStorage.setItem("auth_token", "phone-demo-token");
    localStorage.setItem("auth_user", JSON.stringify({ name: phone || "Phone User" }));
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign in to continue</h1>

        <div className="space-y-3 mb-6">
          <button onClick={onGoogle} className="w-full rounded-lg bg-white text-[#0f172a] hover:bg-white/90 py-2.5 font-medium transition-colors">
            Continue with Google
          </button>
          <form onSubmit={onEmailPasswordLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <button type="submit" className="w-full rounded-lg bg-primary hover:bg-primary/90 py-2.5 font-medium transition-colors">
              Continue with Email
            </button>
          </form>
          <div className="h-px bg-white/10 my-4" />
          <form onSubmit={otpSent ? onVerifyOtp : onSendOtp} className="space-y-3">
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            {otpSent && (
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            )}
            <button type="submit" className="w-full rounded-lg bg-white/10 hover:bg-white/15 py-2.5 font-medium border border-white/10 transition-colors">
              {otpSent ? "Verify OTP" : "Send OTP"}
            </button>
          </form>
        </div>

        <p className="text-xs text-white/60 text-center">
          This is a demo sign-in experience. Replace with real auth later.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


