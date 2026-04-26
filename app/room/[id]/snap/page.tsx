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
      const { data } = await supabase
        .from("albums")
        .select("*")
        .eq("room_id", roomId);

      setAlbums(data || []);
    };

    if (roomId) load();
  }, [roomId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      <h1 className="text-2xl font-bold text-pink-600 mb-6">
        Snap Collection 📸
      </h1>

      {/* ALBUM GRID */}
      <div className="grid grid-cols-2 gap-4">

        {albums.map((a) => (
          <div
            key={a.id}
            onClick={() =>
              router.push(`/room/${roomId}/snap/${a.id}`)
            }
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 text-center shadow-md hover:scale-105 transition cursor-pointer"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold text-xl">
              {a.member_name?.[0]?.toUpperCase()}
            </div>

            <p className="mt-2 text-pink-600 font-semibold">
              {a.member_name}
            </p>
          </div>
        ))}

      </div>

    </main>
  );
}