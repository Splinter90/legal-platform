import { prisma } from "@/lib/prisma";

const CHAT_ENABLING_STATUSES = ["confirmed", "completed"] as const;

export async function canChat(lawyerId: string, clientId: string): Promise<boolean> {
  const count = await prisma.appointment.count({
    where: {
      lawyerId,
      clientId,
      status: { in: CHAT_ENABLING_STATUSES as unknown as string[] },
    },
  });
  return count > 0;
}

export const CHAT_GATE_MESSAGE =
  "Solo pueden chatear después de que haya al menos una consulta agendada y confirmada entre ustedes.";
