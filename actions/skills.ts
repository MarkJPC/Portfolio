"use server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// fetch skills
export const fetchSkills = async () => {
  const { data, error } = await supabase
    .from("skills").select("*")
    .order('name');
    
  if (error) {
    console.error("Error fetching skills data:", error);
    return null;
  }
  return data;
};

// create skill
export const createSkill = async (data: string) => {
    // check if skill already exists
    const { data: existingSkill, error: checkError } = await supabase
      .from("skills")
      .select("*")
      .eq("name", data)
      .single();
    if (checkError) {
      console.error("Error checking skill existence:", checkError);
      return null;
    }

    // if skill already exists, return null
    if (existingSkill) {
      console.log("Skill already exists:", existingSkill);
      return null;
    }

    
};
