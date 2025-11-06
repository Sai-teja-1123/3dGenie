import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ModelViewer3D from "./ModelViewer3D";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Enhanced Background with Multiple Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10"></div>
      <div className="absolute inset-0 bg-gradient-hero opacity-60"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary/25 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Bring Your Ideas to Life
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">with 3DGENI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              See what amazing creations our AI can help you make
            </p>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full px-8 py-6 text-lg group shadow-2xl shadow-primary/25"
              onClick={() => {
                const token = localStorage.getItem("auth_token");
                if (token) {
                  navigate("/magic-maker");
                } else {
                  navigate(`/login?redirect=/magic-maker`);
                }
              }}
            >
              TRY IT NOW
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex items-center gap-3 pt-4">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                We make creativity accessible to everyone with cutting-edge AI technology.
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Enhanced Circular Background with Multiple Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-primary/25 to-transparent rounded-full blur-[80px]"></div>
            <div className="absolute inset-4 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-[60px]"></div>
            
            {/* Main Container with Enhanced Styling */}
            <div className="relative z-10 w-full max-w-xl mx-auto aspect-square bg-gradient-to-br from-primary/15 via-transparent to-accent/10 rounded-full flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
              <div className="w-full h-full rounded-full overflow-hidden">
                <ModelViewer3D />
              </div>
            </div>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full animate-ping"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-accent rounded-full animate-ping delay-300"></div>
            <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-primary rounded-full animate-ping delay-700"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-accent rounded-full animate-ping delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
