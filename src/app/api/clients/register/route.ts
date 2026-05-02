import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateEmail, validatePassword, validateRequired } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    const requiredError = validateRequired({ nombre: name, email, contraseña: password });
    if (requiredError) {
      return NextResponse.json({ error: requiredError }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existing = await prisma.client.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 400 }
      );
    }

    const existingLawyer = await prisma.lawyer.findUnique({ where: { email: email.toLowerCase() } });
    if (existingLawyer) {
      return NextResponse.json(
        { error: "Este email ya está registrado como abogado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
      },
    });

    return NextResponse.json({ id: client.id, message: "Cuenta creada exitosamente" });
  } catch (error) {
    console.error("Client registration error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
