import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
    <div className="h-screen bg-[#0f172a] text-white flex items-center justify-center px-2 py-1">
      <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded shadow p-2">
        <h1 className="text-xs font-medium mb-1 text-center">Sign in</h1>
        <div className="space-y-0.5">
          <button onClick={onGoogle} className="w-full rounded bg-white text-[#0f172a] hover:bg-white/90 py-0.5 text-[10px] font-medium">
            Google
          </button>
          <form onSubmit={onEmailPasswordLogin} className="space-y-0.5">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded bg-white/10 border border-white/10 px-1.5 py-0.5 text-[10px] focus:outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded bg-white/10 border border-white/10 px-1.5 py-0.5 text-[10px] focus:outline-none" required />
            <button type="submit" className="w-full rounded bg-primary hover:bg-primary/90 py-0.5 text-[10px] font-medium">Email</button>
          </form>
          <div className="h-px bg-white/10 my-0.5" />
          <form onSubmit={otpSent ? onVerifyOtp : onSendOtp} className="space-y-0.5">
            <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded bg-white/10 border border-white/10 px-1.5 py-0.5 text-[10px] focus:outline-none" />
            {otpSent && <input type="text" placeholder="OTP" className="w-full rounded bg-white/10 border border-white/10 px-1.5 py-0.5 text-[10px] focus:outline-none" />}
            <button type="submit" className="w-full rounded bg-white/10 hover:bg-white/15 py-0.5 text-[10px] font-medium border border-white/10">{otpSent ? "Verify" : "Send OTP"}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


