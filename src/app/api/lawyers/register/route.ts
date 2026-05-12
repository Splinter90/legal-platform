import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmail, validateRequired } from "@/lib/validations";
import { geocodeAddress } from "@/lib/geocode";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit({
      key: `register-lawyer:${getClientIp(req)}`,
      limit: 5,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      matricula,
      specialties,
      province,
      city,
      address,
      narrative,
      experience,
      cbuAlias,
      profilePhoto,
      titleDocument,
    } = body;

    const requiredError = validateRequired({
      nombre: firstName,
      apellido: lastName,
      email,
      matrícula: matricula,
      especialidades: specialties,
      provincia: province,
      ciudad: city,
    });
    if (requiredError) {
      return NextResponse.json({ error: requiredError }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 });
    }

    const existing = await prisma.lawyer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 400 }
      );
    }

    const existingClient = await prisma.client.findUnique({ where: { email } });
    if (existingClient) {
      return NextResponse.json(
        { error: "Este email ya está registrado como cliente" },
        { status: 400 }
      );
    }

    const coords = await geocodeAddress(city.trim(), province.trim(), address);

    const lawyer = await prisma.lawyer.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        matricula: matricula.trim(),
        specialties: specialties.trim(),
        province: province.trim(),
        city: city.trim(),
        address: address || null,
        narrative: narrative || null,
        experience: experience || null,
        cbuAlias: cbuAlias || null,
        profilePhoto: profilePhoto || null,
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
        message: `${firstName} ${lastName} se registró y espera aprobación`,
        link: "/admin/lawyers",
      },
    });

    return NextResponse.json({ id: lawyer.id, message: "Solicitud enviada. Un administrador revisará tu perfil." });
  } catch (error) {
    console.error("Lawyer registration error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
