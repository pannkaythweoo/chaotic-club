"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ FIX: safe localStorage access
  useEffect(() => {
    if (typeof window === "undefined") return;

    const u = localStorage.getItem("user");
    setUser(u ? JSON.parse(u) : null);
  }, []);

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return "";
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const changeProfile = async (file: File) => {
    if (!user) return;

    const url = await uploadImage(file);

    if (!url) return;

    await supabase
      .from("users")
      .update({ avatar: url })
      .eq("id", user.id);

    const updated = { ...user, avatar: url };

    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    setPreview(url);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4">

      <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-md">

        {/* 👤 USER PROFILE */}
        <div className="flex flex-col items-center mb-6">

          <label className="relative cursor-pointer">

            <div className="w-24 h-24 rounded-full bg-white/70 border-2 border-pink-300 overflow-hidden flex items-center justify-center shadow-md">

              {preview || user?.avatar ? (
                <img
                  src={preview || user?.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">
                  No Photo
                </span>
              )}

            </div>

            {/* hidden upload */}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) =>
                e.target.files && changeProfile(e.target.files[0])
              }
            />
          </label>

          <h2 className="mt-3 text-lg font-bold text-pink-600">
            {user?.nickname || "Guest"}
          </h2>

          <p className="text-xs text-gray-500">
            Tap photo to change
          </p>
        </div>

        {/* TITLE */}
        <h1 className="text-4xl font-bold text-pink-600 text-center">
          Chaotic Club 🎀
        </h1>

        <p className="text-gray-600 mt-3 text-center">
          Create chaos. Play together. Have fun 💫
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex flex-col gap-4">

          <Link href="/create">
            <button className="w-full py-3 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-semibold shadow-lg transition">
              ✨ Create Club
            </button>
          </Link>

          <Link href="/join">
            <button className="w-full py-3 rounded-2xl bg-purple-300 hover:bg-purple-400 text-white font-semibold shadow-lg transition">
              💌 Join Club
            </button>
          </Link>

        </div>

        {/* FOOTER */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          made for chaotic friends 💕
        </p>

      </div>
    </main>
  );
}