import { Box, ChevronRight, Globe, Zap } from "lucide-react";

const FeaturesGrid = () => {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h2 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter text-white">
            Features
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Large Bento Card */}
          <div className="md:col-span-2 bento-card flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 blur-[100px] group-hover:bg-[#00f2ff]/20 transition-colors" />
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#00f2ff]" />
              </div>
              <h3 className="font-hero text-3xl font-bold uppercase tracking-tighter">Custom Hero Modeling</h3>
              <p className="text-white/40 max-w-md leading-relaxed">
                Transform your child&apos;s photo into a stylized 3D character with detail suited for digital
                previews and printable model workflows.
              </p>
            </div>
            <div className="pt-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">v2.5 Core</span>
            </div>
          </div>

          {/* Small Bento Card */}
          <div className="bento-card flex flex-col justify-between group hover:neon-border-orange">
            <div className="w-12 h-12 rounded-2xl bg-[#ff8a00]/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#ff8a00]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-hero text-xl font-bold uppercase tracking-tighter">Style Collection</h3>
              <p className="text-sm text-white/40">Choose from a growing set of hero-inspired character looks.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Small Bento Card */}
          <div className="bento-card flex flex-col justify-between group hover:neon-border-pink">
            <div className="w-12 h-12 rounded-2xl bg-[#ff00d4]/10 flex items-center justify-center">
              <Box className="w-6 h-6 text-[#ff00d4]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-hero text-xl font-bold uppercase tracking-tighter">Flexible Output</h3>
              <p className="text-sm text-white/40">Download output assets and continue in your preferred workflow.</p>
            </div>
          </div>

          {/* Medium Bento Card */}
          <div className="md:col-span-2 bento-card flex items-center justify-between group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7000ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-4 relative">
              <h3 className="font-hero text-3xl font-bold uppercase tracking-tighter">Easy Creation Flow</h3>
              <p className="text-white/40 max-w-sm">
                Upload, choose a style, and generate in minutes with a smooth, guided experience.
              </p>
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00f2ff] font-bold">
                Start Creating <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="hidden lg:block w-32 h-32 glass rounded-full flex items-center justify-center animate-pulse">
              <Zap className="w-12 h-12 text-white/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;

