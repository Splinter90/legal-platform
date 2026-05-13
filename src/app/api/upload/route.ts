import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { sanitizeFolderName } from "@/lib/validations";

const PUBLIC_UPLOAD_FOLDERS = new Set(["lawyer-applications"]);
const AUTHENTICATED_UPLOAD_FOLDERS = new Set(["lawyers", "general", "message-attachments"]);

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const DOC_MIME = new Set(["application/pdf"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "general";
    const folder = sanitizeFolderName(rawFolder);

    if (!folder) {
      return NextResponse.json({ error: "Carpeta de destino invalida" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const isPublicApplicationUpload = PUBLIC_UPLOAD_FOLDERS.has(folder);
    const isAuthenticatedUpload = AUTHENTICATED_UPLOAD_FOLDERS.has(folder);

    if (!isPublicApplicationUpload && (!session || !isAuthenticatedUpload)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (folder === "message-attachments") {
      const role = (session?.user as any)?.role;
      if (role !== "client" && role !== "lawyer") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const isMessageAttachment = folder === "message-attachments";
    const isImage = IMAGE_MIME.has(file.type);
    const isPdf = DOC_MIME.has(file.type);

    if (isMessageAttachment) {
      if (!isImage && !isPdf) {
        return NextResponse.json(
          { error: "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF" },
          { status: 400 }
        );
      }
    } else if (!isImage) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes (JPG, PNG, WEBP)" },
        { status: 400 }
      );
    }

    const maxSize = isMessageAttachment ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo no puede superar ${Math.round(maxSize / (1024 * 1024))}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const resourceType: "image" | "raw" = isPdf ? "raw" : "image";
    const deliveryType: "upload" | "authenticated" = isMessageAttachment
      ? "authenticated"
      : "upload";

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
    }>((resolve, reject) => {
      const uploadOptions: any = {
        folder: `legal-platform/${folder}`,
        resource_type: resourceType,
        type: deliveryType,
      };
      if (resourceType === "image") {
        uploadOptions.allowed_formats = ["jpg", "jpeg", "png", "webp"];
      }
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as any);
        })
        .end(buffer);
    });

    return NextResponse.json({
      url: isMessageAttachment ? null : uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      type: isPdf ? "pdf" : "image",
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
