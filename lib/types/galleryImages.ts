export type GalleryImage = {
    id: string; // UUID or unique identifier
    image_url: string; // URL of the image
    caption?: string; // Optional caption for the image
    alt_text: string; // Alt text for accessibility
    display_order: number; // Order in which the image should be displayed
    file: File; // File object for the image, if needed for uploads
}