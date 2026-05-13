import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type MessageAttachmentType = "image" | "pdf";

export function signedMessageAttachmentUrl(
  publicId: string,
  attachmentType: MessageAttachmentType,
  options: { forceDownload?: boolean } = {}
): string {
  const resourceType = attachmentType === "pdf" ? "raw" : "image";

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    ...(options.forceDownload ? { flags: "attachment" } : {}),
  });
}

export { cloudinary };
