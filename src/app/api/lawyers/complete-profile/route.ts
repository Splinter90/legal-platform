import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequired } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lawyer = await prisma.lawyer.findUnique({
      where: { email: session.user.email },
    });

    if (!lawyer) {
      return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
    }

    if (lawyer.status !== "incomplete" && lawyer.status !== "rejected") {
      return NextResponse.json(
        { error: `No se puede completar perfil en estado "${lawyer.status}"` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      matricula,
      specialties,
      province,
      city,
      address,
      phone,
      narrative,
      experience,
      cbuAlias,
      profilePhoto,
      titleDocument,
    } = body;

    const requiredError = validateRequired({
      matrícula: matricula,
      especialidades: specialties,
      provincia: province,
      ciudad: city,
    });
    if (requiredError) {
      return NextResponse.json({ error: requiredError }, { status: 400 });
    }

    const updated = await prisma.lawyer.update({
      where: { id: lawyer.id },
      data: {
        matricula: matricula.trim(),
        specialties: specialties.trim(),
        province: province.trim(),
        city: city.trim(),
        address: address || null,
        phone: phone || null,
        narrative: narrative || null,
        experience: experience || null,
        cbuAlias: cbuAlias || null,
        profilePhoto: profilePhoto || lawyer.profilePhoto,
        titleDocument: titleDocument || lawyer.titleDocument,
        status: "pending",
      },
    });

    await prisma.notification.create({
      data: {
        userId: "admin",
        userType: "admin",
        type: "new_lawyer_application",
        title: "Nueva solicitud de abogado",
        message: `${updated.firstName} ${updated.lastName} completó su perfil y espera aprobación`,
        link: "/admin/lawyers",
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      message: "Perfil completado. Un administrador revisará tu solicitud.",
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json({ error: "Error al completar perfil" }, { status: 500 });
  }
}
