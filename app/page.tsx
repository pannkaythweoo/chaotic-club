"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!nickname || !password) {
      alert("Fill everything 💕");
      return;
    }

    try {
      setLoading(true);

      // 🔍 check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("nickname", nickname)
        .maybeSingle();

      if (fetchError) {
        console.error(fetchError);
        alert("Database error ❌");
        return;
      }

      // 🆕 CREATE USER
      if (!existingUser) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            nickname,
            password,
          })
          .select()
          .single();

        if (insertError || !newUser) {
          console.error(insertError);
          alert("Failed to create user ❌");
          return;
        }

        // 🧠 SAVE + SAFE VERIFY
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", newUser.id)
          .maybeSingle();

        if (!dbUser) {
          alert("User creation failed ❌");
          return;
        }

        localStorage.setItem("user", JSON.stringify(dbUser));
        router.push("/home");
        return;
      }

      // 🔐 PASSWORD CHECK
      if (existingUser.password !== password) {
        alert("Username already exists or Wrong password ❌");
        return;
      }

      // 🧠 SAFETY CHECK (IMPORTANT FIX)
      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", existingUser.id)
        .maybeSingle();

      if (!dbUser) {
        localStorage.removeItem("user");
        alert("User no longer exists. Please sign up again ❌");
        return;
      }

      // ✅ LOGIN SUCCESS
      localStorage.setItem("user", JSON.stringify(dbUser));

      router.push("/home");

    } catch (err) {
      console.error(err);
      alert("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-purple-200 px-4">

      {/* CARD */}
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-pink-100">

        {/* TITLE */}
        <h1 className="text-3xl font-extrabold text-center text-pink-500 mb-2">
          🎀 Chaotic Club
        </h1>

        <p className="text-center text-sm text-gray-500 mb-6">
          enter your chaotic world 💕
        </p>

        {/* INPUTS */}
        <div className="flex flex-col gap-4">

          <input
            placeholder="Nickname 💖"
            className="w-full px-4 py-3 rounded-xl bg-pink-50 border border-pink-200
                       text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password 🔒"
            className="w-full px-4 py-3 rounded-xl bg-pink-50 border border-pink-200
                       text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400
                     hover:scale-[1.03] active:scale-[0.98]
                     text-white font-semibold shadow-lg transition-all"
        >
          {loading ? "Entering..." : "Enter Club 💌"}
        </button>

        {/* FOOTER */}
        <p className="text-xs text-center mt-5 text-gray-500">
          new user = auto sign up ✨
        </p>

      </div>

    </main>
  );
}