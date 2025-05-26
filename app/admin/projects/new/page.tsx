"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import "react-markdown-editor-lite/lib/index.css"; // Import default styles for the editor
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";
import { Skill, ProjectCategory } from "@/lib/schemas/schema";
import { fetchProjectCategories } from "@/utils/supabaseActions";
import { fetchSkills } from "@/actions/skills";
import { ProjectFormData, projectFormSchema, createProjectSchema, CreateProjectData } from "@/lib/schemas/project";
import { createProject } from "@/actions/project";
import { DevlogEntry } from "@/lib/types/devlogEntries";
import { GalleryImage } from "@/lib/types/galleryImages";
import { set } from "zod";

// Dynamically import the Markdown editor
const MarkdownEditor = dynamic(() => import("react-markdown-editor-lite"), { ssr: false });

export default function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // state for project description
  const [description, setDescription] = useState(""); // State for Markdown content
  
  // States for gallery images
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // State for devlog entries
  const [devlogEntries, setDevlogEntries] = useState<DevlogEntry[]>([]);
  const [currentDevlog, setCurrentDevlog] = useState<DevlogEntry>({
    id: "",
    title: "",
    content: "",
    entry_date: new Date(),
    milestone_type: undefined,
  });
  const [devlogContent, setDevlogContent] = useState("");

  // state for skills
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");


  // state for project categories
  const [allCategories, setAllCategories] = useState<ProjectCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      start_date: new Date(),
      end_date: null,
      repository_url: null,
      demo_url: null,
      status: "in_progress",
      featured: false,
      category_ids: [],
      skill_ids: [],
    },
  });

  // Handle file selection for gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newImages: GalleryImage[] = files.map((file, index) => {
      return {
        id: '',
        project_id: '',
        image_url: URL.createObjectURL(file),
        storage_path: '', // This will be set after upload
        file,
        caption: "",
        alt_text: file.name.split('.')[0], // Use filename as default alt text
        display_order: galleryImages.length + index,
        preview: URL.createObjectURL(file),
        created_at: new Date(),
        updated_at: new Date(),
      };
    });
    
    setGalleryImages([...galleryImages, ...newImages]);
  };

  // Remove image from gallery
  const removeImage = (id: string) => {
    const updatedImages = galleryImages.filter(img => img.id !== id);
    // Update display order after removal
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      display_order: index
    }));
    setGalleryImages(reorderedImages);
  };

  // Update image caption or alt text
  const updateImageMeta = (id: string, field: 'caption' | 'alt_text', value: string) => {
    setGalleryImages(galleryImages.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    ));
  };

  // Add a new devlog entry
  const addDevlogEntry = () => {
    // Validate devlog entry
    if (!currentDevlog.title || !devlogContent) {
      alert("Please fill out both title and content for the devlog entry");
      return;
    }

    setDevlogEntries([...devlogEntries, { ...currentDevlog, content: devlogContent }]);
    
    // Reset for the next entry
    setCurrentDevlog({
      id: '',
      title: "",
      content: "",
      entry_date: new Date(),
      milestone_type: undefined,
    });
    setDevlogContent("");
  };

  // Remove a devlog entry
  const removeDevlogEntry = (id: string) => {
    setDevlogEntries(devlogEntries.filter(entry => entry.id !== id));
  };

  // Handle form submission
    const onSubmit = async (data: ProjectFormData) => {

      setLoading(true);
      setError(null);

      const completedData: CreateProjectData = {
        ...data,
        gallery_images: galleryImages.map(img => ({
          file: img.file,
          caption: img.caption || null,
          alt_text: img.alt_text,
          display_order: img.display_order
        })),
        devlog_entries: devlogEntries,
      };

      console.log("Form data to be submitted:", completedData);

      createProject(completedData).then((response) => {
        console.log("Project creation response:", response);

        if (response) {
          setLoading(false);
          console.log("Project created successfully:", response);
          router.push("/admin/projects");
        } else {
          setLoading(false);
          setError("Failed to create project. Please try again.");
        }
      });

    };

  useEffect(() => {
    if (description) {
      setValue("description", description);
    }
  }, [description, setValue]);

  // fetch existing skills and categories
  useEffect(() => {
    fetchSkills().then((data) => {
      if (data) {
        console.log("Fetched skills:", data);
        setAllSkills(data);
      } else {
        setError("Failed to fetch skills data.");
      }
    });

    fetchProjectCategories().then((data) => {
      if (data) {
        console.log("Fetched project categories:", data);
        setAllCategories(data);
      } else {
        setError("Failed to fetch project categories data.");
      }
    });
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 max-w-4xl mx-auto p-6 bg-card text-card-foreground shadow-tech rounded-md my-8"
    >
      <h1 className="text-2xl font-bold">Create Project</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Project Basic Info Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            {/* Title */}
            <div className="mb-4">
              <Label htmlFor="title">Title *</Label>
              <input
                id="title"
                {...register("title")}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            {/* Summary */}
            <div className="mb-4">
              <Label htmlFor="summary">Summary *</Label>
              <textarea
                id="summary"
                {...register("summary")}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                rows={3}
              />
              {errors.summary && <p className="text-red-500 text-sm">{errors.summary.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.start_date && (
                  <p className="text-red-500 text-sm">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.end_date && (
                  <p className="text-red-500 text-sm">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="repository_url">Repository URL</Label>
                <input
                  id="repository_url"
                  type="url"
                  {...register("repository_url")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.repository_url && (
                  <p className="text-red-500 text-sm">{errors.repository_url.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="demo_url">Demo URL</Label>
                <input
                  id="demo_url"
                  type="url"
                  {...register("demo_url")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.demo_url && (
                  <p className="text-red-500 text-sm">{errors.demo_url.message}</p>
                )}
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm">{errors.status.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <input
                  id="featured"
                  type="checkbox"
                  {...register("featured")}
                  className="h-4 w-4"
                />
                <Label htmlFor="featured">Featured Project</Label>
              </div>
            </div>
          </div>

          {/* Gallery Images Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Project Gallery</h2>
            
            <div className="mb-4">
              <Label htmlFor="gallery">Upload Images</Label>
              <input
                id="gallery"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can upload multiple images at once
              </p>
            </div>

            {/* Image preview area */}
            <div className="space-y-4 mt-4">
              {galleryImages.map((image, index) => (
                <div key={image.id} className="border p-3 rounded-md">
                  <div className="flex items-start gap-4">
                    {/* Image preview */}
                    <div className="w-24 h-24 relative">
                      {image.image_url && (
                        <Image
                          src={image.image_url}
                          alt="Preview"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      )}
                    </div>
                    
                    {/* Image metadata fields */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`alt-${image.id}`}>Alt Text *</Label>
                        <input
                          id={`alt-${image.id}`}
                          type="text"
                          value={image.alt_text}
                          onChange={(e) => updateImageMeta(image.id, 'alt_text', e.target.value)}
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`caption-${image.id}`}>Caption</Label>
                        <input
                          id={`caption-${image.id}`}
                          type="text"
                          value={image.caption || ''}
                          onChange={(e) => updateImageMeta(image.id, 'caption', e.target.value)}
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                          placeholder="Optional caption"
                        />
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Project Description</h2>
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="border rounded focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
                <MarkdownEditor
                  value={description}
                  onChange={({ text }) => {
                    setDescription(text);
                    setValue("description", text);
                  }}
                  renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                  config={{
                    view: {
                      menu: true,
                      md: true,
                      html: true,
                    },
                    canView: {
                      menu: true,
                      md: true,
                      html: true,
                    },
                  }}
                  className="markdown-editor"
                  style={{ height: '300px' }}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Developer Logs Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Developer Logs</h2>
            
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="devlog-title">Log Title</Label>
                <input
                  id="devlog-title"
                  value={currentDevlog.title}
                  onChange={(e) => setCurrentDevlog({...currentDevlog, title: e.target.value})}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g., Initial Setup, Added Feature X"
                />
              </div>
              
              <div>
                <Label htmlFor="devlog-date">Log Date</Label>
                <input
                  id="devlog-date"
                  type="date"
                  value={currentDevlog.entry_date instanceof Date ? 
                    currentDevlog.entry_date.toISOString().split('T')[0] : 
                    String(currentDevlog.entry_date)}
                  onChange={(e) => setCurrentDevlog({...currentDevlog, entry_date: e.target.value ? new Date(e.target.value) : new Date()})}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              
              <div>
                <Label htmlFor="devlog-milestone">Milestone Type</Label>
                <select
                  id="devlog-milestone"
                  value={currentDevlog.milestone_type || ''}
                  onChange={(e) => setCurrentDevlog({
                    ...currentDevlog, 
                    milestone_type: e.target.value === '' ? undefined : e.target.value as 'major' | 'minor'
                  })}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="minor">Minor Milestone</option>
                  <option value="major">Major Milestone</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="devlog-content">Log Content</Label>
                <div className="border rounded focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
                  <MarkdownEditor
                    value={devlogContent}
                    onChange={({ text }) => setDevlogContent(text)}
                    renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                    config={{
                      view: {
                        menu: true,
                        md: true,
                        html: true,
                      },
                      canView: {
                        menu: true,
                        md: true,
                        html: true,
                      },
                    }}
                    className="markdown-editor"
                    style={{ height: '200px' }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addDevlogEntry}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Add Developer Log
              </button>
            </div>
            
            {/* Added devlogs display */}
            {devlogEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Added Developer Logs ({devlogEntries.length})</h3>
                <ul className="space-y-2">
                  {devlogEntries.map((entry) => (
                    <li key={entry.id} className="border p-2 rounded flex justify-between items-center">
                      <div>
                        <span className="font-medium">{entry.title}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {entry.entry_date instanceof Date ? entry.entry_date.toISOString().split('T')[0] : entry.entry_date}
                          {entry.milestone_type && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                              entry.milestone_type === 'major' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.milestone_type} milestone
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDevlogEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Project Categories */}
          <div className="border p-4 rounded-md">
            <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id ?? "")}
                      onChange={e => {
                        setSelectedCategoryIds(ids => {
                          let updated = e.target.checked
                          ? [...ids, cat.id]
                          : ids.filter(id => id !== cat.id);
                        return updated.filter((id): id is string => !!id);
                        });
                      }}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
              {/* Optionally, add an input to create a new category 
              <input
                type="text"
                placeholder="Add new category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newCategory.trim()) {
                    handleAddCategory(newCategory.trim());
                  }
                }}
                className="border p-1 rounded mt-2"
              />
              */}
          </div>

          {/* Project Skills */}
          <div className="border p-4 rounded-md">
          <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map(skill => (
                <label key={skill.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedSkillIds.includes(skill.id ?? "")}
                    onChange={e => {
                      setSelectedSkillIds(ids => {
                        let updated = e.target.checked
                          ? [...ids, skill.id]
                          : ids.filter(id => id !== skill.id);
                        return updated.filter((id): id is string => !!id);
                      });
                    }}
                  />
                  {skill.name}
                </label>
              ))}
            </div>
            {/* Optionally, add an input to create a new skill 
            <input
              type="text"
              placeholder="Add new skill"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newSkill.trim()) {
                  handleAddSkill(newSkill.trim());
                }
              }}
              className="border p-1 rounded mt-2"
            />
            */}
          </div> 
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300 hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}