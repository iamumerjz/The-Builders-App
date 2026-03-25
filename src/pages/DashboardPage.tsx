import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Star, Heart, ChevronRight, Wallet, Users, Briefcase, TrendingUp, MessageSquare, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SkeletonBooking, SkeletonDashboardSidebar } from "@/components/Skeletons";
import NegotiationThread, { Negotiation } from "@/components/NegotiationThread";
import ReviewModal from "@/components/ReviewModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchProProfilesByUserIds } from "@/lib/proProfiles";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past" | "review" | "negotiations" | "saved">("upcoming");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSpent: 0, prosHired: 0, jobsCompleted: 0, avgRating: 0 });
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [workPhotosMap, setWorkPhotosMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/signin"); return; }
    if (profile?.is_labourer) { navigate("/pro-panel"); return; }
    loadData();
  }, [user, authLoading, profile]);

  const loadData = async () => {
    if (!user) return;

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("client_id", user.id)
      .order("booking_date", { ascending: false });

    const proIds = [...new Set((bookingData || []).map((b: any) => b.pro_id))];
    const { data: proProfiles } = await fetchProProfilesByUserIds(proIds);
    const proMap: Record<string, any> = {};
    (proProfiles || []).forEach((p: any) => { proMap[p.user_id] = p; });

    const enrichedBookings = (bookingData || []).map((b: any) => ({
      ...b,
      pro_profiles: proMap[b.pro_id] || null,
    }));
    setBookings(enrichedBookings);

    // Negotiations
    const { data: negData } = await supabase
      .from("negotiations")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    const negProIds = [...new Set((negData || []).map((n: any) => n.pro_id))];
    const { data: negProProfiles } = await fetchProProfilesByUserIds(negProIds);
    const negProMap: Record<string, any> = {};
    (negProProfiles || []).forEach((p: any) => { negProMap[p.user_id] = p; });

    const negs: Negotiation[] = [];
    for (const n of (negData || [])) {
      const { data: msgs } = await supabase
        .from("negotiation_messages")
        .select("*")
        .eq("negotiation_id", (n as any).id)
        .order("created_at", { ascending: true });

      const proInfo = negProMap[(n as any).pro_id];
      negs.push({
        id: (n as any).id,
        proId: (n as any).pro_id,
        proName: proInfo?.full_name || "Pro",
        proAvatar: proInfo?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=P`,
        clientName: "You",
        service: (n as any).service,
        listedRate: (n as any).listed_rate,
        status: (n as any).status as any,
        messages: (msgs || []).map((m: any) => ({
          id: m.id,
          sender: m.sender_role as "client" | "pro",
          type: m.type as any,
          amount: m.amount,
          timestamp: new Date(m.created_at).toLocaleString(),
        })),
      });
    }
    setNegotiations(negs);

    // Favorites
    const { data: favData } = await supabase
      .from("favorites")
      .select("*")
      .eq("client_id", user.id);

    const favProIds = [...new Set((favData || []).map((f: any) => f.pro_id))];
    const { data: favProProfiles } = await fetchProProfilesByUserIds(favProIds);
    const favProMap: Record<string, any> = {};
    (favProProfiles || []).forEach((p: any) => { favProMap[p.user_id] = p; });

    const enrichedFavs = (favData || []).map((f: any) => ({
      ...f,
      pro_profiles: favProMap[f.pro_id] || null,
    }));
    setFavorites(enrichedFavs);

    // Stats
    const allBookings = bookingData || [];
    const completedBookings = allBookings.filter((b: any) => b.status === "completed");
    const totalSpent = allBookings.reduce((sum: number, b: any) => sum + (b.rate || 0), 0);
    const uniquePros = new Set(allBookings.map((b: any) => b.pro_id));

    const { data: myReviews } = await supabase.from("reviews").select("rating").eq("client_id", user.id);
    const avgR = (myReviews && myReviews.length > 0)
      ? Math.round(myReviews.reduce((s: number, r: any) => s + r.rating, 0) / myReviews.length * 10) / 10
      : 0;

    setStats({
      totalSpent,
      prosHired: uniquePros.size,
      jobsCompleted: completedBookings.length,
      avgRating: avgR,
    });

    // Fetch which bookings already have reviews
    const { data: existingReviews } = await supabase.from("reviews").select("booking_id").eq("client_id", user.id);
    const reviewedSet = new Set((existingReviews || []).map((r: any) => r.booking_id).filter(Boolean));
    setReviewedBookings(reviewedSet);

    // Fetch work photos for all bookings
    const bookingIds = (bookingData || []).map((b: any) => b.id);
    if (bookingIds.length > 0) {
      const { data: wpData } = await supabase.from("work_photos").select("*").in("booking_id", bookingIds);
      const wpMap: Record<string, any[]> = {};
      (wpData || []).forEach((wp: any) => {
        if (!wpMap[wp.booking_id]) wpMap[wp.booking_id] = [];
        wpMap[wp.booking_id].push(wp);
      });
      setWorkPhotosMap(wpMap);
    }

    setLoading(false);
  };

  const handleNegotiationAction = async (negId: string, action: "accept" | "reject" | "counter", amount?: number) => {
    if (!user) return;
    
    await supabase.from("negotiation_messages").insert({
      negotiation_id: negId,
      sender_id: user.id,
      sender_role: "client",
      type: action,
      amount: amount || null,
    } as any);

    if (action === "accept" || action === "reject") {
      await supabase.from("negotiations").update({ status: action === "accept" ? "accepted" : "rejected" } as any).eq("id", negId);

      // Sync associated booking status
      const neg = negotiations.find(n => n.id === negId);
      if (neg) {
        const newBookingStatus = action === "accept" ? "accepted" : "rejected";
        await supabase.from("bookings")
          .update({ status: newBookingStatus } as any)
          .eq("client_id", user.id)
          .eq("pro_id", neg.proId)
          .eq("service", neg.service)
          .eq("status", "upcoming");
      }
    }

    loadData();

    if (action === "accept") {
      toast({ title: "Offer Accepted!", description: "The pro will be notified. Get ready for great work!" });
    } else if (action === "reject") {
      toast({ title: "Offer Rejected", description: "You've declined this offer." });
    } else {
      toast({ title: "Counter Sent!", description: `You countered with PKR ${amount}/hr.` });
    }
  };

  // Upcoming: only pending (waiting for pro) and accepted (not completed, not rejected)
  const upcomingBookings = bookings.filter((b: any) =>
    b.status === "upcoming" || b.status === "accepted" || b.status === "confirmed"
  );

  // Past: completed + rejected
  const pastBookings = bookings.filter((b: any) =>
    b.status === "completed" || b.status === "rejected"
  );

  // To Review: completed bookings that haven't been reviewed yet
  const toReviewBookings = bookings.filter((b: any) =>
    b.status === "completed" && !reviewedBookings.has(b.id)
  );

  const displayedBookings = tab === "upcoming" ? upcomingBookings : tab === "past" ? pastBookings : tab === "review" ? toReviewBookings : [];

  const statusLabel = (status: string) => {
    switch (status) {
      case "upcoming": return "Pending";
      case "accepted":
      case "confirmed": return "Accepted";
      case "completed": return "Completed";
      case "rejected": return "Declined";
      default: return status;
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-warning/15 text-warning";
      case "accepted":
      case "confirmed": return "bg-primary/15 text-primary";
      case "completed": return "bg-success/15 text-success";
      case "rejected": return "bg-destructive/15 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8">
          My <span className="text-primary">Dashboard</span>
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Wallet, label: "Total Spent", value: `PKR ${stats.totalSpent.toLocaleString()}`, color: "text-primary" },
            { icon: Users, label: "Pros Hired", value: String(stats.prosHired), color: "text-primary" },
            { icon: Briefcase, label: "Jobs Completed", value: String(stats.jobsCompleted), color: "text-primary" },
            { icon: TrendingUp, label: "Active Negotiations", value: String(negotiations.filter(n => n.status === "active").length), color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="font-heading font-bold text-xl md:text-2xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
            <div>
              <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
                {([
                  { key: "upcoming" as const, label: "Upcoming", count: upcomingBookings.length },
                  { key: "past" as const, label: "Past", count: 0 },
                  { key: "review" as const, label: "To Review", count: toReviewBookings.length },
                  { key: "negotiations" as const, label: "Negotiations", count: negotiations.filter(n => n.status === "active").length },
                  { key: "saved" as const, label: "Saved Pros", count: favorites.length },
                ]).map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`font-heading font-bold text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {t.label}
                    {t.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Past tab header — show total pros hired */}
              {tab === "past" && pastBookings.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-lg text-foreground">{stats.prosHired}</p>
                    <p className="text-xs text-muted-foreground">Total Pros Hired</p>
                  </div>
                </div>
              )}

              {/* Bookings tabs content */}
              {(tab === "upcoming" || tab === "past" || tab === "review") && (
                loading ? <SkeletonBooking /> : (
                  <div className="space-y-4">
                    {displayedBookings.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">
                        {tab === "upcoming" ? "No upcoming bookings." : tab === "past" ? "No past bookings yet." : "All caught up — no reviews pending!"}
                      </p>
                    ) : (
                      displayedBookings.map((booking: any, i: number) => (
                        <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          className="bg-card border border-border rounded-lg p-4 card-hover">
                          <div className="flex items-center gap-4">
                            <img src={booking.pro_profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${booking.pro_profiles?.full_name || "P"}`} alt="" className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-foreground">{booking.pro_profiles?.full_name || "Pro"}</h3>
                              <p className="text-sm text-muted-foreground">{booking.service}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.booking_date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time_slot}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">PKR {booking.rate}/hr</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(booking.status)}`}>
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                          </div>

                          {/* Work Photos */}
                          {(workPhotosMap[booking.id] || []).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Work Photos
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {(workPhotosMap[booking.id] || []).map((wp: any) => (
                                  <img key={wp.id} src={wp.photo_url} alt="Work" className="w-20 h-20 object-cover rounded-lg border border-border" />
                                ))}
                              </div>
                            </div>
                          )}

                          {tab === "review" && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <Button size="sm" onClick={() => setReviewBooking(booking)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                                <Star className="w-3.5 h-3.5 mr-1.5" /> Leave a Review
                              </Button>
                            </div>
                          )}

                          {tab === "past" && booking.status === "completed" && reviewedBookings.has(booking.id) && (
                            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-success">
                              <Star className="w-3.5 h-3.5 fill-success" /> Review submitted
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                )
              )}

              {/* Negotiations tab content */}
              {tab === "negotiations" && (
                loading ? <SkeletonDashboardSidebar /> : (
                  <div className="space-y-4">
                    {negotiations.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">No negotiations yet.</p>
                    ) : (
                      negotiations.map((neg) => (
                        <NegotiationThread key={neg.id} negotiation={neg} viewAs="client" onAction={handleNegotiationAction} />
                      ))
                    )}
                  </div>
                )
              )}

              {/* Saved Pros tab content */}
              {tab === "saved" && (
                loading ? <SkeletonDashboardSidebar /> : (
                  <div className="space-y-3">
                    {favorites.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">No saved pros yet.</p>
                    ) : (
                      favorites.map((fav: any) => (
                        <div key={fav.id} onClick={() => navigate(`/pro/${fav.pro_profiles?.id}`)}
                          className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 card-hover cursor-pointer">
                          <img src={fav.pro_profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${fav.pro_profiles?.full_name || "P"}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{fav.pro_profiles?.full_name || "Pro"}</p>
                            <p className="text-xs text-muted-foreground">{fav.pro_profiles?.profession}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))
                    )}
                  </div>
                )
              )}
            </div>
        </div>
      </div>
      <Footer />

      {reviewBooking && user && (
        <ReviewModal
          open={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          booking={reviewBooking}
          userId={user.id}
          onSubmitted={loadData}
        />
      )}
    </div>
  );
};

export default DashboardPage;