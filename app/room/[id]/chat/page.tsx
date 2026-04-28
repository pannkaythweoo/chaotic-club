"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const reactions = ["❤️", "😂", "😢", "😭", "😡"];

export default function ChatPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [activeMsg, setActiveMsg] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("Loading...");

  const mediaRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 👤 USER
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // 📥 MESSAGES
  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const enriched = await Promise.all(
      data.map(async (m) => {
        const { data: u } = await supabase
          .from("users")
          .select("nickname, avatar")
          .eq("id", m.user_id)
          .maybeSingle();

        const { data: reacts } = await supabase
          .from("message_reactions")
          .select("*")
          .eq("message_id", m.id);

        const grouped: Record<string, number> = {};
        reacts?.forEach((r) => {
          grouped[r.reaction] = (grouped[r.reaction] || 0) + 1;
        });

        return {
          ...m,
          nickname: u?.nickname || "User",
          avatar: u?.avatar || "/default.png",
          reactions: grouped,
        };
      })
    );

    setMessages(enriched);
  };

  // 📛 ROOM NAME
  const loadRoomName = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", roomId)
      .maybeSingle();

    setRoomName(data?.name || "Unknown Room");
  };

  // INIT
  useEffect(() => {
    if (roomId) {
      loadMessages();
      loadRoomName();
    }
  }, [roomId]);

  // REALTIME
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        () => loadMessages()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // SEND TEXT
  const sendMessage = async () => {
    if (!text || !user) return;

    await supabase.from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      message: text,
      message_type: "text",
    });

    setText("");
    loadMessages();
  };

  // REACTION
  const setReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: user.id,
        reaction: emoji,
      });
    } else {
      if (existing.reaction === emoji) {
        await supabase.from("message_reactions").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("message_reactions")
          .update({ reaction: emoji })
          .eq("id", existing.id);
      }
    }

    setActiveMsg(null);
    loadMessages();
  };

  // MEDIA
  const uploadMedia = async (file: File) => {
    if (!user) return;

    const path = `${roomId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file);

    if (error) return alert(error.message);

    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);

    await supabase.from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      message: null,
      media_url: data.publicUrl,
      media_type: file.type,
      message_type: "media",
    });

    loadMessages();
  };

  // VOICE
  const startVoice = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      const path = `${roomId}/${Date.now()}.webm`;

      const { error } = await supabase.storage
        .from("chat-voice")
        .upload(path, blob);

      if (error) return alert(error.message);

      const { data } = supabase.storage.from("chat-voice").getPublicUrl(path);

      await supabase.from("messages").insert({
        room_id: roomId,
        user_id: user.id,
        voice_url: data.publicUrl,
        message_type: "voice",
      });

      loadMessages();
    };

    recorder.start();
  };

  const stopVoice = () => recorderRef.current?.stop();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">

      {/* 📱 PHONE CONTAINER */}
      <div className="w-[380px] h-[700px] bg-white/70 rounded-2xl shadow-xl flex flex-col overflow-hidden border">

        {/* HEADER */}
        <div className="p-4 border-b border-pink-200">
          <h1 className="text-xl font-bold text-pink-600">💬 {roomName}</h1>
        </div>

        {/* 💬 CHAT AREA (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {messages.map((m) => (
            <div key={m.id} className="flex gap-3 relative">

              <img src={m.avatar} className="w-9 h-9 rounded-full" />

              <div className="flex flex-col max-w-[75%]">

                <p className="text-sm text-gray-700">{m.nickname}</p>

                {m.message && (
                  <p
                    onClick={() => setActiveMsg(activeMsg === m.id ? null : m.id)}
                    className="bg-white/70 px-3 py-2 rounded-xl text-gray-800 cursor-pointer"
                  >
                    {m.message}
                  </p>
                )}

                {m.media_url && (
                  m.media_type?.startsWith("image") ? (
                    <img src={m.media_url} className="rounded-xl max-w-[200px]" />
                  ) : (
                    <a href={m.media_url} className="text-blue-500">📁 File</a>
                  )
                )}

                {m.voice_url && <audio controls src={m.voice_url} />}

              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* 📌 FIXED INPUT BAR (STUCK TO BOTTOM) */}
        <div className="sticky bottom-0 p-3 border-t border-pink-200 flex gap-2 bg-white/90">

          <input type="file" hidden ref={mediaRef} onChange={(e) => {
            if (e.target.files?.[0]) uploadMedia(e.target.files[0]);
          }} />

          <button onClick={() => mediaRef.current?.click()} className="px-3 py-2 bg-purple-300 rounded-xl">
            📎
          </button>

          <button onMouseDown={startVoice} onMouseUp={stopVoice} className="px-3 py-2 bg-pink-300 rounded-xl">
            🎤
          </button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-3 py-2 rounded-xl border text-gray-800"
          />

          <button onClick={sendMessage} className="bg-pink-400 px-4 rounded-xl">
            Send
          </button>

        </div>

      </div>
    </main>
  );
}