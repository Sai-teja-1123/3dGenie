import { Box, ChevronRight, Globe, Zap } from "lucide-react";

const FeaturesGrid = () => {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Large Bento Card */}
          <div className="md:col-span-2 bento-card flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 blur-[100px] group-hover:bg-[#00f2ff]/20 transition-colors" />
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#00f2ff]" />
              </div>
              <h3 className="text-3xl font-bold uppercase tracking-tighter">Neural Geometry Synthesis</h3>
              <p className="text-white/40 max-w-md leading-relaxed">
                Our proprietary engine understands structural integrity and organic forms, generating production-ready
                meshes in seconds.
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
              <h3 className="text-xl font-bold uppercase tracking-tighter">Global PBR</h3>
              <p className="text-sm text-white/40">Automatic generation of roughness, metallic, and normal maps.</p>
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
              <h3 className="text-xl font-bold uppercase tracking-tighter">Multi-Format</h3>
              <p className="text-sm text-white/40">Export to GLB, OBJ, or USDZ with one click.</p>
            </div>
          </div>

          {/* Medium Bento Card */}
          <div className="md:col-span-2 bento-card flex items-center justify-between group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7000ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-4 relative">
              <h3 className="text-3xl font-bold uppercase tracking-tighter">Studio Integration</h3>
              <p className="text-white/40 max-w-sm">
                Seamlessly connect with Blender, Unreal Engine, and Unity.
              </p>
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00f2ff] font-bold">
                View Integrations <ChevronRight className="w-3 h-3" />
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

