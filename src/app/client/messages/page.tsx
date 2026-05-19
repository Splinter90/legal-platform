"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Paperclip,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SkeletonMessageList } from "@/components/ui/skeleton";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: string;
  lawyerId: string;
  clientId: string;
  read: boolean;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentPublicId: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  lawyer: { id: string; firstName: string; lastName: string };
  client: { id: string; name: string; image: string | null };
}

interface Conversation {
  lawyerId: string;
  lawyerName: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

interface PendingAttachment {
  previewUrl: string;
  publicId: string;
  type: "image" | "pdf";
  name: string;
}

export default function ClientMessages() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const withId = searchParams.get("with");
    const withName = searchParams.get("name");
    if (withId) {
      setSelectedLawyer(withId);
      setSelectedName(withName || "Abogado");
      fetchMessages(withId);
      router.replace("/client/messages");
    } else {
      fetchConversations();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const es = new EventSource("/api/messages/stream");
    es.addEventListener("message", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (selectedLawyer && data.lawyerId === selectedLawyer) {
          fetchMessages(selectedLawyer, false);
        } else if (!selectedLawyer) {
          fetchConversations();
        } else {
          fetchConversations();
        }
      } catch {}
    });
    es.onerror = () => {
      if (selectedLawyer) fetchMessages(selectedLawyer, false);
    };
    return () => es.close();
  }, [selectedLawyer]);

  async function fetchConversations() {
    setLoading(true);
    const res = await fetch("/api/messages");
    const all: Message[] = await res.json();

    const grouped = new Map<string, { name: string; msgs: Message[]; unread: number }>();
    for (const msg of all) {
      const key = msg.lawyerId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: `${msg.lawyer.firstName} ${msg.lawyer.lastName}`,
          msgs: [],
          unread: 0,
        });
      }
      const g = grouped.get(key)!;
      g.msgs.push(msg);
      if (msg.senderType === "lawyer" && !msg.read) g.unread++;
    }

    const convs: Conversation[] = [];
    for (const [lawyerId, g] of grouped) {
      const last = g.msgs[g.msgs.length - 1];
      const lastPreview = last.content
        ? last.content
        : last.attachmentType === "image"
        ? "📷 Imagen"
        : last.attachmentType === "pdf"
        ? "📎 Archivo"
        : "";
      convs.push({
        lawyerId,
        lawyerName: g.name,
        lastMessage: lastPreview,
        lastDate: last.createdAt,
        unread: g.unread,
      });
    }
    convs.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    setConversations(convs);
    setLoading(false);
  }

  async function fetchMessages(lawyerId: string, showLoading = true) {
    if (showLoading) setLoading(true);
    const res = await fetch(`/api/messages?userId=${lawyerId}`);
    setMessages(await res.json());
    if (showLoading) setLoading(false);
  }

  async function openConversation(lawyerId: string, name: string) {
    setSelectedLawyer(lawyerId);
    setSelectedName(name);
    await fetchMessages(lawyerId);
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type);
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Solo imágenes (JPG, PNG, WEBP) o PDF");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar 10MB");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const previewUrl = isImage ? URL.createObjectURL(file) : "";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "message-attachments");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        toast.error(data?.error || "No se pudo subir el archivo");
        return;
      }
      setPendingAttachment({
        previewUrl,
        publicId: data.publicId,
        type: isPdf ? "pdf" : "image",
        name: file.name,
      });
    } catch {
      toast.error("No se pudo subir el archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLawyer) return;
    if (!newMessage.trim() && !pendingAttachment) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMessage,
        recipientId: selectedLawyer,
        attachmentPublicId: pendingAttachment?.publicId,
        attachmentType: pendingAttachment?.type,
        attachmentName: pendingAttachment?.name,
      }),
    });
    if (!res.ok) {
      try {
        const data = await res.json();
        toast.error(data.error || "No se pudo enviar el mensaje");
      } catch {
        toast.error("No se pudo enviar el mensaje");
      }
      setSending(false);
      return;
    }
    setNewMessage("");
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
    setSending(false);
    fetchMessages(selectedLawyer, false);
  }

  if (loading && !selectedLawyer) {
    return (
<div className="max-w-2xl"><SkeletonMessageList rows={4} /></div>
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
        <p className="text-slate-500 mt-1">Comunicate con tus abogados</p>
      </div>

      {!selectedLawyer ? (
        conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No tenes conversaciones</p>
              <p className="text-sm text-slate-400 mt-1">
                Vas a poder chatear con un abogado después de tu primera consulta confirmada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.lawyerId}
                className="cursor-pointer hover:shadow-lg hover:border-brand-100 transition-all"
                onClick={() => openConversation(conv.lawyerId, conv.lawyerName)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                        {conv.lawyerName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{conv.lawyerName}</h3>
                        <p className="text-sm text-slate-500 truncate max-w-xs">{conv.lastMessage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conv.unread > 0 && <Badge variant="info">{conv.unread}</Badge>}
                      <span className="text-xs text-slate-400">
                        {new Date(conv.lastDate).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div>
          <button
            onClick={() => { setSelectedLawyer(null); setMessages([]); fetchConversations(); }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a conversaciones
          </button>
          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-xs">
                {selectedName.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="font-semibold text-slate-900">{selectedName}</h3>
            </div>
            <div className="h-[60vh] sm:h-96 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No hay mensajes aun</p>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="px-6 py-4 border-t border-slate-100 space-y-2">
              {pendingAttachment && (
                <AttachmentPreview
                  attachment={pendingAttachment}
                  onRemove={() => setPendingAttachment(null)}
                />
              )}
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  onChange={handleFilePick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending || !!pendingAttachment}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Adjuntar archivo o imagen"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={pendingAttachment ? "Agregá un mensaje (opcional)..." : "Escribe un mensaje..."}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="submit"
                  disabled={sending || uploading || (!newMessage.trim() && !pendingAttachment)}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isClient = msg.senderType === "client";
  const hasAttachment = Boolean(msg.attachmentPublicId || msg.attachmentUrl);
  const proxyUrl = `/api/messages/${msg.id}/attachment`;
  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
          isClient
            ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white"
            : "bg-slate-100 text-slate-900"
        }`}
      >
        {hasAttachment && msg.attachmentType === "image" && (
          <a
            href={proxyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-2"
          >
            <img
              src={proxyUrl}
              alt={msg.attachmentName || "Imagen"}
              className="rounded-xl max-h-56 w-auto object-cover"
            />
          </a>
        )}
        {hasAttachment && msg.attachmentType === "pdf" && (
          <a
            href={`${proxyUrl}?download=1`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${
              isClient
                ? "bg-white/10 hover:bg-white/20"
                : "bg-white hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FileText className={`w-5 h-5 flex-shrink-0 ${isClient ? "text-white" : "text-red-500"}`} />
            <span className={`text-xs truncate ${isClient ? "text-white" : "text-slate-700"}`}>
              {msg.attachmentName || "Archivo PDF"}
            </span>
          </a>
        )}
        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
        <p className={`text-xs mt-1 ${isClient ? "text-slate-100" : "text-slate-500"}`}>
          {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: PendingAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
      {attachment.type === "image" ? (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
          <FileText className="w-6 h-6 text-red-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{attachment.name}</p>
        <p className="text-[10px] text-slate-400 uppercase">
          {attachment.type === "image" ? "Imagen" : "PDF"}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
