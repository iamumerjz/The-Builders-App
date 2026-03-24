import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [processing, setProcessing] = useState(false);

  // Mock order summary
  const order = {
    proName: "Ahmed Khan",
    service: "Kitchen Cabinets",
    date: "March 18, 2026",
    time: "10:00 AM",
    hours: 4,
    rate: 1500,
  };

  const subtotal = order.hours * order.rate;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleChange = (field: string, value: string) => {
    if (field === "cardNumber") {
      value = value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    }
    if (field === "expiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast({ title: "Payment successful!", description: "Your booking has been confirmed." });
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8">
            <span className="text-primary">Checkout</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-lg text-foreground">Card Payment</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" value={form.cardName} onChange={(e) => handleChange("cardName", e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="cardNumber" className="pl-10" placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={(e) => handleChange("cardNumber", e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" value={form.expiry} onChange={(e) => handleChange("expiry", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" value={form.cvv} onChange={(e) => handleChange("cvv", e.target.value)} required />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg p-3">
                  <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Your payment information is encrypted and secure. We never store your full card details.</span>
                </div>

                <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base" disabled={processing}>
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Pay PKR ${total}`
                  )}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-heading font-bold text-lg text-foreground mb-4">Order Summary</h2>

                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
                    alt={order.proName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{order.proName}</p>
                    <p className="text-xs text-muted-foreground">{order.service}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Date</span>
                    <span className="text-foreground">{order.date}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Time</span>
                    <span className="text-foreground">{order.time}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Duration</span>
                    <span className="text-foreground">{order.hours} hours</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span>
                    <span className="text-foreground">PKR {order.rate}/hr</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">PKR {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span>
                    <span className="text-foreground">PKR {serviceFee}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-heading font-bold text-foreground text-lg">
                  <span>Total</span>
                  <span className="text-primary">PKR {total}</span>
                </div>

                <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Satisfaction guaranteed — full refund if you're not happy</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
