import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import HowItWorks from "@/components/howitworks";
import WhyChooseUs from "@/components/whychoose";
import Gallery from "@/components/gallery";
import Footer from "@/components/footer";

const Index = () => {
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
