import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Shield, Clock, Users, Briefcase, RefreshCw, MapPin, Send, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SkeletonReview, SkeletonCalendar } from "@/components/Skeletons";
import { timeSlots } from "@/lib/mockData";
import { fetchProfessionalById, fetchReviewsForPro, fetchWorkPhotosForPro } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Professional, Review } from "@/lib/mockData";

const ProProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isProfileComplete, profile: authProfile } = useAuth();
  const [pro, setPro] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showBargain, setShowBargain] = useState(false);
  const [offer, setOffer] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [workPhotos, setWorkPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const proData = await fetchProfessionalById(id);
      setPro(proData);
      if (proData) {
        const [revs, wPhotos] = await Promise.all([
          fetchReviewsForPro(proData.user_id),
          fetchWorkPhotosForPro(proData.user_id),
        ]);
        setReviews(revs);
        setWorkPhotos(wPhotos);
        // fetch booked slots for today
        if (selectedDate) {
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
          const { data: booked } = await supabase.from("bookings").select("time_slot").eq("pro_id", proData.user_id).eq("booking_date", dateStr);
          setBookedSlots((booked || []).map((b: any) => b.time_slot));
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // Refetch booked slots when date changes
  useEffect(() => {
    if (!pro || !selectedDate) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
    supabase.from("bookings").select("time_slot").eq("pro_id", pro.user_id).eq("booking_date", dateStr).then(({ data }) => {
      setBookedSlots((data || []).map((b: any) => b.time_slot));
    });
  }, [selectedDate, pro]);

  const handleSendOffer = async () => {
    if (!offer || !pro || !user) {
      if (!user) toast({ title: "Sign in required", description: "Please sign in to make an offer." });
      return;
    }
    const { error } = await supabase.from("negotiations").insert({
      client_id: user.id,
      pro_id: pro.user_id,
      service: pro.profession,
      listed_rate: pro.hourlyRate,
      status: "active",
    } as any).select().single();

    if (!error) {
      // Get the negotiation we just created to add message
      const { data: neg } = await supabase.from("negotiations").select("id").eq("client_id", user.id).eq("pro_id", pro.user_id).order("created_at", { ascending: false }).limit(1).single();
      if (neg) {
        await supabase.from("negotiation_messages").insert({
          negotiation_id: (neg as any).id,
          sender_id: user.id,
          sender_role: "client",
          type: "offer",
          amount: parseInt(offer),
        } as any);
      }
      setOfferSent(true);
      toast({ title: "Offer Sent", description: `Your offer of PKR ${offer}/hr has been sent.` });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto pt-24 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <p className="text-muted-foreground">Professional not found.</p>
      </div>
    );
  }

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const filteredReviews = reviewFilter === "all"
    ? reviews
    : reviews.filter((r) =>
        reviewFilter === "below3" ? r.rating <= 3 : r.rating === parseInt(reviewFilter)
      );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-card to-muted blueprint-grid mt-16">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto -mt-20 relative z-10 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-6 items-start mb-10">
          <div className="relative">
            <img src={pro.avatar} alt={pro.name} className="w-28 h-28 rounded-xl object-cover border-4 border-background" />
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background ${pro.available ? "bg-success" : "bg-destructive"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground">{pro.name}</h1>
              <span className="flex items-center gap-1 text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Verified
              </span>
            </div>
            <p className="text-muted-foreground mb-1">{pro.profession} · <MapPin className="w-3.5 h-3.5 inline" /> {pro.city}</p>
            <div className="flex items-center gap-1 mb-4">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-bold text-foreground text-lg">{pro.rating || "New"}</span>
              <span className="text-muted-foreground text-sm">/ 5 ({pro.reviewCount} reviews)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Briefcase, value: pro.jobsCompleted, label: "Jobs Done" },
                { icon: Clock, value: `${pro.yearsExperience} yrs`, label: "Experience" },
                { icon: RefreshCw, value: pro.responseTime, label: "Response" },
                { icon: Users, value: pro.repeatClients, label: "Repeat Clients" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="font-heading font-bold text-foreground text-sm">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Button disabled={!pro.available} className="bg-primary text-primary-foreground hover:bg-primary-dark glow-yellow-sm disabled:opacity-50" onClick={() => {
              if (!user) { toast({ title: "Sign in required", description: "Please sign in to book." }); navigate("/signin"); return; }
              if (authProfile?.is_labourer) { toast({ title: "Not allowed", description: "Professionals cannot hire other professionals. Only clients can book services.", variant: "destructive" }); return; }
              if (!isProfileComplete) { toast({ title: "Complete your profile", description: "Please fill in all profile details before booking." }); navigate("/profile"); return; }
              if (authProfile?.city && pro.city && authProfile.city.trim().toLowerCase() !== pro.city.trim().toLowerCase()) { toast({ title: "Location mismatch", description: `This professional is based in ${pro.city}. You can only hire professionals in your city (${authProfile.city}).`, variant: "destructive" }); return; }
              navigate(`/book/${pro.id}`);
            }}>{pro.available ? "Book a Slot" : "Currently Unavailable"}</Button>
            {/* <Button variant="outline" disabled={!pro.available} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50" onClick={() => {
              if (!user) { toast({ title: "Sign in required", description: "Please sign in first." }); navigate("/signin"); return; }
              if (authProfile?.is_labourer) { toast({ title: "Not allowed", description: "Professionals cannot hire other professionals.", variant: "destructive" }); return; }
              if (!isProfileComplete) { toast({ title: "Complete your profile", description: "Please fill in all profile details first." }); navigate("/profile"); return; }
              if (authProfile?.city && pro.city && authProfile.city.trim().toLowerCase() !== pro.city.trim().toLowerCase()) { toast({ title: "Location mismatch", description: `This professional is based in ${pro.city}. You can only hire professionals in your city (${authProfile.city}).`, variant: "destructive" }); return; }
              setShowBargain(!showBargain);
            }}>Make an Offer</Button> */}
          </div>
        </div>

        {showBargain && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card border border-border rounded-lg p-4 mb-8 max-w-md">
            {offerSent ? (
              <p className="text-success text-sm font-medium">Offer sent! Awaiting response…</p>
            ) : (
              <div className="flex gap-2">
                <Input placeholder={`Your offer (base: PKR ${pro.hourlyRate}/hr)`} value={offer} onChange={(e) => setOffer(e.target.value)} className="bg-muted border-border text-foreground" />
                <Button onClick={handleSendOffer} className="bg-primary text-primary-foreground hover:bg-primary-dark"><Send className="w-4 h-4" /></Button>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-heading font-bold text-xl text-foreground mb-3">About</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{pro.bio || "No bio yet."}</p>
              <div className="flex flex-wrap gap-2">
                {pro.skills.map((s) => (
                  <span key={s} className="text-xs font-semibold uppercase tracking-wider bg-primary/15 text-primary px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-foreground mb-4">Reviews</h2>
              <Tabs value={reviewFilter} onValueChange={setReviewFilter}>
                <TabsList className="bg-card border border-border mb-4">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                  <TabsTrigger value="5" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">5★</TabsTrigger>
                  <TabsTrigger value="4" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">4★</TabsTrigger>
                  <TabsTrigger value="below3" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">3★ & below</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No reviews yet.</p>
                ) : (
                  filteredReviews.map((r) => (
                    <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.author}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: r.rating }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-primary text-primary" />
                            ))}
                            <span className="text-xs text-muted-foreground ml-2">{r.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.text}</p>
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {r.photos.map((photo: string, pi: number) => (
                            <img key={pi} src={photo} alt={`Review photo ${pi + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                          ))}
                        </div>
                      )}
                      {r.jobType && <span className="text-xs text-primary uppercase tracking-wider mt-2 inline-block">{r.jobType}</span>}
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {workPhotos.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-xl text-foreground mb-4">Work Photos</h2>
                <div className="columns-2 md:columns-3 gap-3 space-y-3">
                  {workPhotos.map((wp: any, i: number) => (
                    <motion.div key={wp.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative group rounded-lg overflow-hidden break-inside-avoid">
                      <img src={wp.photo_url} alt={`Work ${i + 1}`} className="w-full rounded-lg" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {pro.portfolio.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-xl text-foreground mb-4">Portfolio</h2>
                <div className="columns-2 md:columns-3 gap-3 space-y-3">
                  {pro.portfolio.map((img, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative group rounded-lg overflow-hidden break-inside-avoid">
                      <img src={img} alt={`Work ${i + 1}`} className="w-full rounded-lg" />
                      <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-sm font-semibold text-foreground">Project #{i + 1}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">Pricing</h3>
              <p className="text-3xl font-bold text-foreground">PKR {pro.hourlyRate}<span className="text-base font-normal text-muted-foreground">/hr</span></p>
              <p className="text-xs text-muted-foreground mt-1">Minimum 2 hours</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">Availability</h3>
              {pro.available ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">{today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <span key={i} className="text-xs text-muted-foreground font-medium py-1">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isPast = day < today.getDate();
                      const isSelected = selectedDate === day;
                      return (
                        <button key={day} disabled={isPast} onClick={() => setSelectedDate(day)}
                          className={`text-xs py-1.5 rounded transition-all ${
                            isSelected ? "bg-success text-success-foreground font-bold"
                            : !isPast ? "bg-primary/20 text-primary hover:bg-primary/40 cursor-pointer"
                            : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                          }`}>{day}</button>
                      );
                    })}
                  </div>
                  {selectedDate && (
                    <div className="mt-4">
                      <p className="text-sm text-foreground font-medium mb-2">Time Slots</p>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => {
                          const booked = bookedSlots.includes(slot);
                          const active = selectedSlot === slot;
                          return (
                            <button key={slot} disabled={booked} onClick={() => setSelectedSlot(slot)}
                              className={`text-xs py-2 rounded transition-all ${
                                active ? "bg-primary text-primary-foreground font-bold"
                                : booked ? "bg-muted/50 text-muted-foreground line-through cursor-not-allowed"
                                : "bg-primary/15 text-primary hover:bg-primary/30 cursor-pointer"
                              }`}>{slot}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedDate && selectedSlot && (
                    <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary-dark glow-yellow-sm" onClick={() => {
                      if (!user) { toast({ title: "Sign in required", description: "Please sign in to book." }); navigate("/signin"); return; }
                      if (authProfile?.is_labourer) { toast({ title: "Not allowed", description: "Professionals cannot hire other professionals.", variant: "destructive" }); return; }
                      if (!isProfileComplete) { toast({ title: "Complete your profile", description: "Please fill in all profile details before booking." }); navigate("/profile"); return; }
                      if (authProfile?.city && pro.city && authProfile.city.trim().toLowerCase() !== pro.city.trim().toLowerCase()) { toast({ title: "Location mismatch", description: `This professional is based in ${pro.city}. You can only hire professionals in your city (${authProfile.city}).`, variant: "destructive" }); return; }
                      navigate(`/book/${pro.id}`);
                    }}>
                      Confirm Booking
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Not Accepting Bookings</p>
                  <p className="text-xs text-muted-foreground">This professional is currently unavailable. Check back later.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProProfilePage;