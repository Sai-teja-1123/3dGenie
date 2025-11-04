import Navbar from "@/components/navbar";
import PricingCard from "@/components/PricingCard";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const plans = [
  {
    title: "Starter",
    price: 0,
    period: "month",
    features: ["1 model preview", "Low-res export", "Email support"],
    popular: false,
  },
  {
    title: "Pro",
    price: 499,
    period: "month",
    features: ["Unlimited previews", "HD export", "Priority support"],
    popular: true,
  },
  {
    title: "Studio",
    price: 1499,
    period: "month",
    features: ["Team seats", "Commercial license", "Dedicated support"],
    popular: false,
  },
];

const PricingPage = () => {
  const [selected, setSelected] = useState<string>("Pro");
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "netbanking" | "upi">("card");

  // Card fields
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Netbanking
  const [bank, setBank] = useState("");
  const [nbUser, setNbUser] = useState("");
  const [accName, setAccName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  // UPI
  const [upiId, setUpiId] = useState("");

  const isLoggedIn = () => Boolean(localStorage.getItem("auth_token"));

  const handleSelectPlan = (title: string) => {
    if (!isLoggedIn()) {
      navigate(`/login?redirect=/pricing?plan=${encodeURIComponent(title)}`);
      return;
    }
    setSelected(title);
    setCheckoutOpen(true);
  };

  const canPay = () => {
    if (paymentMethod === "card") {
      return cardName && cardNumber.replace(/\D/g, "").length === 16 && /^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardExpiry) && cardCvv.length === 3;
    }
    if (paymentMethod === "netbanking") {
      const ifscOk = /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
      const accOk = accNumber.replace(/\D/g, "").length >= 9; // basic length check
      return Boolean(bank && nbUser && accName && accOk && ifscOk);
    }
    return /^\w+[\w.-]*@\w+$/.test(upiId); // simple UPI format like name@bank
  };

  const onPay = () => {
    if (!isLoggedIn()) {
      navigate(`/login?redirect=/pricing?plan=${encodeURIComponent(selected)}`);
      return;
    }
    alert(`Payment successful for ${selected} plan using ${paymentMethod.toUpperCase()}.`);
    setCheckoutOpen(false);
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold mb-10">Choose the plan that's right for you</h1>
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

        {/* Checkout Panel */}
        {checkoutOpen && (
          <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Checkout - {selected} Plan</h2>
              <button className="text-white/70 hover:text-white" onClick={() => setCheckoutOpen(false)}>Close</button>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-3 mb-6">
              <button
                className={`px-4 py-2 rounded-full border ${paymentMethod === "card" ? "bg-primary text-black border-primary" : "border-white/20 text-white/80"}`}
                onClick={() => setPaymentMethod("card")}
              >
                Credit/Debit Card
              </button>
              <button
                className={`px-4 py-2 rounded-full border ${paymentMethod === "netbanking" ? "bg-primary text-black border-primary" : "border-white/20 text-white/80"}`}
                onClick={() => setPaymentMethod("netbanking")}
              >
                Netbanking
              </button>
              <button
                className={`px-4 py-2 rounded-full border ${paymentMethod === "upi" ? "bg-primary text-black border-primary" : "border-white/20 text-white/80"}`}
                onClick={() => setPaymentMethod("upi")}
              >
                UPI
              </button>
            </div>

            {/* Forms */}
            {paymentMethod === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Cardholder Name</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={cardName} onChange={(e)=>setCardName(e.target.value)} placeholder="Full name on card" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Card Number</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={cardNumber} onChange={(e)=>setCardNumber(e.target.value.replace(/[^\d ]/g, ""))} placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Expiry (MM/YY)</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={cardExpiry} onChange={(e)=>setCardExpiry(e.target.value.replace(/[^\d/]/g, ""))} placeholder="MM/YY" maxLength={5} />
                </div>
                <div>
                  <label className="block text-sm mb-1">CVV</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={cardCvv} onChange={(e)=>setCardCvv(e.target.value.replace(/[^\d]/g, "").slice(0,3))} placeholder="123" />
                </div>
              </div>
            )}

            {paymentMethod === "netbanking" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Select Bank</label>
                  <select className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={bank} onChange={(e)=>setBank(e.target.value)}>
                    <option value="">-- Choose bank --</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>SBI</option>
                    <option>Axis Bank</option>
                    <option>Yes Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Netbanking User ID</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={nbUser} onChange={(e)=>setNbUser(e.target.value)} placeholder="Enter user id" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Account Holder Name</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={accName} onChange={(e)=>setAccName(e.target.value)} placeholder="As per bank records" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Account Number</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2" value={accNumber} onChange={(e)=>setAccNumber(e.target.value.replace(/[^\d]/g, ""))} placeholder="Enter account number" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">IFSC Code</label>
                  <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 max-w-md uppercase" value={ifsc} onChange={(e)=>setIfsc(e.target.value.toUpperCase())} placeholder="SBIN0000001" />
                  <p className="text-xs text-white/60 mt-1">Format: 4 letters, 0, and 6 alphanumerics (e.g., HDFC0ABC123)</p>
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div>
                <label className="block text-sm mb-1">UPI ID</label>
                <input className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 max-w-md" value={upiId} onChange={(e)=>setUpiId(e.target.value)} placeholder="name@bank" />
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/70">You will be charged according to the {selected} plan.</div>
              <button
                disabled={!canPay()}
                onClick={onPay}
                className={`rounded-full px-6 py-2 font-semibold ${canPay() ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
              >
                Pay Now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PricingPage;


