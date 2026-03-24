import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/lib/mockData";

// Fetch all pro profiles with their average ratings
export const fetchProfessionals = async (): Promise<Professional[]> => {
  const { data: pros, error } = await supabase
    .from("pro_profiles")
    .select("*");

  if (error || !pros) return [];

  // Fetch review stats for all pros
  const proUserIds = pros.map((p: any) => p.user_id);
  const { data: reviews } = await supabase
    .from("reviews")
    .select("pro_id, rating")
    .in("pro_id", proUserIds);

  const reviewMap: Record<string, { total: number; count: number }> = {};
  (reviews || []).forEach((r: any) => {
    if (!reviewMap[r.pro_id]) reviewMap[r.pro_id] = { total: 0, count: 0 };
    reviewMap[r.pro_id].total += r.rating;
    reviewMap[r.pro_id].count += 1;
  });

  return pros.map((p: any) => {
    const stats = reviewMap[p.user_id] || { total: 0, count: 0 };
    return {
      id: p.id,
      user_id: p.user_id,
      name: p.full_name || "Pro",
      profession: p.profession || "General",
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name || "P"}`,
      rating: stats.count > 0 ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
      reviewCount: stats.count,
      hourlyRate: p.hourly_rate || 0,
      city: p.city || "",
      available: p.available ?? true,
      availability: p.availability_schedule || [],
      yearsExperience: p.years_experience || 0,
      jobsCompleted: p.jobs_completed || 0,
      responseTime: p.response_time || "< 1 hour",
      repeatClients: p.repeat_clients || 0,
      bio: p.bio || "",
      skills: p.skills || [],
      portfolio: p.portfolio || [],
      topRated: p.top_rated || false,
    };
  });
};

// Fetch a single pro by pro_profiles.id
export const fetchProfessionalById = async (id: string): Promise<Professional | null> => {
  const { data: p, error } = await supabase
    .from("pro_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !p) return null;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("pro_id, rating")
    .eq("pro_id", (p as any).user_id);

  const count = (reviews || []).length;
  const total = (reviews || []).reduce((sum: number, r: any) => sum + r.rating, 0);

  return {
    id: (p as any).id,
    user_id: (p as any).user_id,
    name: (p as any).full_name || "Pro",
    profession: (p as any).profession || "General",
    avatar: (p as any).avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${(p as any).full_name || "P"}`,
    rating: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    reviewCount: count,
    hourlyRate: (p as any).hourly_rate || 0,
    city: (p as any).city || "",
    available: (p as any).available ?? true,
    availability: (p as any).availability_schedule || [],
    yearsExperience: (p as any).years_experience || 0,
    jobsCompleted: (p as any).jobs_completed || 0,
    responseTime: (p as any).response_time || "< 1 hour",
    repeatClients: (p as any).repeat_clients || 0,
    bio: (p as any).bio || "",
    skills: (p as any).skills || [],
    portfolio: (p as any).portfolio || [],
    topRated: (p as any).top_rated || false,
  };
};

// Fetch reviews for a pro
export const fetchReviewsForPro = async (proUserId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_client_id_fkey(full_name)")
    .eq("pro_id", proUserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    author: r.profiles?.full_name || "Anonymous",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${r.profiles?.full_name || "A"}`,
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString(),
    text: r.text || "",
    jobType: r.job_type || "",
  }));
};
