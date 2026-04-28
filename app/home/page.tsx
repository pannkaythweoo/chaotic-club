"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Load user from localStorage
  useEffect(() => {
    const u = localStorage.getItem("user");

    if (!u) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(u));
  }, []);

  // ✅ Upload image to Supabase storage
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

  // ✅ Change profile picture
  const changeProfile = async (file: File) => {
    if (!user) return;

    const url = await uploadImage(file);
    if (!url) return;

    await supabase
      .from("users")
      .update({ avatar: url })
      .eq("id", user.id);

    const updatedUser = { ...user, avatar: url };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setPreview(url);
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4 py-6">

      {/* 🎀 HEADER */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/40 shadow-md rounded-2xl px-4 py-3">

        {/* APP NAME */}
        <h1 className="text-xl font-bold text-pink-600">
          🎀 Chaotic Club
        </h1>

        {/* USER SECTION */}
        <div className="flex items-center gap-3">

          <span className="text-sm font-semibold text-gray-700">
            {user?.nickname}
          </span>

          {/* Avatar */}
          <label className="cursor-pointer">
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

          {/* Logout */}
          <button
            onClick={logout}
            className="text-xs text-pink-500 hover:underline"
          >
            logout
          </button>

        </div>
      </div>

      {/* 🎮 MAIN BUTTONS */}
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

      {/* 💕 FOOTER */}
      <p className="text-xs text-gray-500 mt-10 text-center">
        made for chaotic friends 💕
      </p>

    </main>
  );
}
