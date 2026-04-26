"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!nickname || !password) {
      alert("Fill all fields");
      return;
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("nickname", nickname)
      .single();

    if (error && error.code !== "PGRST116") {
      alert(error.message);
      return;
    }

    if (user) {
      if (user.password !== password) {
        alert("Nickname already exists or wrong password");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      router.push("/home");
      return;
    }

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        nickname,
        password,
      })
      .select()
      .single();

    if (insertError) {
      alert(insertError.message);
      return;
    }

    localStorage.setItem("user", JSON.stringify(newUser));
    router.push("/home");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8">

        {/* HEADER */}
        <h1 className="text-3xl font-bold text-center text-pink-600">
          🎀 Chaotic Club
        </h1>

        <p className="text-center text-gray-500 text-sm mt-2">
          Login or create your identity ✨
        </p>

        <div className="mt-6 flex flex-col gap-5">

          {/* NICKNAME */}
          <div>
            <label className="text-sm font-semibold text-pink-600">
              Nickname 💕
            </label>

            <input
              className="w-full mt-2 p-4 rounded-2xl bg-white/80 border-2 border-pink-300 text-gray-800 font-medium focus:outline-pink-400 focus:ring-2 focus:ring-pink-200 transition"
              placeholder="Enter your nickname"
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-semibold text-purple-600">
              Password 🔒
            </label>

            <input
              type="password"
              className="w-full mt-2 p-4 rounded-2xl bg-white/80 border-2 border-purple-200 text-gray-800 font-medium focus:outline-purple-400 focus:ring-2 focus:ring-purple-200 transition"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            className="mt-2 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold shadow-lg transition transform hover:scale-[1.02]"
          >
            💫 Enter Club World
          </button>

        </div>

        {/* FOOTER TEXT */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Join the chaos ✨ Create or login instantly
        </p>

      </div>
    </main>
  );
}