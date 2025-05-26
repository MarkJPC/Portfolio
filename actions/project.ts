"use server";
import { createClient } from "@/utils/supabase/server";
import { CreateProjectData, createProjectSchema } from "@/lib/schemas/project";
import { v4 as uuidv4 } from "uuid";

// fetch projects data from supabase
export const fetchProjects = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.from("projects").select("*");
  if (error) {
    console.error("Error fetching projects data:", error);
    return null;
  }
  return data;
};

// fetch project data by id from supabase
export const fetchProjectById = async (id: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching project data:", error);
    return null;
  }
  return data;
};

// create project
export const createProject = async (data: CreateProjectData) => {
  const supabase = await createClient();
    
  // Validate the data against the schema
  const validatedData = createProjectSchema.safeParse(data);

  if (!validatedData.success) {
    console.error("Validation error:", validatedData.error.format());
    return null;
  } else {
    console.log("Validation success:", validatedData.data);
  }

  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
      
  if (userError) {
      console.error("Authentication error:", userError);
      throw new Error(`Authentication failed: ${userError.message}`);
  }
  
  if (!userData.user) {
      console.error("No user found");
      throw new Error("Not authenticated - please log in again");
  }

  console.log("User data:", userData.user);

  // 1. insert the main project record
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
        title: validatedData.data.title,
        summary: validatedData.data.summary,
        description: validatedData.data.description,
        start_date: validatedData.data.start_date,
        end_date: validatedData.data.end_date,
        repository_url: validatedData.data.repository_url,
        demo_url: validatedData.data.demo_url,
        featured: validatedData.data.featured,
        status: validatedData.data.status,
        user_id: userData.user.id,
      })
    .select('id')
    .single();

  if (projectError) {
    console.error("Error inserting project:", projectError);
    return null;
  }

  // 2. handle gallery images
  const galleryImageRecords = [];
  for (const imageData of validatedData.data.gallery_images) {
    // upload to supabase storage
    const fileExt = imageData.file.name.split(".").pop() || "jpg"; // default to jpg if no extension found
    const fileName = `projects/${project.id}/${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, imageData.file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    // get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    // insert the image record into the database
    const { data: galleryRecord, error: galleryError } = await supabase
      .from('gallery_images')
      .insert({
        project_id: project.id,
        image_url: publicUrlData.publicUrl,
        storage_path: fileName,
        caption: imageData.caption,
        alt_text: imageData.alt_text,
        display_order: imageData.display_order,
      })
      .select()
      .single();

    if (galleryError) {
      console.error("Error inserting gallery image record:", galleryError);
      return null;
    }

    galleryImageRecords.push(galleryRecord);
  }

  // 3. handle devlog entries
  const devlogRecords = [];
  for (const devlogData of validatedData.data.devlog_entries) {
    const { data: devlogRecord, error: devlogError } = await supabase
      .from('devlog_entries')
      .insert({
        project_id: project.id,
        title: devlogData.title,
        content: devlogData.content,
        entry_date: devlogData.entry_date,
        milestone_type: devlogData.milestone_type,
      })
      .select()
      .single();

    if (devlogError) {
      console.error("Error inserting devlog entry record:", devlogError);
      return null;
    }

    devlogRecords.push(devlogRecord);
  }

  // 4. handle skill relationships
  if (validatedData.data.skill_ids.length > 0) {
    const skillRelations = validatedData.data.skill_ids.map((skillId) => ({
      project_id: project.id,
      skill_id: skillId,
    }));

    const { error: skillError } = await supabase
      .from("project_skill_map")
      .insert(skillRelations);

    if (skillError) {
      console.error("Error inserting project-skill relations:", skillError);
      return null;
    }
  }

  // 5. handle category relationships
  if (validatedData.data.category_ids.length > 0) {
    const categoryRelations = validatedData.data.category_ids.map((categoryId) => ({
      project_id: project.id,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from("project_category_map")
      .insert(categoryRelations);

    if (categoryError) {
      console.error("Error inserting project-category relations:", categoryError);
      return null;
    }
  }

  return {
    project: {
      ...project,
      gallery_images: galleryImageRecords,
      devlog_entries: devlogRecords,
      skill_ids: validatedData.data.skill_ids,
      category_ids: validatedData.data.category_ids,
    },
    message: "Project created successfully",
  }

};
