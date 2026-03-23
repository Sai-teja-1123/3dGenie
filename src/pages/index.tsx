import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import LazyWhenVisible from "@/components/LazyWhenVisible";
import { useEffect, lazy } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import HowItWorks from "@/components/howitworks";
import Gallery from "@/components/gallery";
import SocialProof from "@/components/social-proof";
import ShippingBetaBanner from "@/components/shipping-beta-banner";

// Lazy load heavy components - load only when near viewport (IntersectionObserver)
const FeaturesGrid = lazy(() => import("@/components/features-grid"));

// Loading fallback for lazy components
const SectionLoader = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
);

const Index = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const fromHash = location.hash ? location.hash.replace("#", "") : "";
    const fromState =
      navigationType !== "POP" &&
      typeof (location.state as { scrollTo?: unknown } | null)?.scrollTo === "string"
        ? ((location.state as { scrollTo: string }).scrollTo)
        : "";
    const targetId = fromHash || fromState;

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [location.key, location.hash, location.state, navigationType]);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden max-w-[100vw]">
      <Navbar />
      <Hero />
      <section id="how">
        <HowItWorks />
      </section>
      <section id="showcase">
        <Gallery />
      </section>
      <section id="reviews">
        <SocialProof />
      </section>
      <LazyWhenVisible fallback={<SectionLoader />} minHeight="120px">
        {FeaturesGrid}
      </LazyWhenVisible>
      <ShippingBetaBanner />
      <Footer />
    </div>
  );
};

export default Index;
