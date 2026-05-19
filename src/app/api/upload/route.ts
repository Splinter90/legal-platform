import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { fromBuffer as detectFileType } from "file-type";
import { sanitizeFolderName } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
    const ip = getClientIp(req);
    const ipLimit = rateLimit({
      key: `upload:ip:${ip}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.ok) return rateLimitResponse(ipLimit);

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

    if (session?.user) {
      const userId = (session.user as any).id as string | undefined;
      if (userId) {
        const userLimit = rateLimit({
          key: `upload:user:${userId}`,
          limit: 30,
          windowMs: 60 * 60 * 1000,
        });
        if (!userLimit.ok) return rateLimitResponse(userLimit);
      }
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

    const detected = await detectFileType(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: "No se pudo determinar el tipo de archivo" },
        { status: 400 }
      );
    }

    const allowedMime = isMessageAttachment
      ? new Set<string>([
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ])
      : new Set<string>(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedMime.has(detected.mime)) {
      return NextResponse.json(
        {
          error: `Contenido del archivo no coincide con el tipo declarado (detectado: ${detected.mime})`,
        },
        { status: 400 }
      );
    }

    const isPdfReal = detected.mime === "application/pdf";
    if (isPdf !== isPdfReal) {
      return NextResponse.json(
        { error: "El tipo declarado no coincide con el contenido real" },
        { status: 400 }
      );
    }

    const resourceType: "image" | "raw" = isPdfReal ? "raw" : "image";

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
    }>((resolve, reject) => {
      const uploadOptions: any = {
        folder: `legal-platform/${folder}`,
        resource_type: resourceType,
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
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      type: isPdfReal ? "pdf" : "image",
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
