export type Project = {
    id : string; // UUID or unique identifier
    title : string; // Title of the project
    slug : string; // Slug for the project, used in URLs
    summary : string; // Short summary of the project
    description : string; // Detailed description of the project
    start_date : Date; // Start date of the project
    end_date : Date; // End date of the project (can be null for ongoing projects)
    repository_url : string | null; // URL to the project's repository (e.g., GitHub)
    demo_url : string | null; // URL to the project's demo or live site
    featured : boolean; // Whether the project is featured on the portfolio
    status : "completed" | "in-progress" | "planned"; // Status of the project
    created_at : Date; // Timestamp when the project was created
    updated_at : Date; // Timestamp when the project was last updated
    user_id : string; // ID of the user who created the project
}