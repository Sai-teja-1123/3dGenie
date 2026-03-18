import { useEffect, useRef, useState } from "react";
import { Upload, Send, Sparkles } from "lucide-react";
import MiniModel3D from "@/components/MiniModel3D";

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Our user-friendly interface allows for quick setup, and our dedicated support team is ready to assist you every step of the way.",
    icon: Upload,
    imageSrc: "/Screenshot 2025-11-04 155423.png", // from public folder
  },
  {
    number: "02",
    title: "Select & Send",
    description: "Gain valuable insights into your users' preferences, behavior, and frequently asked questions with Casper advanced analytics dashboard",
    icon: Send,
    imageSrc: "/WhatsApp Image 2025-10-28 at 16.48.36_f4197a7b.jpg", // place this image in public/
  },
  {
    number: "03",
    title: "Get Results",
    description: "Receive professional-grade outputs powered by cutting-edge AI technology in minutes, not hours.",
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
      <div className="absolute top-8 left-8 text-6xl font-bold text-white/5">{step.number}</div>
      <div className="relative z-10 space-y-4">
        {step.imageSrc ? (
          <div className="w-full rounded-xl overflow-hidden">
            <img
              src={step.imageSrc}
              alt={step.title}
              className={`${index === 0 ? "h-80 object-contain bg-black/30" : "h-80 object-contain bg-black/30"} w-full rounded-xl`}
            />
          </div>
        ) : index === 2 ? (
          <MiniModel3D heightClass="h-80" />
        ) : (
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        )}
        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
        <p className="text-white/50 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

const HowItWorks = () => {
  return (
    <section className="py-32 px-6 relative border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold uppercase tracking-tight mb-4">
            How Does It Work
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Mi turpis turpis in justo pellentesque id nibh praesent.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <StepCard key={i} index={i} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
