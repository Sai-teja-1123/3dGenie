import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import { useEffect, lazy, Suspense } from "react";

// Lazy load heavy components
const HowItWorks = lazy(() => import("@/components/howitworks"));
const WhyChooseUs = lazy(() => import("@/components/whychoose"));
const Gallery = lazy(() => import("@/components/gallery"));

// Loading fallback component
const SectionLoadingFallback = () => (
  <div className="w-full py-20 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Index = () => {
  useEffect(() => {
    if (window.location.hash === "#contact") {
      const el = document.getElementById("contact");
      if (el) {
        // delay to ensure layout is ready under fixed navbar
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Suspense fallback={<SectionLoadingFallback />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<SectionLoadingFallback />}>
        <WhyChooseUs />
      </Suspense>
      <Suspense fallback={<SectionLoadingFallback />}>
        <Gallery />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
