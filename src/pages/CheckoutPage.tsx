import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StripePaymentForm from "@/components/StripePaymentForm";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const initPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
        body: { amount: total, description: `${order.service} - ${order.proName}` },
      });
      if (fnError || !data?.clientSecret) throw new Error(data?.error || "Failed to initialize payment");
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Initialize payment on mount
  useState(() => { initPayment(); });

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
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-lg text-foreground">Card Payment</h2>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="ml-3 text-muted-foreground text-sm">Initializing payment…</span>
                  </div>
                )}

                {error && !loading && (
                  <div className="text-center py-8">
                    <p className="text-destructive text-sm mb-3">{error}</p>
                    <button onClick={initPayment} className="text-primary underline text-sm">Try again</button>
                  </div>
                )}

                {clientSecret && !loading && (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={total}
                    onSuccess={() => {
                      toast({ title: "Payment successful!", description: "Your booking has been confirmed." });
                      navigate("/dashboard");
                    }}
                    onError={(msg) => toast({ title: "Payment failed", description: msg, variant: "destructive" })}
                  />
                )}
              </div>
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
                    <span>Date</span><span className="text-foreground">{order.date}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Time</span><span className="text-foreground">{order.time}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Duration</span><span className="text-foreground">{order.hours} hours</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span><span className="text-foreground">PKR {order.rate}/hr</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span className="text-foreground">PKR {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span><span className="text-foreground">PKR {serviceFee}</span>
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