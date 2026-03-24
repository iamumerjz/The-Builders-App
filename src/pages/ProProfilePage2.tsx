import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, MapPin, Phone, Save, ArrowLeft, AlertCircle, Briefcase, DollarSign, Clock, Camera, Wrench, FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { categories } from "@/lib/mockData";

const availabilityOptions = ["Weekdays", "Weekends", "Evenings", "Mornings", "Flexible"];

const ProProfilePage2 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    profession: "",
    bio: "",
    hourly_rate: "0",
    years_experience: "0",
    response_time: "< 1 hour",
    available: true,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/signin"); return; }
    if (authProfile && !authProfile.is_labourer) { navigate("/dashboard"); return; }
    loadProfile();
  }, [user, authLoading, authProfile]);

  const loadProfile = async () => {
    if (!user) return;
    const { data: pp } = await supabase.from("pro_profiles").select("*").eq("user_id", user.id).single();
    if (pp) {
      const p = pp as any;
      setForm({
        full_name: p.full_name || "",
        phone: p.phone || "",
        city: p.city || "",
        profession: p.profession || "",
        bio: p.bio || "",
        hourly_rate: String(p.hourly_rate || 0),
        years_experience: String(p.years_experience || 0),
        response_time: p.response_time || "< 1 hour",
        available: p.available ?? true,
      });
      setSkills(p.skills || []);
      setAvailability(p.availability_schedule || []);
      setAvatarPreview(p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name || "P"}`);
    }
    setLoading(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.phone.trim() && !/^[\d\s\-+()]{7,20}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.profession) e.profession = "Select your profession";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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
    await supabase.from("pro_profiles").update({ avatar_url: avatarUrl } as any).eq("user_id", user.id);
    setAvatarPreview(avatarUrl);
    setUploadingAvatar(false);
    toast({ title: "Photo updated!", description: "Your profile photo has been saved." });
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("pro_profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      profession: form.profession,
      bio: form.bio.trim(),
      hourly_rate: parseInt(form.hourly_rate) || 0,
      years_experience: parseInt(form.years_experience) || 0,
      response_time: form.response_time,
      available: form.available,
      skills,
      availability_schedule: availability,
    } as any).eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile updated!", description: "Your details have been saved." });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto pt-24 pb-16 max-w-2xl px-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 max-w-2xl px-4">
        <button
          onClick={() => navigate("/pro-panel")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pro Panel
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-3">
              <img src={avatarPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary/30" />
              <label className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer ${uploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingAvatar ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <h1 className="font-heading font-bold text-xl text-foreground">{form.full_name || "Your Name"}</h1>
            <p className="text-sm text-muted-foreground">{form.profession || "Set your profession"}</p>
          </div>

          {/* Personal Info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5 mb-6">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Information</h3>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1.5">Full Name <span className="text-destructive">*</span></Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} className={errors.full_name ? "border-destructive" : ""} maxLength={100} />
              {errors.full_name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.full_name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone <span className="text-destructive">*</span></Label>
                <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className={errors.phone ? "border-destructive" : ""} maxLength={20} />
                {errors.phone && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> City <span className="text-destructive">*</span></Label>
                <Input id="city" value={form.city} onChange={(e) => handleChange("city", e.target.value)} className={errors.city ? "border-destructive" : ""} maxLength={100} />
                {errors.city && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5 mb-6">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trade / Profession <span className="text-destructive">*</span></Label>
                <Select value={form.profession} onValueChange={(v) => handleChange("profession", v)}>
                  <SelectTrigger className={errors.profession ? "border-destructive" : ""}><SelectValue placeholder="Select profession" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.profession && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.profession}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input id="years_experience" type="number" value={form.years_experience} onChange={(e) => handleChange("years_experience", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (PKR)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="hourly_rate" type="number" className="pl-9" value={form.hourly_rate} onChange={(e) => handleChange("hourly_rate", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Response Time</Label>
                <Select value={form.response_time} onValueChange={(v) => handleChange("response_time", v)}>
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

            <div className="flex items-center justify-between pt-2">
              <Label className="text-foreground font-heading font-bold">Available for Work</Label>
              <Switch checked={form.available} onCheckedChange={(v) => handleChange("available", v)} />
            </div>
          </div>

          {/* Bio */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Bio</h3>
            <Textarea value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} rows={4} placeholder="Tell clients about yourself..." className="resize-none" />
            <p className="text-xs text-muted-foreground">{form.bio.length}/500 characters</p>
          </div>

          {/* Skills */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Skills & Services</h3>
            <div className="flex flex-wrap gap-2">
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

          {/* Schedule */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Schedule</h3>
            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map((opt) => (
                <button key={opt} onClick={() => toggleAvailability(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${availability.includes(opt) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</span>
            )}
          </Button>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ProProfilePage2;
