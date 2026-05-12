"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { LockedFeature, deriveLockReason } from "@/components/lawyer/locked-feature";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: string;
  lawyerId: string;
  clientId: string;
  read: boolean;
  createdAt: string;
  lawyer: { id: string; firstName: string; lastName: string };
  client: { id: string; name: string; image: string | null };
}

interface Conversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

export default function LawyerMessages() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [access, setAccess] = useState<any>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    fetch("/api/lawyers/me")
      .then((r) => r.json())
      .then((data) => {
        setAccess(data.access);
        setAccessChecked(true);
        if (!data.access?.canAccessFeatures) {
          setLoading(false);
          return;
        }
        const withId = searchParams.get("with");
        const withName = searchParams.get("name");
        if (withId) {
          setSelectedClient(withId);
          setSelectedName(withName || "Cliente");
          fetchMessages(withId);
          router.replace("/lawyer/messages");
        } else {
          fetchConversations();
        }
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedClient) return;
    const interval = setInterval(() => fetchMessages(selectedClient, false), 5000);
    return () => clearInterval(interval);
  }, [selectedClient]);

  async function fetchConversations() {
    setLoading(true);
    const res = await fetch("/api/messages");
    const all: Message[] = await res.json();

    const grouped = new Map<string, { name: string; msgs: Message[]; unread: number }>();
    for (const msg of all) {
      const key = msg.clientId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: msg.client.name,
          msgs: [],
          unread: 0,
        });
      }
      const g = grouped.get(key)!;
      g.msgs.push(msg);
      if (msg.senderType === "client" && !msg.read) g.unread++;
    }

    const convs: Conversation[] = [];
    for (const [clientId, g] of grouped) {
      const last = g.msgs[g.msgs.length - 1];
      convs.push({
        clientId,
        clientName: g.name,
        lastMessage: last.content,
        lastDate: last.createdAt,
        unread: g.unread,
      });
    }
    convs.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    setConversations(convs);
    setLoading(false);
  }

  async function fetchMessages(clientId: string, showLoading = true) {
    if (showLoading) setLoading(true);
    const res = await fetch(`/api/messages?userId=${clientId}`);
    setMessages(await res.json());
    if (showLoading) setLoading(false);
  }

  async function openConversation(clientId: string, name: string) {
    setSelectedClient(clientId);
    setSelectedName(name);
    await fetchMessages(clientId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;
    setSending(true);
    setSendError(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage, recipientId: selectedClient }),
    });
    if (!res.ok) {
      try {
        const data = await res.json();
        setSendError(data.error || "No se pudo enviar el mensaje");
      } catch {
        setSendError("No se pudo enviar el mensaje");
      }
      setSending(false);
      return;
    }
    setNewMessage("");
    setSending(false);
    fetchMessages(selectedClient, false);
  }

  if (!accessChecked || (loading && !selectedClient)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const lockReason = access ? deriveLockReason(access) : null;
  if (lockReason) {
    return <LockedFeature featureName="Mensajes" reason={lockReason} />;
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
        <p className="text-slate-500 mt-1">Comunicate con tus clientes</p>
      </div>

      {!selectedClient ? (
        conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No tenes conversaciones</p>
              <p className="text-sm text-slate-400 mt-1">
                Vas a poder chatear con un cliente después de tu primera consulta confirmada con él.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.clientId}
                className="cursor-pointer hover:shadow-lg hover:border-brand-100 transition-all"
                onClick={() => openConversation(conv.clientId, conv.clientName)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {conv.clientName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{conv.clientName}</h3>
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
            onClick={() => { setSelectedClient(null); setMessages([]); fetchConversations(); }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a conversaciones
          </button>
          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                {selectedName[0]}
              </div>
              <h3 className="font-semibold text-slate-900">{selectedName}</h3>
            </div>
            <div className="h-[60vh] sm:h-96 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No hay mensajes aun</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === "lawyer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderType === "lawyer"
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === "lawyer" ? "text-slate-300" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="px-6 py-4 border-t border-slate-100 space-y-2">
              {sendError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {sendError}
                </p>
              )}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
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
