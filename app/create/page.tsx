"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreatePage() {
  const router = useRouter();

  const [clubName, setClubName] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    if (!clubName) {
      alert("Enter club name 🎀");
      return;
    }

    const userStr = localStorage.getItem("user");

    if (!userStr) {
      alert("Please login again ❌");
      router.push("/");
      return;
    }

    const user = JSON.parse(userStr);

    // ✅ verify user still exists in DB
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!dbUser) {
      localStorage.removeItem("user");
      alert("User not found. Please login again ❌");
      router.push("/");
      return;
    }

    setLoading(true);

    const roomId = generateRoomCode();

    // 🏠 CREATE ROOM
    const { error: roomError } = await supabase
      .from("rooms")
      .insert({
        id: roomId,
        name: clubName,
      });

    if (roomError) {
      alert(roomError.message);
      setLoading(false);
      return;
    }

    // 👥 ADD CREATOR (room member)
    const { error: memberError } = await supabase
      .from("room_members")
      .upsert(
        {
          room_id: roomId,
          user_id: user.id,
          nickname: user.nickname,
          avatar: user.avatar || "",
          is_creator: true,
        },
        {
          onConflict: "room_id,user_id",
        }
      );

    if (memberError) {
      alert(memberError.message);
      setLoading(false);
      return;
    }

    // 📸 CREATE ALBUM (with avatar)
    const { error: albumError } = await supabase
      .from("albums")
      .upsert(
        {
          room_id: roomId,
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

    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4">

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8">

        <h1 className="text-3xl font-bold text-pink-600 text-center">
          Create Club 🎀
        </h1>

        <p className="text-center text-gray-500 text-sm mt-2">
          Build your chaotic space ✨
        </p>

        <div className="mt-6 flex flex-col gap-5">

          <div>
            <label className="text-sm font-bold text-pink-600">
              ⭐ Club Name
            </label>

            <input
              className="w-full mt-2 p-4 rounded-2xl bg-white/90 border-2 border-pink-400 text-gray-800 font-semibold text-lg"
              placeholder="Enter club name"
              onChange={(e) => setClubName(e.target.value)}
            />
          </div>

          <button
            onClick={createRoom}
            disabled={loading}
            className="py-3 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating..." : "✨ Create Club"}
          </button>

        </div>
      </div>
    </main>
  );
}