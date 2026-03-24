import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Save, Plus, X, MapPin, Briefcase, DollarSign, Clock, FileText, Wrench, User, Wallet, Star, CheckCircle, TrendingUp, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NegotiationThread, { Negotiation } from "@/components/NegotiationThread";
import ProJobCard from "@/components/ProJobCard";
import { fetchOwnProProfile, PRO_PROFILES_MISSING_MESSAGE, saveOwnProProfile } from "@/lib/proProfiles";

const availabilityOptions = ["Weekdays", "Weekends", "Evenings", "Mornings", "Flexible"];

const ProPanelPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile: authProfile, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", city: "", state: "", zipCode: "",
    profession: "", bio: "", hourlyRate: "0", yearsExperience: "0",
    responseTime: "< 1 hour", available: true,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [stats, setStats] = useState({ totalEarned: 0, jobsCompleted: 0, avgRating: 0, repeatClients: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [clientProfiles, setClientProfiles] = useState<Record<string, any>>({});
  const [workPhotosMap, setWorkPhotosMap] = useState<Record<string, any[]>>({});
  const [jobTab, setJobTab] = useState<"active" | "completed">("active");
  const [mainTab, setMainTab] = useState<"jobs" | "negotiations" | "profile">("jobs");
  const missingProProfilesNotified = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/signin"); return; }
    if (authProfile && !authProfile.is_labourer) { navigate("/dashboard"); return; }
    loadProData();
  }, [user, authLoading, authProfile]);

  const notifyMissingProProfilesTable = () => {
    if (missingProProfilesNotified.current) return;

    missingProProfilesNotified.current = true;
    toast({
      title: "Pro setup incomplete",
      description: PRO_PROFILES_MISSING_MESSAGE,
      variant: "destructive",
    });
  };

  const loadProData = async () => {
    if (!user) return;

    // Fetch pro profile
    const fallbackName = user.user_metadata?.full_name || "";
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${fallbackName || "P"}`;
    const { data: pp, missingTable } = await fetchOwnProProfile(user.id);

    if (missingTable) {
      notifyMissingProProfilesTable();
    }

    const resolvedFullName = (pp as any)?.full_name || fallbackName;
    const resolvedAvatar = (pp as any)?.avatar_url || fallbackAvatar;

    if (pp) {
      const p = pp as any;
      setProfile({
        fullName: p.full_name || fallbackName, email: user.email || "", phone: p.phone || "",
        city: p.city || "", state: "", zipCode: "",
        profession: p.profession || "", bio: p.bio || "",
        hourlyRate: String(p.hourly_rate || 0), yearsExperience: String(p.years_experience || 0),
        responseTime: p.response_time || "< 1 hour", available: p.available ?? true,
      });
      setSkills(p.skills || []);
      setAvailability(p.availability_schedule || []);
      setAvatarPreview(resolvedAvatar);
    } else {
      setProfile((prev) => ({
        ...prev,
        fullName: fallbackName,
        email: user.email || "",
      }));
      setAvatarPreview(fallbackAvatar);
    }

    // Compute stats from real booking data
    const { data: proBookings } = await supabase.from("bookings").select("*").eq("pro_id", user.id);
    const completedJobs = (proBookings || []).filter((b: any) => b.status === "completed");
    const totalEarned = completedJobs.reduce((sum: number, b: any) => sum + (b.rate || 0), 0);

    // Count repeat clients (clients with >1 booking)
    const clientCounts: Record<string, number> = {};
    completedJobs.forEach((b: any) => { clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1; });
    const repeatClients = Object.values(clientCounts).filter(c => c > 1).length;

    // Fetch review stats
    const { data: reviews } = await supabase.from("reviews").select("rating").eq("pro_id", user.id);
    const avgRating = (reviews && reviews.length > 0)
      ? Math.round(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length * 10) / 10
      : 0;

    setStats({
      totalEarned,
      jobsCompleted: completedJobs.length,
      avgRating,
      repeatClients,
    });

    // Fetch negotiations
    const { data: negData } = await supabase
      .from("negotiations")
      .select("*")
      .eq("pro_id", user.id)
      .order("created_at", { ascending: false });

    // Enrich with client names
    const clientIds = [...new Set((negData || []).map((n: any) => n.client_id))];
    const { data: clientProfiles } = clientIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds)
      : { data: [] };
    const clientMap: Record<string, string> = {};
    (clientProfiles || []).forEach((p: any) => { clientMap[p.user_id] = p.full_name || "Client"; });

    const negs: Negotiation[] = [];
    for (const n of (negData || [])) {
      const { data: msgs } = await supabase
        .from("negotiation_messages")
        .select("*")
        .eq("negotiation_id", (n as any).id)
        .order("created_at", { ascending: true });

      negs.push({
        id: (n as any).id,
        proId: user.id,
        proName: resolvedFullName || "You",
        proAvatar: resolvedAvatar,
        clientName: clientMap[(n as any).client_id] || "Client",
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

    // Fetch bookings for this pro
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("pro_id", user.id)
      .order("booking_date", { ascending: false });

    setBookings(bookingData || []);

    // Fetch client profiles for bookings
    const bookingClientIds = [...new Set((bookingData || []).map((b: any) => b.client_id))];
    if (bookingClientIds.length > 0) {
      const { data: cProfiles } = await supabase.from("profiles").select("*").in("user_id", bookingClientIds);
      const cMap: Record<string, any> = {};
      (cProfiles || []).forEach((p: any) => { cMap[p.user_id] = p; });
      setClientProfiles(cMap);
    }

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

  const handleChange = (field: string, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) { setSkills([...skills, trimmed]); setNewSkill(""); }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const toggleAvailability = (opt: string) => {
    setAvailability((prev) => prev.includes(opt) ? prev.filter((a) => a !== opt) : [...prev, opt]);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" }); return; }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploadingAvatar(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error, missingTable } = await saveOwnProProfile({
      user_id: user.id,
      full_name: profile.fullName || user.user_metadata?.full_name || "",
      phone: profile.phone,
      city: profile.city,
      profession: profile.profession,
      bio: profile.bio,
      hourly_rate: parseInt(profile.hourlyRate) || 0,
      years_experience: parseInt(profile.yearsExperience) || 0,
      response_time: profile.responseTime,
      available: profile.available,
      skills,
      availability_schedule: availability,
      avatar_url: avatarUrl,
    });

    if (missingTable) {
      notifyMissingProProfilesTable();
      setUploadingAvatar(false);
      return;
    }

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    setAvatarPreview(avatarUrl);
    setUploadingAvatar(false);
    toast({ title: "Photo updated!", description: "Your profile photo has been saved." });
  };

  const handleSave = async () => {
    if (!user) return;
    const rate = parseInt(profile.hourlyRate) || 0;
    if (rate < 500) {
      toast({ title: "Invalid rate", description: "Hourly rate must be at least PKR 500.", variant: "destructive" });
      return;
    }
    const { error, missingTable } = await saveOwnProProfile({
      user_id: user.id,
      full_name: profile.fullName,
      phone: profile.phone,
      city: profile.city,
      profession: profile.profession,
      bio: profile.bio,
      hourly_rate: parseInt(profile.hourlyRate) || 0,
      years_experience: parseInt(profile.yearsExperience) || 0,
      response_time: profile.responseTime,
      available: profile.available,
      skills,
      availability_schedule: availability,
      avatar_url: avatarPreview,
    });

    if (missingTable) {
      notifyMissingProProfilesTable();
      return;
    }

    if (error) {
      toast({ title: "Error", description: error.message || "Failed to save. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", description: "Your changes have been saved successfully." });
    }
  };

  const handleNegotiationAction = async (negId: string, action: "accept" | "reject" | "counter", amount?: number) => {
    if (!user) return;
    await supabase.from("negotiation_messages").insert({
      negotiation_id: negId,
      sender_id: user.id,
      sender_role: "pro",
      type: action,
      amount: amount || null,
    } as any);

    if (action === "accept" || action === "reject") {
      await supabase.from("negotiations").update({ status: action === "accept" ? "accepted" : "rejected" } as any).eq("id", negId);
    }

    loadProData();
    if (action === "accept") toast({ title: "Offer accepted!", description: "The client will be notified." });
    else if (action === "reject") toast({ title: "Offer rejected", description: "The client will be notified." });
    else toast({ title: "Counter sent!", description: `You offered PKR ${amount}/hr.` });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto pt-24 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div>
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
            Pro <span className="text-primary">Panel</span>
          </h1>
          <p className="text-muted-foreground mb-6">Manage your professional profile and services</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Wallet, label: "Total Earned", value: `PKR ${stats.totalEarned.toLocaleString()}` },
              { icon: CheckCircle, label: "Jobs Completed", value: String(stats.jobsCompleted) },
              { icon: Star, label: "Avg. Rating", value: stats.avgRating > 0 ? String(stats.avgRating) : "New" },
              { icon: TrendingUp, label: "Repeat Clients", value: String(stats.repeatClients) },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><stat.icon className="w-5 h-5 text-primary" /></div>
                </div>
                <p className="font-heading font-bold text-xl md:text-2xl text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-border">
            {([
              { key: "jobs" as const, label: "Jobs", icon: Briefcase, count: bookings.filter((b: any) => ["upcoming", "confirmed", "accepted"].includes(b.status)).length },
              { key: "negotiations" as const, label: "Negotiations", icon: MessageSquare, count: negotiations.filter(n => n.status === "active").length },
              { key: "profile" as const, label: "Profile", icon: Settings, count: 0 },
            ]).map((t) => (
              <button key={t.key} onClick={() => setMainTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 font-heading font-bold text-sm uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${mainTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${mainTab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Jobs Tab */}
          {mainTab === "jobs" && (
            <div>
              <div className="flex gap-4 mb-4">
                {(["active", "completed"] as const).map((t) => {
                  const count = bookings.filter((b: any) => t === "active" ? (b.status === "upcoming" || b.status === "confirmed" || b.status === "accepted") : b.status === "completed").length;
                  return (
                    <button key={t} onClick={() => setJobTab(t)}
                      className={`font-heading font-bold text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${jobTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      {t === "active" ? "Pending / Active" : "Completed"}
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${jobTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {jobTab === "completed" && bookings.filter((b: any) => b.status === "completed").length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-heading font-bold text-lg">{stats.jobsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Total Jobs Completed</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {bookings
                  .filter((b: any) => jobTab === "active" ? (b.status === "upcoming" || b.status === "confirmed" || b.status === "accepted") : b.status === "completed")
                  .map((b: any) => (
                    <ProJobCard key={b.id} booking={b} clientProfile={clientProfiles[b.client_id]} workPhotos={workPhotosMap[b.id] || []} onUpdate={loadProData} />
                  ))
                }
                {bookings.filter((b: any) => jobTab === "active" ? (b.status === "upcoming" || b.status === "confirmed" || b.status === "accepted") : b.status === "completed").length === 0 && (
                  <p className="text-muted-foreground text-sm py-6 text-center">No {jobTab} jobs.</p>
                )}
              </div>
            </div>
          )}

          {/* Negotiations Tab */}
          {mainTab === "negotiations" && (
            <div>
              {negotiations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {negotiations.map((neg) => (
                    <NegotiationThread key={neg.id} negotiation={neg} viewAs="pro" onAction={handleNegotiationAction} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-6 text-center">No negotiations yet.</p>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {mainTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="relative inline-block mb-4">
                    <img src={avatarPreview} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-primary/30" />
                    <label className={`absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer ${uploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingAvatar ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    </label>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">{profile.fullName || "Your Name"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.profession || "Set your profession"}</p>
                  {profile.city && <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{profile.city}</div>}
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-foreground font-heading font-bold">Available for Work</Label>
                    <Switch checked={profile.available} onCheckedChange={(v) => handleChange("available", v)} />
                  </div>
                  <p className="text-xs text-muted-foreground">Toggle off when you're not accepting new jobs</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Schedule</h3>
                  <div className="flex flex-wrap gap-2">
                    {availabilityOptions.map((opt) => (
                      <button key={opt} onClick={() => toggleAvailability(opt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${availability.includes(opt) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading font-bold text-foreground mb-5 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={profile.fullName} onChange={(e) => handleChange("fullName", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" value={profile.phone} onChange={(e) => handleChange("phone", e.target.value)} /></div>
                     <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={profile.city} onChange={(e) => handleChange("city", e.target.value.replace(/[0-9]/g, ""))} /></div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading font-bold text-foreground mb-5 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trade / Profession</Label>
                      <Select value={profile.profession} onValueChange={(v) => handleChange("profession", v)}>
                        <SelectTrigger><SelectValue placeholder="Select profession" /></SelectTrigger>
                        <SelectContent>{categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="yearsExperience">Years of Experience</Label><Input id="yearsExperience" type="number" value={profile.yearsExperience} onChange={(e) => handleChange("yearsExperience", e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (PKR)</Label>
                      <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="hourlyRate" type="number" className="pl-9" min={500} value={profile.hourlyRate} onChange={(e) => handleChange("hourlyRate", e.target.value)} /></div>
                      <p className="text-xs text-muted-foreground">Minimum PKR 500</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Response Time</Label>
                      <Select value={profile.responseTime} onValueChange={(v) => handleChange("responseTime", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="< 30 min">{"< 30 min"}</SelectItem>
                          <SelectItem value="< 1 hour">{"< 1 hour"}</SelectItem>
                          <SelectItem value="< 2 hours">{"< 2 hours"}</SelectItem>
                          <SelectItem value="Same day">Same day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading font-bold text-foreground mb-5 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Bio</h3>
                  <Textarea value={profile.bio} onChange={(e) => handleChange("bio", e.target.value)} rows={4} placeholder="Tell clients about yourself..." className="resize-none" />
                  <p className="text-xs text-muted-foreground mt-2">{profile.bio.length}/500 characters</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading font-bold text-foreground mb-5 flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Skills & Services</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                    <Button variant="outline" size="icon" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ProPanelPage;