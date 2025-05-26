"use server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// fetch project categories
export const fetchProjectCategories = async () => {
  const { data, error } = await supabase.from("project_categories").select("*");
  if (error) {
    console.error("Error fetching project categories data:", error);
    return null;
  }
  return data;
};

// fetch skill categories
export const fetchSkillCategories = async () => {
  const { data, error } = await supabase.from("skill_categories").select("*");
  if (error) {
    console.error("Error fetching skill categories data:", error);
    return null;
  }
  return data;
};


