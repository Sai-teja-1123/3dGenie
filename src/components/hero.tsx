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
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-300/35 bg-cyan-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
            </span>
            <span className="text-xs uppercase tracking-[0.14em] text-cyan-300 font-semibold">
              AI-Powered · Ready-to-Print STL Files · Physical Shipping Coming Soon
            </span>
          </div>

          <h1 className="text-[4.3rem] md:text-[5.6rem] lg:text-[6.2rem] font-extrabold tracking-tight leading-[0.94] uppercase">
            <span className="block text-white">Turn your</span>
            <span
              className="block mb-2 uppercase italic font-display font-extrabold tracking-normal text-[#00f2ff] text-glow-cyan md:mb-3"
            >
              CHILD&apos;S PHOTO
            </span>
            <span className="block text-[#f97316]">into 3D.</span>
          </h1>

          <p className="text-base md:text-lg text-white/55 max-w-xl leading-relaxed">
            Upload a photo, pick a <strong className="text-white font-semibold">superhero style</strong>, and get
            a custom <strong className="text-white font-semibold">3D-printable STL file</strong> ready for home
            or print-shop use.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-gradient-action hover:opacity-90 text-white rounded-full px-8 py-5 text-lg group shadow-[0_0_30px_rgba(112,0,255,0.4)]"
              onClick={() => {
                const token = localStorage.getItem("auth_token");
                if (token) {
                  navigate("/magic-maker");
                } else {
                  navigate(`/login?redirect=/magic-maker`);
                }
              }}
            >
              Create Your Hero - Get STL File
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
            </Button>
            <button className="flex items-center gap-3 px-8 py-4 rounded-full glass text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-300">
              View Showcase
            </button>
          </div>

          <div className="pt-3 flex flex-wrap gap-3 text-xs md:text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/75">
              <span>🔒</span>
              <span>Secure photo handling</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/75">
              <span>🖨️</span>
              <span>Print anywhere</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/75">
              <span>⭐</span>
              <span>4.9/5 rating</span>
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
