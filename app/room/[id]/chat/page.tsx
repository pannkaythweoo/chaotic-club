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
  const [isRecording, setIsRecording] = useState(false);

  const mediaRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 👤 USER
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // 📥 LOAD MESSAGES
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

    return () => supabase.removeChannel(channel);
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

  // 🎤 VOICE START
  const startVoice = async () => {
    if (isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(200);
    setIsRecording(true);
  };

  // ⏹ VOICE STOP
  const stopVoice = () => {
    const recorder = recorderRef.current;
    const stream = streamRef.current;

    if (!recorder || !isRecording) return;

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      if (blob.size < 1000) {
        alert("Voice too short!");
        setIsRecording(false);
        return;
      }

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

    recorder.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const Reactable = ({
    messageId,
    children,
  }: {
    messageId: string;
    children: React.ReactNode;
  }) => {
    const isActive = activeMsg === messageId;

    return (
      <div className="relative">
        <div onClick={() => setActiveMsg(isActive ? null : messageId)}>
          {children}
        </div>

        {isActive && (
          <div className="absolute -top-10 left-0 flex gap-2 bg-white p-2 rounded-xl shadow z-10">
            {reactions.map((r) => (
              <button
                key={r}
                onClick={() => setReaction(messageId, r)}
                className="text-lg hover:scale-125 transition"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">

      <div className="w-[380px] h-[700px] bg-white/70 rounded-2xl shadow-xl flex flex-col overflow-hidden border">

        {/* HEADER */}
        <div className="p-4 border-b border-pink-200">
          <h1 className="text-xl font-bold text-pink-600">💬 {roomName}</h1>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">

              <img src={m.avatar} className="w-9 h-9 rounded-full" />

              <div className="flex flex-col max-w-[75%]">

                <p className="text-sm text-gray-700">{m.nickname}</p>

                {m.message && (
                  <Reactable messageId={m.id}>
                    <p className="bg-white px-3 py-2 rounded-xl cursor-pointer">
                      {m.message}
                    </p>
                  </Reactable>
                )}

                {m.media_url && (
                  <Reactable messageId={m.id}>
                    {m.media_type?.startsWith("image") ? (
                      <img
                        src={m.media_url}
                        className="rounded-xl max-w-[200px] cursor-pointer"
                      />
                    ) : (
                      <a className="text-blue-500 cursor-pointer">📁 File</a>
                    )}
                  </Reactable>
                )}

                {m.voice_url && (
                  <Reactable messageId={m.id}>
                    <audio controls src={m.voice_url} />
                  </Reactable>
                )}

              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* INPUT BAR (CLEAN UI) */}
        <div className="sticky bottom-0 p-3 border-t border-pink-200 flex gap-2 bg-white">

          {/* ATTACH */}
          <button
            onClick={() => mediaRef.current?.click()}
            className="bg-white border rounded-full w-9 h-9 flex items-center justify-center text-sm"
            title="Attach"
          >
            📎
          </button>

          <input
            type="file"
            hidden
            ref={mediaRef}
            onChange={(e) => {
              if (e.target.files?.[0]) uploadMedia(e.target.files[0]);
            }}
          />

          {/* VOICE START */}
          <button
            onClick={startVoice}
            disabled={isRecording}
            className="bg-white border rounded-full w-9 h-9 flex items-center justify-center text-sm"
            title="Start Voice"
          >
            🎤
          </button>

          {/* VOICE STOP */}
          <button
            onClick={stopVoice}
            disabled={!isRecording}
            className="bg-white border rounded-full w-9 h-9 flex items-center justify-center text-sm"
            title="Stop Voice"
          >
            ⏹
          </button>

          {/* INPUT */}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-3 py-2 rounded-xl border text-gray-800"
          />

          <button
            onClick={sendMessage}
            className="bg-pink-400 px-4 rounded-xl text-white"
          >
            Send
          </button>

        </div>

      </div>
    </main>
  );
}