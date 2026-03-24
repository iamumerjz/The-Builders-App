import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, MapPin, Phone, Mail, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, profile: authProfile, refreshProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (authLoading) return;

      if (!authUser) {
        navigate("/signin");
        return;
      }

      setLoading(true);

      const fallbackName = authProfile?.full_name || authUser.user_metadata?.full_name || "";
      const fallbackPhone = authProfile?.phone || "";
      const fallbackCity = authProfile?.city || "";
      const fallbackAddress = authProfile?.address || "";

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        toast({
          title: "Could not load profile",
          description: error.message,
          variant: "destructive",
        });
      }

      setForm({
        full_name: profile?.full_name?.trim() ? profile.full_name : fallbackName,
        phone: profile?.phone || fallbackPhone,
        city: profile?.city || fallbackCity,
        address: profile?.address || fallbackAddress,
      });

      setLoading(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authProfile, authUser, navigate, toast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (form.phone.trim() && !/^[\d\s\-+()]{7,20}$/.test(form.phone.trim())) {
      newErrors.phone = "Enter a valid phone number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!authUser) {
      toast({ title: "Not signed in", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      user_id: authUser.id,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      is_labourer: authProfile?.is_labourer ?? Boolean(authUser.user_metadata?.is_labourer),
      updated_at: new Date().toISOString(),
    };

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      setSaving(false);
      toast({ title: "Error", description: existingProfileError.message, variant: "destructive" });
      return;
    }

    const saveQuery = existingProfile?.id
      ? supabase
          .from("profiles")
          .update(payload as any)
          .eq("id", existingProfile.id)
          .select("*")
          .single()
      : supabase
          .from("profiles")
          .insert(payload as any)
          .select("*")
          .single();

    const { data: savedProfile, error } = await saveQuery;

    setSaving(false);

    if (error || !savedProfile) {
      toast({ title: "Error", description: error.message || "Failed to update profile. Please try again.", variant: "destructive" });
    } else {
      await refreshProfile();
      setForm({
        full_name: savedProfile.full_name || "",
        phone: (savedProfile as any).phone || "",
        city: (savedProfile as any).city || "",
        address: (savedProfile as any).address || "",
      });
      toast({ title: "Profile updated!", description: "Your details have been saved." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 max-w-lg px-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground">Update your personal details</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className={errors.full_name ? "border-destructive" : ""}
                  maxLength={100}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.full_name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+92 300 1234567"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                  maxLength={20}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Lahore"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value.replace(/[0-9]/g, ""))}
                  className={errors.city ? "border-destructive" : ""}
                  maxLength={100}
                />
                {errors.city && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Full Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="House 12, Block B, Gulberg III"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className={errors.address ? "border-destructive" : ""}
                  maxLength={255}
                />
                {errors.address && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.address}</p>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Profile
                  </span>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;