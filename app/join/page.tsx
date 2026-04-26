"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImage = (file: File) => {
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const joinRoom = async () => {
    if (!roomId || !nickname) {
      alert("Please enter club code and nickname");
      return;
    }

    const code = roomId.toUpperCase();

    let avatarUrl = "";

    if (file) {
      const uploaded = await uploadImage(file);
      if (uploaded) avatarUrl = uploaded;
    }

    // 1️⃣ ADD MEMBER
    const { error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: code,
        nickname,
        avatar: avatarUrl,
      });

    if (memberError) {
      alert("Join error: " + memberError.message);
      return;
    }

    // 2️⃣ CREATE ALBUM (ONLY IF NOT EXISTS)
    const { error: albumError } = await supabase
      .from("albums")
      .upsert({
        room_id: code,
        member_name: nickname,
      });

    if (albumError) {
      console.log("Album error:", albumError);
    }

    // 3️⃣ SAVE LOCAL USER INFO
    localStorage.setItem("nickname", nickname);

    // 4️⃣ GO TO ROOM
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

        <div className="mt-6 flex flex-col gap-5">

          {/* CLUB CODE */}
          <div>
            <label className="text-sm font-semibold text-purple-600">
              Club Code ⭐
            </label>
            <input
              className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-purple-300 text-gray-800 placeholder-gray-500 focus:outline-purple-400"
              placeholder="Enter club code"
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>

          {/* NICKNAME */}
          <div>
            <label className="text-sm font-semibold text-pink-500">
              Your Nickname 👤
            </label>
            <input
              className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-pink-200 text-gray-800 placeholder-gray-500 focus:outline-pink-400"
              placeholder="Enter your nickname"
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* PROFILE PICTURE */}
          <div className="flex flex-col items-center">
            <label className="text-sm font-semibold text-gray-600 mb-2">
              Profile Picture 📸
            </label>

            <label className="w-28 h-28 border-2 border-dashed border-purple-300 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-white/60 hover:bg-white/80 transition">
              {preview ? (
                <img
                  src={preview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500 text-center px-2">
                  Tap to upload
                </span>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleImage(e.target.files[0])
                }
              />
            </label>
          </div>

          {/* BUTTON */}
          <button
            onClick={joinRoom}
            className="mt-2 py-3 rounded-2xl bg-purple-400 hover:bg-purple-500 text-white font-semibold shadow-lg transition"
          >
            💫 Join Club
          </button>

        </div>

      </div>
    </main>
  );
}