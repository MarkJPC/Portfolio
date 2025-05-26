"use server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// fetch socials data from supabase
export const fetchSocials = async () => {
  const { data, error } = await supabase.from("user_settings").select("phone_number, email, github_url, linkedin_url").single();
  if (error) {
    console.error("Error fetching socials data:", error);
    return null;
  }
  return data;
};
