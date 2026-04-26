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
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      console.log("UPLOAD ERROR:", error);
      return "";
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleImage = (file: File) => {
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const createRoom = async () => {
    if (!clubName || !nickname) {
      alert("Fill all fields");
      return;
    }

    const code = generateRoomCode();

    let avatarUrl = "";
    if (file) {
      avatarUrl = await uploadImage(file);
    }

    // 🔥 STEP 1: CREATE ROOM
    const { error: roomError } = await supabase.from("rooms").insert({
      id: code,
      name: clubName,
    });

    if (roomError) {
      alert("Room error: " + roomError.message);
      return;
    }

    // 🔥 STEP 2: ADD CREATOR AS MEMBER
    const { error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: code,
        nickname,
        avatar: avatarUrl || "",
      });

    if (memberError) {
      alert("Member error: " + memberError.message);
      return;
    }

    // ✅ STEP 3: CREATE ALBUM (FIXED LOCATION)
    const { error: albumError } = await supabase
      .from("albums")
      .upsert({
        room_id: code,
        member_name: nickname,
      });

    if (albumError) {
      console.log("Album error:", albumError);
    }

    // ✅ STEP 4: SAVE NICKNAME
    localStorage.setItem("nickname", nickname);

    // 🔥 STEP 5: GO TO ROOM
    router.push(`/room/${code}`);
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
              className="w-full mt-2 p-4 rounded-2xl bg-white/90 border-2 border-pink-400 text-gray-800 font-semibold text-lg placeholder-gray-400"
              placeholder="Enter club name"
              onChange={(e) => setClubName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-purple-500">
              Your Nickname
            </label>

            <input
              className="w-full mt-2 p-3 rounded-xl bg-white/80 border border-purple-200 text-gray-800 placeholder-gray-500"
              placeholder="Enter nickname"
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="flex flex-col items-center">
            <label className="text-sm text-gray-600 mb-2">
              Profile Picture
            </label>

            <label className="w-28 h-28 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-white/60">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">Upload</span>
              )}

              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleImage(e.target.files[0])
                }
              />
            </label>
          </div>

          <button
            onClick={createRoom}
            className="py-3 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-semibold shadow-lg"
          >
            ✨ Create Club
          </button>

        </div>
      </div>
    </main>
  );
}