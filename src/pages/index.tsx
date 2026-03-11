import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import LazyWhenVisible from "@/components/LazyWhenVisible";
import { useEffect, lazy } from "react";

// Lazy load heavy components - load only when near viewport (IntersectionObserver)
const HowItWorks = lazy(() => import("@/components/howitworks"));
const WhyChooseUs = lazy(() => import("@/components/whychoose"));
const Gallery = lazy(() => import("@/components/gallery"));

// Loading fallback for lazy components
const SectionLoader = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden max-w-[100vw]">
      <Navbar />
      <Hero />
      <LazyWhenVisible fallback={<SectionLoader />} minHeight="120px">
        {HowItWorks}
      </LazyWhenVisible>
      <LazyWhenVisible fallback={<SectionLoader />} minHeight="120px">
        {WhyChooseUs}
      </LazyWhenVisible>
      <LazyWhenVisible fallback={<SectionLoader />} minHeight="120px">
        {Gallery}
      </LazyWhenVisible>
      <Footer />
    </div>
  );
};

export default Index;
