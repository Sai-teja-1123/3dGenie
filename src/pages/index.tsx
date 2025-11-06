import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import HowItWorks from "@/components/howitworks";
import WhyChooseUs from "@/components/whychoose";
import Gallery from "@/components/gallery";
import Footer from "@/components/footer";
<<<<<<< HEAD
import { useEffect } from "react";

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

=======

const Index = () => {
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <WhyChooseUs />
      <Gallery />
      <Footer />
    </div>
  );
};

export default Index;
