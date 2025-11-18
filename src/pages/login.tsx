import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ModelViewer3D from "@/components/ModelViewer3D";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
      const displayName = fullName || email.split("@")[0] || "User";
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

  const onApple = () => {
    // Demo: simulate oauth success
    localStorage.setItem("auth_token", "apple-demo-token");
    localStorage.setItem("auth_user", JSON.stringify({ name: "Apple User" }));
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Left Side - Full Screen 3D Model Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Full Screen 3D Model Viewer */}
        <div className="absolute inset-0 w-full h-full">
          <ModelViewer3D />
        </div>

        {/* Gradient Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60 z-10 pointer-events-none" />

        {/* Text Content Overlays - Stacked Vertically */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-12 py-16 space-y-8">

          {/* 1. Brand Name - Elegant Typography */}
          <div className="text-center animate-[fadeInDown_1.2s_ease-out]">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-3 tracking-wider drop-shadow-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              3DGENI
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full" />
          </div>

          {/* 2. Main Tagline */}
          <div className="text-center animate-[fadeInUp_1.2s_ease-out_0.3s_both]">
            <p className="text-3xl font-light text-white italic tracking-wide drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              "Where Imagination Meets Reality"
            </p>
          </div>

          {/* 3. Inspirational Quote with Icon */}
          <div className="text-center max-w-2xl animate-[fadeInUp_1.2s_ease-out_0.6s_both]">
            <svg className="w-10 h-10 mx-auto text-purple-300 opacity-60 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-2xl font-semibold text-white leading-relaxed drop-shadow-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Capturing Moments, Creating Memories
            </p>
          </div>

          {/* 4. Description */}
          <div className="text-center max-w-xl animate-[fadeInUp_1.2s_ease-out_0.9s_both]">
            <p className="text-lg text-purple-100 leading-relaxed drop-shadow-md" style={{ fontFamily: "'Inter', sans-serif" }}>
              Transform your ideas into stunning 3D masterpieces with the power of AI
            </p>
          </div>

          {/* 5. Stats - Horizontal Line */}
          <div className="flex items-center justify-center gap-8 animate-[fadeInUp_1.2s_ease-out_1.2s_both]">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-300 mb-1 drop-shadow-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>50K+</div>
              <div className="text-sm text-purple-200 font-medium tracking-wide">Models Created</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-purple-400 to-transparent" />
            <div className="text-center">
              <div className="text-5xl font-bold text-pink-300 mb-1 drop-shadow-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>10K+</div>
              <div className="text-sm text-pink-200 font-medium tracking-wide">Happy Creators</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-pink-400 to-transparent" />
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-300 mb-1 drop-shadow-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>99%</div>
              <div className="text-sm text-blue-200 font-medium tracking-wide">Satisfaction</div>
            </div>
          </div>

          {/* 6. Mini Quotes under stats */}
          <div className="flex items-center justify-center gap-12 animate-[fadeInUp_1.2s_ease-out_1.5s_both]">
            <p className="text-xs text-purple-300 italic">"Every creation tells a story"</p>
            <p className="text-xs text-pink-300 italic">"Building dreams together"</p>
            <p className="text-xs text-blue-300 italic">"Excellence in every pixel"</p>
          </div>

          {/* 7. Success Quote */}
          <div className="text-center animate-[fadeInUp_1.2s_ease-out_1.8s_both]">
            <p className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 drop-shadow-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ✨ "Success is not final, creativity is not limited - Keep creating!" ✨
            </p>
          </div>

          {/* 8. Final Tagline */}
          <div className="text-center animate-[fadeInUp_1.2s_ease-out_2.1s_both]">
            <p className="text-base text-gray-300 font-light tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              Bring Your Ideas to Life
            </p>
          </div>
        </div>

        {/* Animated Floating Particles - More Subtle */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full blur-sm opacity-60 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full blur-sm opacity-60 animate-[float_8s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-400 rounded-full blur-sm opacity-60 animate-[float_7s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full blur-sm opacity-60 animate-[float_9s_ease-in-out_infinite_3s]" />
        <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 bg-purple-300 rounded-full blur-sm opacity-50 animate-[float_10s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-2/3 right-1/5 w-2 h-2 bg-pink-300 rounded-full blur-sm opacity-50 animate-[float_11s_ease-in-out_infinite_2.5s]" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>3DGENI</h1>
            <p className="text-gray-400 text-sm">Bring Your Ideas to Life</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
            {/* Title */}
            <h2 className="text-2xl font-semibold text-white mb-6 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </h2>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={onGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <FcGoogle className="text-2xl" />
                <span>Continue with Google</span>
              </button>
              <button
                onClick={onApple}
                className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <FaApple className="text-2xl" />
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={onEmailPasswordLogin} className="space-y-4">
              {/* Sign Up Additional Fields */}
              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required={isSignUp}
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required={isSignUp}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-white/5 border-white/20"
                          required={isSignUp}
                        />
                        <span className="text-sm text-gray-300">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-white/5 border-white/20"
                          required={isSignUp}
                        />
                        <span className="text-sm text-gray-300">Female</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-white/5 border-white/20"
                          required={isSignUp}
                        />
                        <span className="text-sm text-gray-300">Other</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Remember Me & Forgot Password (Sign In Only) */}
              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transform hover:scale-[1.02] mt-6"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            {/* Terms & Privacy (Sign Up Only) */}
            {isSignUp && (
              <p className="mt-4 text-xs text-center text-gray-400 leading-relaxed">
                By signing up, you agree to our{" "}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-purple-400 hover:text-purple-300">
                  Privacy Policy
                </a>
              </p>
            )}
          </div>

          {/* Toggle Sign In / Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


