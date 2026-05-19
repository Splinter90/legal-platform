import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateNumericRange, validatePassword } from "@/lib/validations";
import { isValidScheme } from "@/lib/mp-fees";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.admin.findFirst();
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  return NextResponse.json({
    consultationFee: admin.consultationFee,
    subscriptionFee: admin.subscriptionFee,
    commissionPercent: admin.commissionPercent,
    mpAccreditationScheme: admin.mpAccreditationScheme,
    mpFeePercent: admin.mpFeePercent,
    mpFixedFee: admin.mpFixedFee,
    mpIvaPercent: admin.mpIvaPercent,
    cbuAlias: admin.cbuAlias,
    username: admin.username,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const admin = await prisma.admin.findFirst();
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  const updateData: any = {};

  if (body.consultationFee !== undefined) {
    const feeError = validateNumericRange(body.consultationFee, 100, 1000000, "Tarifa de consulta");
    if (feeError) return NextResponse.json({ error: feeError }, { status: 400 });
    updateData.consultationFee = body.consultationFee;
  }

  if (body.subscriptionFee !== undefined) {
    const subError = validateNumericRange(body.subscriptionFee, 100, 1000000, "Tarifa de suscripción");
    if (subError) return NextResponse.json({ error: subError }, { status: 400 });
    updateData.subscriptionFee = body.subscriptionFee;
  }

  if (body.commissionPercent !== undefined) {
    const commError = validateNumericRange(body.commissionPercent, 0, 50, "Comisión");
    if (commError) return NextResponse.json({ error: commError }, { status: 400 });
    updateData.commissionPercent = body.commissionPercent;
  }

  if (body.mpAccreditationScheme !== undefined) {
    if (!isValidScheme(body.mpAccreditationScheme)) {
      return NextResponse.json({ error: "Esquema de acreditación inválido" }, { status: 400 });
    }
    updateData.mpAccreditationScheme = body.mpAccreditationScheme;
  }

  if (body.mpFeePercent !== undefined) {
    const err = validateNumericRange(body.mpFeePercent, 0, 50, "Tasa MP");
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updateData.mpFeePercent = body.mpFeePercent;
  }

  if (body.mpFixedFee !== undefined) {
    const err = validateNumericRange(body.mpFixedFee, 0, 10000, "Costo fijo MP");
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updateData.mpFixedFee = body.mpFixedFee;
  }

  if (body.mpIvaPercent !== undefined) {
    const err = validateNumericRange(body.mpIvaPercent, 0, 50, "IVA");
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    updateData.mpIvaPercent = body.mpIvaPercent;
  }

  if (body.cbuAlias !== undefined) {
    updateData.cbuAlias = body.cbuAlias || null;
  }

  if (body.username) {
    if (body.username.trim().length < 3) {
      return NextResponse.json({ error: "El usuario debe tener al menos 3 caracteres" }, { status: 400 });
    }
    const existing = await prisma.admin.findUnique({ where: { username: body.username.trim() } });
    if (existing && existing.id !== admin.id) {
      return NextResponse.json({ error: "Ese nombre de usuario ya existe" }, { status: 400 });
    }
    updateData.username = body.username.trim();
  }

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Debes ingresar la contraseña actual" }, { status: 400 });
    }

    const validCurrent = await bcrypt.compare(body.currentPassword, admin.password);
    if (!validCurrent) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
    }

    const pwError = validatePassword(body.newPassword);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

    updateData.password = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: updateData,
  });

  const changedFields = Object.keys(updateData).map((k) =>
    k === "password" ? "password" : k
  );
  await logAdminAction({
    adminId: admin.id,
    action: "settings.update",
    target: "admin",
    targetId: admin.id,
    metadata: { changedFields },
    req,
  });

  return NextResponse.json({
    consultationFee: updated.consultationFee,
    subscriptionFee: updated.subscriptionFee,
    commissionPercent: updated.commissionPercent,
    mpAccreditationScheme: updated.mpAccreditationScheme,
    mpFeePercent: updated.mpFeePercent,
    mpFixedFee: updated.mpFixedFee,
    mpIvaPercent: updated.mpIvaPercent,
    cbuAlias: updated.cbuAlias,
    username: updated.username,
  });
}
