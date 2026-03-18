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
    <section className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
      {/* Dark background like reference (subtle cyan/purple glow over black) */}
      <div className="absolute inset-0 bg-black"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00f2ff]/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7000ff]/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-14 items-center lg:items-start">
        {/* Left: text content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">AI 3D Engine Live</span>
          </div>

          <h1 className="text-5xl md:text-[4.8rem] lg:text-[6.4rem] font-extrabold tracking-tight leading-[0.85] uppercase">
            <span className="block text-white">Bring your</span>
            <span className="block">
              <span className="text-[#00f2ff] text-glow-cyan italic font-display lowercase tracking-normal">
                ideas
              </span>{" "}
              <span className="text-white">to</span>
            </span>
            <span className="block text-white">
              life in <span className="text-[#ff8a00]">3D</span>.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed">
            Professional AI-powered 3D content creation. Generate high-fidelity 3D assets in seconds and bring your
            imagination to life.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-gradient-action hover:opacity-90 text-white rounded-full px-8 py-6 text-lg group shadow-[0_0_30px_rgba(112,0,255,0.4)]"
              onClick={() => {
                const token = localStorage.getItem("auth_token");
                if (token) {
                  navigate("/magic-maker");
                } else {
                  navigate(`/login?redirect=/magic-maker`);
                }
              }}
            >
              START CREATING
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
            </Button>
            <button className="flex items-center gap-3 px-8 py-4 rounded-full glass text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-300">
              View Showcase
            </button>
          </div>

          <div className="pt-8 flex flex-wrap gap-8 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold">12k+</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Assets Generated</p>
            </div>
            <div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Uptime Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold">2.4s</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg. Render Time</p>
            </div>
          </div>
        </div>

        {/* Right: 3D model card (like reference Scene3D card, but using our ModelViewer3D) */}
        <div className="relative aspect-square lg:h-[520px] lg:w-full bg-background/60 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div
            ref={viewerContainerRef}
            className="relative w-full h-full touch-none"
            style={{ transform: "translateZ(0)", touchAction: "none" }}
          >
            <ModelViewer3D onFirstInteraction={() => setShowRotateHint(false)} />

            {/* Drag to rotate hint */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
                showRotateHint ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            >
              <span className="rounded-full bg-black/55 backdrop-blur-sm text-white/90 text-sm px-4 py-2 border border-white/10">
                Drag to rotate
              </span>
            </div>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={handleFullscreen}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 z-10"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "View model fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
