export type DevlogEntry = {
    id: string; // UUID or unique identifier
    title: string;
    entry_date: Date;
    content: string; // Markdown content
    milestone_type?: string;
}