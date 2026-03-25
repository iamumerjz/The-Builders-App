import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/lib/mockData";
import { fetchAllProProfiles, fetchProProfileById as fetchProProfileRecordById } from "@/lib/proProfiles";

// Fetch all pro profiles with their average ratings
export const fetchProfessionals = async (): Promise<Professional[]> => {
  const { data: pros, error } = await fetchAllProProfiles();

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
  const { data: p, error } = await fetchProProfileRecordById(id);

  if (error || !p) return null;

  const pro = p as any;

  // Fetch reviews, completed bookings count, and repeat clients in parallel
  const [reviewsRes, jobsRes, clientsRes] = await Promise.all([
    supabase.from("reviews").select("pro_id, rating").eq("pro_id", pro.user_id),
    supabase.from("bookings").select("id").eq("pro_id", pro.user_id).eq("status", "completed"),
    supabase.from("bookings").select("client_id").eq("pro_id", pro.user_id).eq("status", "completed"),
  ]);

  const reviews = reviewsRes.data || [];
  const count = reviews.length;
  const total = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  const jobsDone = (jobsRes.data || []).length;

  // Count repeat clients (clients with more than 1 completed booking)
  const clientCounts: Record<string, number> = {};
  (clientsRes.data || []).forEach((b: any) => {
    clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1;
  });
  const repeatClients = Object.values(clientCounts).filter((c) => c > 1).length;

  return {
    id: pro.id,
    user_id: pro.user_id,
    name: pro.full_name || "Pro",
    profession: pro.profession || "General",
    avatar: pro.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pro.full_name || "P"}`,
    rating: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    reviewCount: count,
    hourlyRate: pro.hourly_rate || 0,
    city: pro.city || "",
    available: pro.available ?? true,
    availability: pro.availability_schedule || [],
    yearsExperience: pro.years_experience || 0,
    jobsCompleted: jobsDone,
    responseTime: pro.response_time || "< 1 hour",
    repeatClients,
    bio: pro.bio || "",
    skills: pro.skills || [],
    portfolio: pro.portfolio || [],
    topRated: pro.top_rated || false,
  };
};

// Fetch reviews for a pro
export const fetchReviewsForPro = async (proUserId: string) => {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*, review_photos(*)")
    .eq("pro_id", proUserId)
    .order("created_at", { ascending: false });

  if (error || !reviews) return [];

  const clientIds = [...new Set(reviews.map((review: any) => review.client_id).filter(Boolean))];
  const { data: clientProfiles } = clientIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds)
    : { data: [] };

  const clientNameMap = new Map(
    (clientProfiles || []).map((profile: any) => [profile.user_id, profile.full_name || "Anonymous"]),
  );

  return reviews.map((review: any) => {
    const author = clientNameMap.get(review.client_id) || "Anonymous";

    return {
      id: review.id,
      author,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${author || "A"}`,
      rating: review.rating,
      date: new Date(review.created_at).toLocaleDateString(),
      text: review.text || "",
      jobType: review.job_type || "",
      photos: (review.review_photos || []).map((photo: any) => photo.photo_url),
    };
  });
};

// Fetch work photos uploaded by a pro
export const fetchWorkPhotosForPro = async (proUserId: string) => {
  const { data: photos } = await supabase
    .from("work_photos")
    .select("*")
    .eq("uploaded_by", proUserId)
    .order("created_at", { ascending: false });

  return photos || [];
};