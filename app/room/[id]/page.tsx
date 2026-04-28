"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter(); // ✅ THIS is where it comes from
  const roomId = params.id as string;

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (!roomData) {
        alert("Room not found ❌");
        router.push("/home");
        return;
      }

      setRoom(roomData);

      const { data: memberData } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", roomId);

      const validMembers = [];

      if (memberData) {
        for (const m of memberData) {
          const { data: dbUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", m.user_id)
            .maybeSingle();

          if (dbUser) validMembers.push(m);
        }
      }

      setMembers(validMembers);
    };

    if (roomId) load();
  }, [roomId, router]);

  const games = [
    "Truth or Dare",
    "Imposter",
    "Decision Maker",
    "Random Chaos",
    "Group Chat",
    "Snap Collection",
  ];

  const handleClick = (game: string) => {
    if (game === "Snap Collection") {
      router.push(`/room/${roomId}/snap`);
    }

    if (game === "Decision Maker") {
      router.push(`/room/${roomId}/decision`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4 py-6">

      {/* 🎀 HEADER */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-xl">
        <div className="flex justify-between items-start">

          {/* LEFT */}
          <div>
            <h1 className="text-xl font-bold text-pink-600">
              🎀 {room?.name || "Loading..."}
            </h1>

            <p className="text-sm text-gray-500">
              Members: {members.length}
            </p>
          </div>

          {/* RIGHT */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Room Code</p>

            <p
              onClick={() => setShowCode(!showCode)}
              className="cursor-pointer font-mono text-purple-600 font-bold tracking-widest"
            >
              {showCode ? roomId.toUpperCase() : "******"}
            </p>

            <p className="text-xs text-gray-400">
              tap to reveal
            </p>
          </div>

        </div>
      </div>

      {/* 👥 MEMBERS */}
      <div className="mt-5 flex flex-wrap gap-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 bg-white/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/40 shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-xs overflow-hidden">
              {m.avatar ? (
                <img src={m.avatar} className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>

            <span className="text-sm text-pink-700 font-medium">
              {m.nickname}
            </span>

            {m.is_creator && <span>👑</span>}
          </div>
        ))}
      </div>

      {/* 🎮 GAME GRID */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {games.map((game) => (
          <div
            key={game}
            onClick={() => handleClick(game)}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 text-center shadow-md hover:scale-105 transition cursor-pointer"
          >
            <p className="text-pink-600 font-semibold">
              {game}
            </p>
          </div>
        ))}
      </div>

      {/* 🎵 FOOTER */}
      <div className="mt-6 flex gap-4">

        {/* ✅ UPDATED: Songs button now navigates */}
        <button
          onClick={() => router.push(`/room/${roomId}/song`)}
          className="flex-1 py-3 rounded-2xl bg-purple-400 hover:bg-purple-500 text-white font-semibold shadow-lg"
        >
          🎵 Songs
        </button>

        <button className="flex-1 py-3 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-semibold shadow-lg">
          🎬 Watch Party
        </button>

      </div>

    </main>
  );
}