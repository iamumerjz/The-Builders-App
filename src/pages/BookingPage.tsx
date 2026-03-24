import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronLeft, CreditCard, Banknote, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { SkeletonBookingStep } from "@/components/Skeletons";
import { timeSlots } from "@/lib/mockData";
import { fetchProfessionalById } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Professional } from "@/lib/mockData";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isProfileComplete, profile: authProfile } = useAuth();
  const [pro, setPro] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [offer, setOffer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardForm, setCardForm] = useState({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchProfessionalById(id).then((data) => {
      setPro(data);
      setLoading(false);
    });
  }, [id]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!pro || !selectedDate) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
    supabase.from("bookings").select("time_slot").eq("pro_id", pro.user_id).eq("booking_date", dateStr).in("status", ["upcoming", "accepted", "completed"]).then(({ data }) => {
      setBookedSlots((data || []).map((b: any) => b.time_slot));
    });
  }, [selectedDate, pro]);

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto pt-24 pb-16 max-w-2xl"><SkeletonBookingStep /></div></div>;
  }

  if (!pro) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Professional not found.</p></div>;
  }

  const service = pro.profession;
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const isCardValid = () => {
    if (paymentMethod !== "card") return true;
    const { cardName, cardNumber, expiry, cvv } = cardForm;
    return cardName.trim().length > 0 && cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3;
  };

  const canNext = () => {
    if (step === 1) return !!selectedDate && !!selectedSlot;
    if (step === 3) return isCardValid();
    return true;
  };

  const stepTitles = ["Pick Date & Time", "Bargain (Optional)", "Confirm & Pay"];

  const handleConfirmBooking = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book." });
      navigate("/signin");
      return;
    }
    if (!isProfileComplete) {
      toast({ title: "Complete your profile", description: "Please fill in all profile details before booking." });
      navigate("/profile");
      return;
    }
    if (authProfile?.is_labourer) {
      toast({ title: "Not allowed", description: "Professionals cannot hire other professionals. Only clients can book services.", variant: "destructive" });
      return;
    }
    if (authProfile?.city && pro.city && authProfile.city.trim().toLowerCase() !== pro.city.trim().toLowerCase()) {
      toast({ title: "Location mismatch", description: `This professional is based in ${pro.city}. You can only hire professionals in your city (${authProfile.city}).`, variant: "destructive" });
      return;
    }

    const bookingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
    const refCode = `BLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const rate = offer ? parseInt(offer) : pro.hourlyRate;

    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      pro_id: pro.user_id,
      service,
      booking_date: bookingDate,
      time_slot: selectedSlot,
      rate,
      status: "upcoming",
      payment_method: paymentMethod,
      reference_code: refCode,
    } as any);

    if (error) {
      toast({ title: "Error", description: "Failed to create booking. Try again.", variant: "destructive" });
      return;
    }

    if (offer) {
      const { data: neg } = await supabase.from("negotiations").insert({
        client_id: user.id,
        pro_id: pro.user_id,
        service,
        listed_rate: pro.hourlyRate,
        status: "active",
      } as any).select().single();

      if (neg) {
        await supabase.from("negotiation_messages").insert({
          negotiation_id: (neg as any).id,
          sender_id: user.id,
          sender_role: "client",
          type: "offer",
          amount: parseInt(offer),
        } as any);
      }
    }

    setStep(4);
    toast({ title: "Booking Confirmed!", description: `Your booking with ${pro.name} has been confirmed.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 max-w-2xl">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Cancel"}
        </button>

        <div className="flex items-center gap-2 mb-8">
          {stepTitles.map((t, i) => (
            <div key={t} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 ${i + 1 < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <h2 className="font-heading font-bold text-xl text-foreground mb-1">Step {step}: {stepTitles[step - 1]}</h2>
        <p className="text-sm text-muted-foreground mb-6">Booking with {pro.name} — {service}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {step === 1 && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-sm text-muted-foreground">{today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="text-xs text-muted-foreground font-medium py-1">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isPast = day < today.getDate();
                    const isSelected = selectedDate === day;
                    return (
                      <button key={day} disabled={isPast} onClick={() => { setSelectedDate(day); setSelectedSlot(""); }}
                        className={`text-xs py-2 rounded transition-all ${isSelected ? "bg-success text-success-foreground font-bold" : !isPast ? "bg-primary/20 text-primary hover:bg-primary/40 cursor-pointer" : "bg-muted/50 text-muted-foreground cursor-not-allowed"}`}>{day}</button>
                    );
                  })}
                </div>
                {selectedDate && (
                  <div>
                    <p className="text-sm text-foreground font-medium mb-2 mt-4">Pick a time</p>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => {
                        const booked = bookedSlots.includes(slot);
                        // Check if slot is in the past for today
                        const isToday = selectedDate === today.getDate();
                        let isPastSlot = false;
                        if (isToday) {
                          const [time, period] = slot.split(" ");
                          const [hrs, mins] = time.split(":").map(Number);
                          let hour24 = period === "PM" && hrs !== 12 ? hrs + 12 : period === "AM" && hrs === 12 ? 0 : hrs;
                          isPastSlot = hour24 < today.getHours() || (hour24 === today.getHours() && (mins || 0) <= today.getMinutes());
                        }
                        const disabled = booked || isPastSlot;
                        return (
                          <button key={slot} disabled={disabled} onClick={() => setSelectedSlot(slot)}
                            className={`text-xs px-4 py-2 rounded-full transition-all ${selectedSlot === slot ? "bg-primary text-primary-foreground font-bold" : disabled ? "bg-muted/50 text-muted-foreground line-through cursor-not-allowed" : "bg-primary/15 text-primary hover:bg-primary/30 cursor-pointer"}`}>{slot}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-sm text-muted-foreground">{pro.name}'s rate: <span className="text-foreground font-bold">PKR {pro.hourlyRate}/hr</span></p>
                <Input placeholder="Your Offer: PKR/hr (optional)" value={offer} onChange={(e) => setOffer(e.target.value)} className="bg-muted border-border text-foreground" />
                <p className="text-xs text-muted-foreground">Pro will confirm within 2 hours</p>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Professional</span><span className="text-foreground">{pro.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="text-foreground">{service}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{today.toLocaleDateString("en-US", { month: "long" })} {selectedDate}, {today.getFullYear()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="text-foreground">{selectedSlot}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="text-foreground font-bold">PKR {offer || pro.hourlyRate}/hr</span></div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Payment Method</p>
                  <div className="flex gap-2">
                    {[{ id: "card", icon: CreditCard, label: "Card" }, { id: "cash", icon: Banknote, label: "Cash" }].map((pm) => (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${paymentMethod === pm.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        <pm.icon className="w-4 h-4" />{pm.label}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethod === "card" && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /><p className="text-sm font-medium text-foreground">Card Details</p></div>
                    <div className="space-y-3">
                      <Input placeholder="Name on Card" value={cardForm.cardName} onChange={(e) => setCardForm(prev => ({ ...prev, cardName: e.target.value }))} className="bg-muted border-border text-foreground" />
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="1234 5678 9012 3456" value={cardForm.cardNumber} onChange={(e) => { let v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19); setCardForm(prev => ({ ...prev, cardNumber: v })); }} className="bg-muted border-border text-foreground pl-10" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setCardForm(prev => ({ ...prev, expiry: v })); }} className="bg-muted border-border text-foreground" />
                        <Input placeholder="CVV" type="password" value={cardForm.cvv} onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); setCardForm(prev => ({ ...prev, cvv: v })); }} className="bg-muted border-border text-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg p-3">
                      <Lock className="w-3 h-3 text-primary flex-shrink-0" /><span>Your payment info is encrypted and secure.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step < 4 && !loading && (
          <div className="mt-6 flex gap-3">
            {step < 3 ? (
              <Button disabled={!canNext()} onClick={() => { setStep(step + 1); toast({ title: `Step ${step} Complete`, description: `Moving to: ${stepTitles[step]}` }); }}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50">Continue</Button>
            ) : (
              <Button disabled={!isCardValid()} onClick={handleConfirmBooking} className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark glow-yellow disabled:opacity-50">Confirm Booking</Button>
            )}
          </div>
        )}

        {step === 4 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />
            </motion.div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Booking Confirmed!</h2>
            <p className="text-sm text-muted-foreground mb-8">You'll receive a confirmation shortly.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground hover:bg-primary-dark">Go to Dashboard</Button>
              <Button variant="outline" onClick={() => navigate("/")} className="border-border text-foreground hover:border-primary">Back Home</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
