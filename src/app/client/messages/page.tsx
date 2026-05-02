"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";

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
  lawyerId: string;
  lawyerName: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

export default function ClientMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedLawyer) return;
    const interval = setInterval(() => fetchMessages(selectedLawyer, false), 5000);
    return () => clearInterval(interval);
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
      convs.push({
        lawyerId,
        lawyerName: g.name,
        lastMessage: last.content,
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLawyer) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage, recipientId: selectedLawyer }),
    });
    setNewMessage("");
    setSending(false);
    fetchMessages(selectedLawyer, false);
  }

  if (loading && !selectedLawyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
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
                Agenda una cita con un abogado para iniciar una conversacion
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
                  <div key={msg.id} className={`flex ${msg.senderType === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderType === "client"
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === "client" ? "text-slate-300" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="px-6 py-4 border-t border-slate-100 flex gap-3">
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
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
