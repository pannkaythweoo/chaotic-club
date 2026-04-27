"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.albumId as string;

  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (albumId) load();
  }, [albumId]);

  const load = async () => {
    const { data: albumData } = await supabase
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .single();

    setAlbum(albumData);

    const { data: photoData } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: false });

    setPhotos(photoData || []);
  };

  // 📸 UPLOAD
  const uploadPhoto = async (file: File) => {
    if (!file || !user) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("snaps")
      .upload(fileName, file);

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    const { data } = supabase.storage
      .from("snaps")
      .getPublicUrl(fileName);

    await supabase.from("photos").insert({
      album_id: albumId,
      image_url: data.publicUrl,
      uploaded_by: user.id,
    });

    load();
  };

  // ❌ DELETE (UPDATED)
  const deletePhoto = async (photo: any) => {
    if (!user) return;

    // ❌ not uploader
    if (photo.uploaded_by !== user.id) {
      alert("You can't delete this photo ❌");
      return;
    }

    // ⚠️ confirmation
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this photo?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      alert("Delete failed ❌");
      return;
    }

    load();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      <div className="bg-white/80 border border-pink-200 rounded-2xl p-4 shadow-md mb-4">
        <h1 className="text-xl font-bold text-pink-600">
          💕 {album?.member_name}'s Album
        </h1>
        <p className="text-sm text-gray-600">
          Share memories with your club ✨
        </p>
      </div>

      {/* ADD PHOTO */}
      <div className="mb-5">
        <label className="inline-block px-4 py-3 bg-pink-400 text-white rounded-xl cursor-pointer font-semibold shadow">
          📸 Add Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
            }}
          />
        </label>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative group">

            <img
              src={p.image_url}
              className="rounded-xl w-full h-28 object-cover shadow"
            />

            {/* DELETE */}
            {user && p.uploaded_by === user.id && (
              <button
                onClick={() => deletePhoto(p)}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 rounded opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            )}

            {/* DOWNLOAD */}
            <a
              href={p.image_url}
              target="_blank"
              download
              className="absolute bottom-1 right-1 bg-white text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100"
            >
              ⬇
            </a>

          </div>
        ))}
      </div>

    </main>
  );
}