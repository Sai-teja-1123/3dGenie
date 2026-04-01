import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef } from "react";
import Index from "./pages/index";
import { ApiError, getCurrentUser } from "./services/api";

// Lazy load pages for code splitting - reduces initial bundle by 40-60%
// Index page loaded normally to avoid blank screen issues
const NotFound = lazy(() => import("./pages/notfound"));
const MagicMaker = lazy(() => import("./pages/magicmaker"));
const LoginPage = lazy(() => import("./pages/login"));
const PricingPage = lazy(() => import("./pages/pricing"));
const FAQsPage = lazy(() => import("./pages/help-faqs"));
const ContactPage = lazy(() => import("./pages/help-contact"));
const PrivacyPolicyPage = lazy(() => import("./pages/legal-privacy"));
const TermsOfUsePage = lazy(() => import("./pages/legal-terms"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Wrapper components for lazy-loaded routes
const LazyLoginPage = () => (
  <Suspense fallback={<PageLoader />}>
    <LoginPage />
  </Suspense>
);

const LazyMagicMaker = () => (
  <Suspense fallback={<PageLoader />}>
    <MagicMaker />
  </Suspense>
);

const LazyPricingPage = () => (
  <Suspense fallback={<PageLoader />}>
    <PricingPage />
  </Suspense>
);

const LazyFAQsPage = () => (
  <Suspense fallback={<PageLoader />}>
    <FAQsPage />
  </Suspense>
);

const LazyContactPage = () => (
  <Suspense fallback={<PageLoader />}>
    <ContactPage />
  </Suspense>
);

const LazyPrivacyPolicyPage = () => (
  <Suspense fallback={<PageLoader />}>
    <PrivacyPolicyPage />
  </Suspense>
);

const LazyTermsOfUsePage = () => (
  <Suspense fallback={<PageLoader />}>
    <TermsOfUsePage />
  </Suspense>
);

const LazyNotFound = () => (
  <Suspense fallback={<PageLoader />}>
    <NotFound />
  </Suspense>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const AuthBootstrap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const validatedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    if (validatedTokenRef.current === token) return;
    validatedTokenRef.current = token;

    const validateSession = async () => {
      try {
        const me = await getCurrentUser(token);
        localStorage.setItem("auth_user", JSON.stringify(me.user));
      } catch (error) {
        const statusCode = error instanceof ApiError ? error.statusCode : undefined;
        if (statusCode === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          validatedTokenRef.current = null;
          if (location.pathname !== "/login") {
            const redirect = `${location.pathname}${location.search || ""}`;
            navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
          }
        }
      }
    };

    validateSession();
  }, [location.pathname, location.search, navigate]);

  return null;
};

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthBootstrap />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LazyLoginPage />} />
      <Route path="/magic-maker" element={<LazyMagicMaker />} />
      <Route path="/pricing" element={<LazyPricingPage />} />
      <Route path="/help/faqs" element={<LazyFAQsPage />} />
      <Route path="/help/contact" element={<LazyContactPage />} />
      <Route path="/legal/privacy" element={<LazyPrivacyPolicyPage />} />
      <Route path="/legal/terms" element={<LazyTermsOfUsePage />} />
      <Route path="*" element={<LazyNotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
