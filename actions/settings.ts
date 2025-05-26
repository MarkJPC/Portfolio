"use server";

import { createClient } from "@/utils/supabase/client";
import { UserSettings } from "@/lib/types/settings";

const supabase = createClient();

// fetch settings data from supabase
export const fetchSettings = async () => {
  const { data, error } = await supabase.from("user_settings").select("*").single();
  if (error) {
    console.error("Error fetching settings data:", error);
    return null;
  }
  return data;
};

// submit settings data to supabase
export const submitSettings = async (data: UserSettings) => {
  const { error } = await supabase
    .from("user_settings")
    .update(data)
    .eq("id", data.id);

  if (error) {
    console.error("Error submitting settings data:", error);
    return null;
  }
  return true;
};

