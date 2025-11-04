import { Zap, Award, Settings, DollarSign } from "lucide-react";

const features = [
  {
    title: "Lightning Fast",
    description: "Get your results in minutes, not hours",
    icon: Zap,
  },
  {
    title: "High Quality",
    description: "Professional-grade outputs every time",
    icon: Award,
  },
  {
    title: "Fully Customizable",
    description: "Fine-tune every aspect to match your vision",
    icon: Settings,
  },
  {
    title: "Affordable Pricing",
    description: "Premium results at accessible prices",
    icon: DollarSign,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Why Choose Us?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We make creativity accessible to everyone with cutting-edge AI technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
