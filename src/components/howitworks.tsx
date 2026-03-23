import { useEffect, useRef, useState } from "react";
import { Upload, Send, Sparkles } from "lucide-react";
import MiniModel3D from "@/components/MiniModel3D";

const steps = [
  {
    number: "01",
    title: "Upload a photo",
    description:
      "Take or upload a clear front-facing photo of your child. No professional camera needed - a smartphone photo in good lighting works perfectly.",
    tip: "Front-facing, well-lit photos give best results",
    accent: "from-cyan-400 to-cyan-200/20",
    icon: Upload,
    imageSrc: "/Screenshot 2025-11-04 155423.png", // from public folder
  },
  {
    number: "02",
    title: "Pick your hero style",
    description:
      "Pick from our collection of hero styles and create a custom 3D character made from your child's photo. You can choose a look that best matches your child's personality and imagination.",
    tip: "Give your child's hero their own name",
    accent: "from-orange-400 to-orange-200/20",
    icon: Send,
    imageSrc: "/WhatsApp Image 2025-10-28 at 16.48.36_f4197a7b.jpg", // place this image in public/
  },
  {
    number: "03",
    title: "Download your STL file",
    description:
      "Our AI generates a fully print-ready STL file in seconds. Print it on any home 3D printer, or send it to a local print shop, Shapeways, or JLCPCB. Physical shipping is in beta - join the waitlist.",
    tip: "Compatible with all FDM & resin printers",
    accent: "from-violet-400 to-violet-200/20",
    icon: Sparkles,
  },
];

function StepCard({
  index,
  step,
}: {
  index: number;
  step: (typeof steps)[number];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Animate when entering; hide when leaving to re-trigger on scroll back
          if (entry.isIntersecting) {
            setVisible(true);
          } else {
            setVisible(false);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const base =
    "relative glass rounded-2xl p-8 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform";
  const hiddenCommon = "opacity-0 scale-95";
  const shownCommon = "opacity-100 scale-100 hover:border-primary/50";
  const dir = index === 0 ? "-translate-x-24" : index === 2 ? "translate-x-24" : "translate-y-16";
  const shownDir = "translate-x-0 translate-y-0";
  const cls = `${base} ${visible ? `${shownCommon} ${shownDir}` : `${hiddenCommon} ${dir}`}`;

  const Icon = step.icon;

  return (
    <div ref={ref} className={cls} style={{ transitionDelay: `${index * 150}ms` }}>
      <div className={`absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r ${step.accent}`} />

      <div className="relative z-10 space-y-4">
        {step.imageSrc ? (
          <div className="w-full rounded-xl overflow-hidden border border-white/10">
            <img
              src={step.imageSrc}
              alt={step.title}
              className={`${index === 0 ? "h-80 object-contain bg-black/30" : "h-80 object-contain bg-black/30"} w-full rounded-xl`}
            />
          </div>
        ) : index === 2 ? (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <MiniModel3D heightClass="h-80" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        )}

        <div className="text-right text-4xl font-black tracking-[0.08em] text-white/25 [text-shadow:0_0_10px_rgba(255,255,255,0.15)]">
          {step.number}
        </div>

        <h3 className="text-3xl font-bold text-white">{step.title}</h3>
        <p className="text-white/65 leading-relaxed">{step.description}</p>

        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
          ✓ {step.tip}
        </div>
      </div>
    </div>
  );
}

const HowItWorks = () => {
  return (
    <section className="py-32 px-6 relative border-y border-white/5 bg-[#0b0c18]">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-4 text-white">
            How It Works
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            From phone camera to a 3D-printable action figure file - here&apos;s how it works in 3 easy
            steps.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-[16.7%] right-[16.7%] top-7 hidden h-px bg-gradient-to-r from-cyan-400/50 via-violet-400/35 to-orange-400/50 md:block" />
          <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <StepCard key={i} index={i} step={step} />
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
