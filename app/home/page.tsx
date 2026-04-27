"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;

      const u = localStorage.getItem("user");

      if (!u) return;

      const parsed = JSON.parse(u);

      // 🧠 NEW FIX: verify user still exists in DB
      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", parsed.id)
        .maybeSingle();

      if (!dbUser) {
        localStorage.removeItem("user");
        setUser(null);
        return;
      }

      setUser(dbUser);
    };

    init();
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
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4 py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/40 shadow-md rounded-2xl px-4 py-3">

        <h1 className="text-xl font-bold text-pink-600">
          🎀 Chaotic Club
        </h1>

        <label className="flex items-center gap-2 cursor-pointer">

          <span className="text-sm font-semibold text-gray-700">
            {user?.nickname || "Guest"}
          </span>

          <div className="w-10 h-10 rounded-full border-2 border-pink-300 overflow-hidden bg-white flex items-center justify-center">

            {preview || user?.avatar ? (
              <img
                src={preview || user?.avatar}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">👤</span>
            )}

          </div>

          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) =>
              e.target.files && changeProfile(e.target.files[0])
            }
          />
        </label>
      </div>

      {/* BUTTONS */}
      <div className="mt-10 max-w-md mx-auto flex flex-col gap-5">

        <Link href="/create">
          <button className="w-full py-4 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-semibold shadow-lg transition">
            ✨ Create Club
          </button>
        </Link>

        <Link href="/join">
          <button className="w-full py-4 rounded-2xl bg-purple-300 hover:bg-purple-400 text-white font-semibold shadow-lg transition">
            💌 Join Club
          </button>
        </Link>

      </div>

      <p className="text-xs text-gray-500 mt-10 text-center">
        made for chaotic friends 💕
      </p>

    </main>
  );
}