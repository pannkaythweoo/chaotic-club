"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SnapPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      // 1️⃣ get albums
      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .eq("room_id", roomId);

      if (!albumData) return;

      // 2️⃣ fix missing avatars by fetching from users table
      const enriched = await Promise.all(
        albumData.map(async (a) => {
          if (a.avatar) return a;

          const { data: user } = await supabase
            .from("users")
            .select("avatar")
            .eq("id", a.user_id)
            .maybeSingle();

          return {
            ...a,
            avatar: user?.avatar || "",
          };
        })
      );

      setAlbums(enriched);
    };

    if (roomId) load();
  }, [roomId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      <h1 className="text-2xl font-bold text-pink-600 mb-6">
        Snap Collection 📸
      </h1>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">

        {albums.map((a) => (
          <div
            key={a.id}
            onClick={() => router.push(`/room/${roomId}/snap/${a.id}`)}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 text-center shadow-md hover:scale-105 transition cursor-pointer"
          >

            {/* PROFILE PICTURE */}
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-pink-300 bg-pink-100 flex items-center justify-center">

              {a.avatar ? (
                <img
                  src={a.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/default-avatar.png"
                  className="w-full h-full object-cover"
                />
              )}

            </div>

            {/* NAME */}
            <p className="mt-2 text-pink-600 font-semibold">
              {a.member_name}
            </p>

          </div>
        ))}

      </div>

    </main>
  );
}