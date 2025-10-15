export interface ImageFormatSpecification {
  mime: string; // MIME type of the image format
  extension: string; // extension name of the image format, including the leading dot
  header_length: number; // number of bytes of the header in image files
}
export const ImageFormat = {
  WebP: {
    mime: "image/webp",
    extension: ".webp",
    header_length: 12,
  } as ImageFormatSpecification,
  PNG: {
    mime: "image/png",
    extension: ".png",
    header_length: 33,
  } as ImageFormatSpecification,
};

// see comments in @/procedures/crypto.ts for consideration behind these selections
export const ImageImageFormat = ImageFormat.WebP;
export const ThumbnailImageFormat = ImageFormat.PNG;
