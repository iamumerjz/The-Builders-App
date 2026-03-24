import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthProfile = {
  full_name: string;
  is_labourer: boolean;
  city: string;
  phone: string;
  address: string;
};

interface AuthContext {
  user: User | null;
  profile: AuthProfile | null;
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
  const hasResolvedInitialSession = useRef(false);

  const getFallbackProfile = (currentUser: User): AuthProfile => ({
    full_name: typeof currentUser.user_metadata?.full_name === "string" ? currentUser.user_metadata.full_name : "",
    is_labourer: Boolean(currentUser.user_metadata?.is_labourer),
    city: "",
    phone: "",
    address: "",
  });

  const fetchProfile = async (currentUser: User): Promise<AuthProfile> => {
    const fallbackProfile = getFallbackProfile(currentUser);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!data) {
        return fallbackProfile;
      }

      return {
        full_name: data.full_name || fallbackProfile.full_name,
        is_labourer: data.is_labourer ?? fallbackProfile.is_labourer,
        city: data.city || "",
        phone: data.phone || "",
        address: data.address || "",
      };
    } catch {
      return fallbackProfile;
    }
  };

  useEffect(() => {
    let mounted = true;
    let activeSyncId = 0;

    const syncAuthState = (currentUser: User | null, options?: { blockUi?: boolean }) => {
      const syncId = ++activeSyncId;
      const blockUi = options?.blockUi ?? false;

      setUser(currentUser);

      if (!currentUser) {
        hasResolvedInitialSession.current = true;
        setProfile(null);
        setLoading(false);
        return;
      }

      const fallbackProfile = getFallbackProfile(currentUser);

      if (blockUi) {
        setProfile(fallbackProfile);
        setLoading(true);
      } else {
        setProfile((prev) => prev ?? fallbackProfile);
      }

      void fetchProfile(currentUser)
        .then((nextProfile) => {
          if (!mounted || syncId !== activeSyncId) return;
          setProfile(nextProfile);
        })
        .finally(() => {
          if (!mounted || syncId !== activeSyncId) return;
          hasResolvedInitialSession.current = true;
          setLoading(false);
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      syncAuthState(session?.user ?? null, { blockUi: false });
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      syncAuthState(session?.user ?? null, { blockUi: true });
    });

    return () => {
      mounted = false;
      activeSyncId += 1;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const nextProfile = await fetchProfile(user);
    setProfile(nextProfile);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const isProfileComplete = !!(profile?.full_name && profile?.phone && profile?.city && profile?.address);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, isProfileComplete, refreshProfile, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);