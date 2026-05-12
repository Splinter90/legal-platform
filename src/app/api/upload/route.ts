import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { sanitizeFolderName } from "@/lib/validations";

const PUBLIC_UPLOAD_FOLDERS = new Set(["lawyer-applications"]);
const AUTHENTICATED_UPLOAD_FOLDERS = new Set(["lawyers", "general"]);

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

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes (JPG, PNG, WEBP)" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `legal-platform/${folder}`,
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
