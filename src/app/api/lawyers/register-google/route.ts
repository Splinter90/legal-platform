import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    const name = session.user.name || "";

    const existing = await prisma.lawyer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        status: existing.status,
      });
    }

    const existingClient = await prisma.client.findUnique({
      where: { email },
      include: {
        _count: { select: { appointments: true, reviews: true, messages: true } },
      },
    });

    let googleId: string | null = null;

    if (existingClient) {
      const hasActivity =
        existingClient._count.appointments > 0 ||
        existingClient._count.reviews > 0 ||
        existingClient._count.messages > 0;

      if (hasActivity) {
        return NextResponse.json(
          { error: "Este email ya está registrado como cliente con actividad. Usá otro email." },
          { status: 400 }
        );
      }

      googleId = existingClient.googleId;
      await prisma.client.delete({ where: { email } });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const lawyer = await prisma.lawyer.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        googleId,
        profilePhoto: session.user.image || null,
        status: "incomplete",
      },
    });

    return NextResponse.json({
      id: lawyer.id,
      status: "incomplete",
    });
  } catch (error) {
    console.error("Google lawyer registration error:", error);
    return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "No se encontró tu cuenta de abogado" }, { status: 404 });
    }

    if (lawyer.status !== "incomplete") {
      return NextResponse.json({ error: "Tu perfil ya fue completado" }, { status: 400 });
    }

    const body = await req.json();
    const {
      firstName, lastName,
      phone, matricula, specialties, province, city,
      address, narrative, experience, profilePhoto, titleDocument,
    } = body;

    if (!firstName || !lastName || !matricula || !specialties || !province || !city) {
      return NextResponse.json(
        { error: "Nombre, apellido, matrícula, especialidades, provincia y ciudad son obligatorios" },
        { status: 400 }
      );
    }

    const coords = await geocodeAddress(city.trim(), province.trim(), address);

    const updatedLawyer = await prisma.lawyer.update({
      where: { email: session.user.email },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || null,
        matricula: matricula.trim(),
        specialties: Array.isArray(specialties) ? specialties.join(",") : specialties.trim(),
        province: province.trim(),
        city: city.trim(),
        address: address || null,
        narrative: narrative || null,
        experience: experience || null,
        profilePhoto: profilePhoto || lawyer.profilePhoto,
        titleDocument: titleDocument || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        status: "pending",
      },
    });

    await prisma.notification.create({
      data: {
        userId: "admin",
        userType: "admin",
        type: "new_lawyer_application",
        title: "Nueva solicitud de abogado",
        message: `${updatedLawyer.firstName} ${updatedLawyer.lastName} completó su registro con Google y espera aprobación`,
        link: "/admin/lawyers",
      },
    });

    return NextResponse.json({ message: "Perfil completado. Un administrador revisará tu solicitud." });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json({ error: "Error al completar perfil" }, { status: 500 });
  }
}
