import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hammer, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One digit", test: (p: string) => /\d/.test(p) },
  { label: "One special character (!@#$%^&*…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const SignUpPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLabourer, setIsLabourer] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isPasswordValid = passwordRules.every((r) => r.test(password));

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Check if email is already registered
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: "___check_only___" });
    // If error is "Invalid login credentials" the email exists (wrong pw). If "Email not confirmed" also exists.
    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        // Could be existing or not — Supabase returns same error. Use signUp and check identities.
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, is_labourer: isLabourer },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Supabase returns a user with empty identities if email already registered
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({ title: "Email already registered", description: "This email is already in use. Please sign in instead.", variant: "destructive" });
      return;
    }

    toast({ title: "Account created!", description: "Check your email to confirm your account." });
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Hammer className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-2xl text-foreground">
              The <span className="text-primary">Builders</span>
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-2">Join the platform and get started</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5 bg-card p-6 rounded-lg border border-border">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <ul className="space-y-1 mt-2">
                {passwordRules.map((rule) => (
                  <li key={rule.label} className={`text-xs flex items-center gap-1 ${rule.test(password) ? "text-green-600" : "text-destructive"}`}>
                    {rule.test(password) ? "✓" : "✗"} {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-secondary">
            <div>
              <p className="font-medium text-foreground text-sm">I am a Labourer / Pro</p>
              <p className="text-xs text-muted-foreground">Toggle on if you offer services</p>
            </div>
            <Switch checked={isLabourer} onCheckedChange={setIsLabourer} />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading || !isPasswordValid}>
            {loading ? "Creating account…" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;