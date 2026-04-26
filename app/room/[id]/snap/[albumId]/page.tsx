"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.albumId as string;

  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState("");

  // ✅ FIX: localStorage only in browser
  useEffect(() => {
    const name = localStorage.getItem("nickname") || "";
    setNickname(name);
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

  // ✅ FIXED UPLOAD (device upload like profile picture)
  const uploadPhoto = async () => {
    if (!file) return;

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
      uploaded_by: nickname,
    });

    setFile(null);
    load();
  };

  const deletePhoto = async (photo: any) => {
    if (photo.uploaded_by !== nickname) {
      alert("Only uploader can delete 😤");
      return;
    }

    await supabase.from("photos").delete().eq("id", photo.id);
    load();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      {/* HEADER */}
      <h1 className="text-xl font-bold text-pink-600 mb-2">
        {album?.member_name}'s Album 💕
      </h1>

      {/* UPLOAD (FIXED LIKE PROFILE UPLOAD STYLE) */}
      <div className="flex gap-3 mb-4 items-center">

        <label className="px-4 py-2 bg-white rounded-xl border border-pink-300 cursor-pointer">
          📤 Choose Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          onClick={uploadPhoto}
          className="px-4 py-2 bg-pink-400 text-white rounded-xl"
        >
          Upload
        </button>

      </div>

      {/* PHOTOS */}
      <div className="grid grid-cols-3 gap-3">

        {photos.map((p) => (
          <div key={p.id} className="relative group">

            <img
              src={p.image_url}
              className="rounded-xl w-full h-28 object-cover"
            />

            {/* DELETE */}
            {p.uploaded_by === nickname && (
              <button
                onClick={() => deletePhoto(p)}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 rounded opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            )}

            {/* DOWNLOAD BUTTON */}
            <a
              href={p.image_url}
              download
              target="_blank"
              className="absolute bottom-1 right-1 bg-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
            >
              ⬇
            </a>

          </div>
        ))}

      </div>

    </main>
  );
}