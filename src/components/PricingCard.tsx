import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/library/utils";

interface PricingCardProps {
  title: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export const PricingCard = ({
  title,
  price,
  period,
  features,
  isPopular = false,
  isSelected,
  onSelect,
}: PricingCardProps) => {
  const isCustom = title === "Studio";
  const color =
    title === "Starter" ? "#00f2ff" : title === "Pro" ? "#7000ff" : "#ff8a00";
  const displayPrice = isCustom ? "Custom" : `₹${price}`;
  const description =
    title === "Starter"
      ? "Perfect for hobbyists and explorers."
      : title === "Pro"
      ? "For professional creators and studios."
      : "Tailored solutions for large teams.";

  return (
    <div
      className={cn(
        "bento-card flex flex-col justify-between relative group cursor-pointer",
        isPopular && "neon-border-purple scale-105 z-10",
        isSelected && "ring-2 ring-[#00f2ff]"
      )}
      onClick={onSelect}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7000ff] text-white text-[10px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(112,0,255,0.5)]">
          Most Popular
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] uppercase tracking-[0.3em] font-bold"
            style={{ color }}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tighter">
              {displayPrice}
            </span>
            {!isCustom && (
              <span className="text-white/40 text-sm uppercase tracking-widest">
                /{period}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 leading-relaxed">{description}</p>
        </div>

        <div className="h-px bg-white/10 w-full" />

        {/* Features */}
        <ul className="space-y-4">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-xs text-white/60"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}1a` }}
              >
                <Check className="w-2.5 h-2.5" style={{ color }} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Button */}
      <div className="pt-12">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "w-full py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-300",
            isPopular
              ? "bg-gradient-action text-white shadow-[0_0_30px_rgba(112,0,255,0.3)] hover:scale-[1.02]"
              : "glass hover:bg-white/10 text-white"
          )}
        >
          {title === "Starter"
            ? "Get Started"
            : title === "Pro"
            ? "Go Pro"
            : "Contact Sales"}
        </Button>
      </div>
    </div>
  );
};

export default PricingCard;







