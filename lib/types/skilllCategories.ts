export interface SkillCategory {
    id: string;
    name: string; // e.g., "Programming Languages", "Frameworks", etc
    color: string; // Hex color code for UI representation
    created_at: Date; // Timestamp when the category was created
    updated_at: Date; // Timestamp when the category was last updated
}