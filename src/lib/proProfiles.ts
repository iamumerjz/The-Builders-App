import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type ProProfile = Tables<"pro_profiles">;
type ProProfileInsert = TablesInsert<"pro_profiles">;

type ProProfileQueryResult<T> = {
  data: T;
  error: PostgrestError | null;
  missingTable: boolean;
};

export const PRO_PROFILES_MISSING_MESSAGE = "Your backend is missing the public.pro_profiles table, so pro accounts cannot save or load their profile yet.";

const isMissingProProfilesTableError = (error: PostgrestError | null) => {
  if (!error) return false;

  const message = error.message.toLowerCase();
  const details = (error.details || "").toLowerCase();

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("could not find the table 'public.pro_profiles'") ||
    message.includes('relation "public.pro_profiles" does not exist') ||
    message.includes('relation "pro_profiles" does not exist') ||
    details.includes("pro_profiles")
  );
};

export const fetchAllProProfiles = async (): Promise<ProProfileQueryResult<ProProfile[]>> => {
  const { data, error } = await supabase.from("pro_profiles").select("*");

  if (isMissingProProfilesTableError(error)) {
    return { data: [], error: null, missingTable: true };
  }

  return { data: data || [], error, missingTable: false };
};

export const fetchOwnProProfile = async (userId: string): Promise<ProProfileQueryResult<ProProfile | null>> => {
  const { data, error } = await supabase.from("pro_profiles").select("*").eq("user_id", userId).maybeSingle();

  if (isMissingProProfilesTableError(error)) {
    return { data: null, error: null, missingTable: true };
  }

  return { data: data || null, error, missingTable: false };
};

export const fetchProProfileById = async (id: string): Promise<ProProfileQueryResult<ProProfile | null>> => {
  const { data, error } = await supabase.from("pro_profiles").select("*").eq("id", id).maybeSingle();

  if (isMissingProProfilesTableError(error)) {
    return { data: null, error: null, missingTable: true };
  }

  return { data: data || null, error, missingTable: false };
};

export const fetchProProfilesByUserIds = async (userIds: string[]): Promise<ProProfileQueryResult<ProProfile[]>> => {
  if (userIds.length === 0) {
    return { data: [], error: null, missingTable: false };
  }

  const { data, error } = await supabase.from("pro_profiles").select("*").in("user_id", userIds);

  if (isMissingProProfilesTableError(error)) {
    return { data: [], error: null, missingTable: true };
  }

  return { data: data || [], error, missingTable: false };
};

export const saveOwnProProfile = async (payload: ProProfileInsert): Promise<ProProfileQueryResult<ProProfile | null>> => {
  const { data, error } = await supabase
    .from("pro_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (isMissingProProfilesTableError(error)) {
    return { data: null, error: null, missingTable: true };
  }

  return { data: data || null, error, missingTable: false };
};