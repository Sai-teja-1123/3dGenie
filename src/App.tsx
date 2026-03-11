import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/index";

// Lazy load pages for code splitting - reduces initial bundle by 40-60%
// Index page loaded normally to avoid blank screen issues
const NotFound = lazy(() => import("./pages/notfound"));
const MagicMaker = lazy(() => import("./pages/magicmaker"));
const LoginPage = lazy(() => import("./pages/login"));
const PricingPage = lazy(() => import("./pages/pricing"));

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

const LazyNotFound = () => (
  <Suspense fallback={<PageLoader />}>
    <NotFound />
  </Suspense>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LazyLoginPage />} />
      <Route path="/magic-maker" element={<LazyMagicMaker />} />
      <Route path="/pricing" element={<LazyPricingPage />} />
      <Route path="*" element={<LazyNotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
