import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  profile: { full_name: string; is_labourer: boolean; city: string; phone: string; address: string } | null;
  loading: boolean;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({ user: null, profile: null, loading: true, isProfileComplete: false, refreshProfile: async () => {}, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContext["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        is_labourer: data.is_labourer,
        city: data.city || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // First get the existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
      }
      if (mounted) setLoading(false);
    });

    // Then listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Use setTimeout to avoid Supabase auth deadlock, but don't gate loading on it
        // since getSession already handled the initial load
        setTimeout(async () => {
          if (mounted) await fetchProfile(u.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isProfileComplete = !!(profile?.full_name && profile?.phone && profile?.city && profile?.address);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, isProfileComplete, refreshProfile, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
