"use server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const fetchAboutMe = async () => {
  const { data, error } = await supabase.from("user_settings").select("about_me").single();
  if (error) {
    console.error("Error fetching about me data:", error);
    return null;
  }
  return data.about_me;
};


