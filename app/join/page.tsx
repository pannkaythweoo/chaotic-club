"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const joinRoom = async () => {
    if (!roomId) {
      alert("Please enter club code 💌");
      return;
    }

    const code = roomId.toUpperCase();
    setLoading(true);

    // 🔍 STEP 1: check room exists
    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", code)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!room) {
      alert("Wrong Club Code ❌");
      setLoading(false);
      return;
    }

    // 👤 GET USER
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      alert("Please login again ❌");
      router.push("/");
      return;
    }

    const user = JSON.parse(userStr);

    // 🧠 IMPORTANT FIX: prevent duplicate members
    const { error: memberError } = await supabase
      .from("room_members")
      .upsert(
        {
          room_id: code,
          user_id: user.id,
          nickname: user.nickname,
          avatar: user.avatar || "",
          is_creator: false,
        },
        {
          onConflict: "room_id,user_id",
        }
      );

    if (memberError) {
      console.error(memberError);
      alert("Failed to join room ❌");
      setLoading(false);
      return;
    }

    // 📸 ENSURE ALBUM EXISTS (WITH AVATAR FIX)
    const { error: albumError } = await supabase
      .from("albums")
      .upsert(
        {
          room_id: code,
          user_id: user.id,
          member_name: user.nickname,
          avatar: user.avatar || "",
        },
        {
          onConflict: "room_id,user_id",
        }
      );

    if (albumError) {
      console.log("Album error:", albumError);
    }

    setLoading(false);

    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4">

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8">

        <h1 className="text-3xl font-bold text-purple-500 text-center">
          Join Club 💌
        </h1>

        <p className="text-center text-gray-500 text-sm mt-2">
          Enter the chaos room code 🎮
        </p>

        {/* INPUT */}
        <div className="mt-6">

          <label className="text-sm font-semibold text-purple-600">
            Club Code ⭐
          </label>

          <input
            className="w-full mt-2 p-4 rounded-2xl bg-white/80 border-2 border-purple-300 text-gray-800 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Enter club code"
            onChange={(e) => setRoomId(e.target.value)}
          />

        </div>

        {/* BUTTON */}
        <button
          onClick={joinRoom}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-2xl bg-purple-400 hover:bg-purple-500 text-white font-semibold shadow-lg disabled:opacity-50"
        >
          {loading ? "Joining..." : "💫 Join Club"}
        </button>

      </div>

    </main>
  );
}