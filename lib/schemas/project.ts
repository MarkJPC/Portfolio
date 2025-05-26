// lib/validations/project.ts
import { z } from 'zod';

// Schema for the data coming FROM frontend TO backend
export const createProjectSchema = z.object({
  // Basic project fields
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  description: z.string().min(1, "Description is required"),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  repository_url: z.string().url().nullable().or(z.literal("")),
  demo_url: z.string().url().nullable().or(z.literal("")),
  featured: z.boolean().default(false).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).default('in_progress').optional(),
  
  // Relations (arrays of IDs)
  skill_ids: z.array(z.string().uuid()),
  category_ids: z.array(z.string().uuid()),
  
  // Nested objects
  gallery_images: z.array(z.object({
    file: z.instanceof(File),
    caption: z.string().nullable(),
    alt_text: z.string().min(1, "Alt text is required for accessibility"),
    display_order: z.number().int().min(0).default(0),
  })),
  
  devlog_entries: z.array(z.object({
    title: z.string().min(1, "Devlog title is required"),
    content: z.string().min(1, "Devlog content is required"),
    entry_date: z.coerce.date(),
    milestone_type: z.string().optional(),
  })),
});

export type CreateProjectData = z.infer<typeof createProjectSchema>;

export const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  description: z.string().min(1, "Description is required"),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  repository_url: z.string().nullable(),
  demo_url: z.string().nullable(),
  featured: z.boolean().default(false).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).default('in_progress').optional(),
  skill_ids: z.array(z.string().uuid()),
  category_ids: z.array(z.string().uuid()),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
