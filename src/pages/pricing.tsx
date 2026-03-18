import Navbar from "@/components/navbar";
import PricingCard from "@/components/PricingCard";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment } from "@/services/api";
import { ArrowLeft, ChevronsRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; contact?: string };
  theme?: { color?: string };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

const plans = [
  {
    title: "Starter",
    price: 0,
    period: "month",
    features: [
      "5 AI-generated 3D models per month",
      "Basic 2D to 3D conversion",
      "Standard resolution exports (720p)",
      "Email support (48hr response)",
      "Watermarked outputs",
      "Personal use only"
    ],
    popular: false,
  },
  {
    title: "Pro",
    price: 499,
    period: "month",
    features: [
      "Unlimited AI-generated 3D models",
      "Advanced 2D to 3D conversion",
      "High-resolution exports (4K)",
      "Priority support (24hr response)",
      "No watermarks",
      "Commercial license included",
      "Custom character creation",
      "Multiple export formats (OBJ, FBX, GLTF)",
      "Cloud storage (50GB)"
    ],
    popular: true,
  },
  {
    title: "Studio",
    price: 1499,
    period: "month",
    features: [
      "Everything in Pro, plus:",
      "Up to 10 team member seats",
      "Dedicated account manager",
      "API access for integration",
      "Custom workflow automation",
      "Ultra HD exports (8K)",
      "Unlimited cloud storage",
      "White-label options",
      "Advanced animation tools",
      "Priority rendering queue",
      "Custom training on your data",
      "SLA guarantee (99.9% uptime)"
    ],
    popular: false,
  },
];

const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

const PricingPage = () => {
  const [selected, setSelected] = useState<string>("Pro");
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Login redirect states
  const [showLoginHint, setShowLoginHint] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const isLoggedIn = () => Boolean(localStorage.getItem("auth_token"));

  const handleSelectPlan = (title: string) => {
    if (!isLoggedIn()) {
      setSelected(title);
      setShowLoginHint(true);
      setIsRedirecting(true);
      setRedirectCountdown(3);

      let countdownInterval: NodeJS.Timeout;
      countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        navigate(`/login?redirect=/pricing?plan=${encodeURIComponent(title)}`);
      }, 3000);

      return;
    }
    setSelected(title);
    setCheckoutOpen(true);
    setPaymentSuccess(null);
    setPaymentError(null);
  };

  const cancelRedirect = () => {
    setShowLoginHint(false);
    setIsRedirecting(false);
    setRedirectCountdown(3);
  };

  const onPay = async () => {
    if (!isLoggedIn()) {
      navigate(`/login?redirect=/pricing?plan=${encodeURIComponent(selected)}`);
      return;
    }

    // Starter is free - no payment
    const plan = plans.find((p) => p.title === selected);
    if (plan?.price === 0) {
      setPaymentSuccess("Starter plan activated. No payment required.");
      return;
    }

    setIsPaying(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const authToken = localStorage.getItem("auth_token");
      const { order_id, amount, currency, key_id } = await createPaymentOrder(selected, authToken);

      await loadRazorpayScript();

      const options: RazorpayOptions = {
        key: key_id,
        amount,
        currency,
        order_id,
        name: "Compazit",
        description: `${selected} Plan - Monthly Subscription`,
        handler: async (response: RazorpayResponse) => {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setPaymentSuccess(`Payment successful! ${selected} plan activated.`);
            setCheckoutOpen(false);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Payment verification failed";
            setPaymentError(msg);
          } finally {
            setIsPaying(false);
          }
        },
        theme: { color: "#eab308" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setPaymentError("Payment failed. Please try again.");
        setIsPaying(false);
      });
      razorpay.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start payment";
      setPaymentError(msg);
      setIsPaying(false);
    }
  };

  // If user returned from login with ?plan=... and is logged in, open checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get("plan");
    if (p && isLoggedIn()) {
      setSelected(p);
      setCheckoutOpen(true);
    }
  }, [location.search]);

  const selectedPlan = plans.find((p) => p.title === selected);
  const isFreePlan = selectedPlan?.price === 0;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />

      {/* Login Hint Notification */}
      {showLoginHint && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-1000 ease-out ${
            isRedirecting ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
          style={{
            animation: isRedirecting ? 'slideDownFromTop 1s ease-out forwards' : 'none'
          }}
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-6 px-6 shadow-2xl">
            <div className="container mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-2xl font-bold">Login Required</h2>
              </div>
              <p className="text-lg mb-4">
                Please login first to select the <span className="font-bold text-yellow-300">{selected}</span> plan
              </p>
              <div className="flex items-center justify-center gap-2 text-xl font-semibold">
                <span>Redirecting to login page in</span>
                <span className="inline-flex items-center justify-center w-12 h-12 bg-white text-purple-600 rounded-full text-2xl font-bold animate-pulse">
                  {redirectCountdown}
                </span>
                <span>seconds...</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={cancelRedirect}
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-32 pb-24 px-6 relative">
        {/* Background Gradients similar to reference pricing */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative space-y-10">
          {/* Top bar with back + CTA, like reference but using shared navbar */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-3 h-3" />
              Back Home
            </button>
            <Link
              to="/magic-maker"
              className="relative group px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(112,0,255,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-1">
                Get Started
                <ChevronsRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Transparent Pricing</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85]">
            Choose your <br />
            <span className="text-cyan-300 italic lowercase tracking-normal">creative</span> power.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <PricingCard
              key={p.title}
              title={p.title}
              price={p.price}
              period={p.period}
              features={p.features}
              isPopular={p.popular}
              isSelected={selected === p.title}
              onSelect={() => handleSelectPlan(p.title)}
            />
          ))}
        </div>

        {/* Checkout Panel - Razorpay */}
        {checkoutOpen && (
          <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Checkout - {selected} Plan</h2>
              <button className="text-white/70 hover:text-white" onClick={() => setCheckoutOpen(false)}>Close</button>
            </div>

            <div className="space-y-4">
              <p className="text-white/80">
                {selected} plan: ₹{selectedPlan?.price ?? 0}/month
                {isFreePlan && " — No payment required"}
              </p>

              {paymentError && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-2 text-red-200">
                  {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div className="rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-2 text-green-200">
                  {paymentSuccess}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-white/70">
                  {isFreePlan
                    ? "Click below to activate the free plan"
                    : "Secured by Razorpay • Card, UPI, Netbanking"}
                </span>
                <button
                  disabled={isPaying}
                  onClick={onPay}
                  className={`rounded-full px-6 py-2 font-semibold transition-colors ${
                    isPaying
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  }`}
                >
                  {isPaying ? "Opening payment..." : isFreePlan ? "Activate Free Plan" : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
