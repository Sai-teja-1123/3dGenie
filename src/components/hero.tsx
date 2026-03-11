import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Maximize2, Minimize2 } from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";
import ModelViewer3D from "./ModelViewer3D";

const Hero = memo(() => {
  const navigate = useNavigate();
  const [showRotateHint, setShowRotateHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowRotateHint(false), 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    const el = viewerContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col lg:flex lg:items-center pt-20 overflow-hidden">
      {/* Full-bleed violet background */}
      <div className="absolute inset-0 bg-primary/10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-primary/15"></div>
      <div className="absolute inset-0 bg-gradient-hero opacity-60"></div>

      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary/25 rounded-full blur-2xl"></div>

      {/* Text content — on mobile first (above model), on lg overlaid left */}
      <div className="container mx-auto px-6 relative z-10 max-w-[100vw] w-full pointer-events-none flex-shrink-0 pt-2 pb-6 lg:pt-0 lg:pb-0">
        <div className="lg:w-1/2 pointer-events-auto">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Bring Your Ideas to Life
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">with 3DGENI</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
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
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
            </Button>

            <div className="flex items-center gap-3 pt-4">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                We make creativity accessible to everyone with cutting-edge AI technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3D viewer: on mobile below text, fixed aspect so no excess space; on lg absolute overlay */}
      <div
        ref={viewerContainerRef}
        className="relative w-full aspect-square max-h-[58vh] lg:aspect-auto lg:max-h-none lg:absolute lg:inset-y-0 lg:left-0 lg:min-h-0 z-[5] lg:w-[150%] touch-none"
        style={{ transform: 'translateZ(0)', touchAction: 'none' }}
      >
        <div className="w-full h-full lg:min-h-0">
          <ModelViewer3D onFirstInteraction={() => setShowRotateHint(false)} />
        </div>

        {/* Drag to rotate hint */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
            showRotateHint ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        >
          <span className="rounded-full bg-black/50 backdrop-blur-sm text-white/90 text-sm px-4 py-2 border border-white/10">
            Drag to rotate
          </span>
        </div>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={handleFullscreen}
          className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 z-10"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'View model fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Particles */}
      <div className="absolute top-[15%] right-[30%] w-2 h-2 bg-primary rounded-full animate-ping motion-reduce:animate-none z-[6]"></div>
      <div className="absolute top-[12%] right-[15%] w-1 h-1 bg-accent rounded-full animate-ping delay-300 motion-reduce:animate-none z-[6]"></div>
      <div className="absolute bottom-[20%] right-[35%] w-1.5 h-1.5 bg-primary rounded-full animate-ping delay-700 motion-reduce:animate-none z-[6]"></div>
      <div className="absolute bottom-[15%] right-[10%] w-2 h-2 bg-accent rounded-full animate-ping delay-1000 motion-reduce:animate-none z-[6]"></div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
