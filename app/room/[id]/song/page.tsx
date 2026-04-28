"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getVideoId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export default function SongPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [user, setUser] = useState<any>(null);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const [songTitle, setSongTitle] = useState("");
  const [songUrl, setSongUrl] = useState("");

  // 🎧 PLAYER
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [playedIds, setPlayedIds] = useState<string[]>([]);

  // 👤 USER
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // 📂 LOAD PLAYLISTS
  const loadPlaylists = async () => {
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    setPlaylists(data || []);
  };

  // 🎵 LOAD SONGS
  const loadSongs = async (playlistId: string) => {
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("created_at", { ascending: false });

    setSongs(data || []);

    // reset player
    setCurrentSong(null);
    setIsPlaying(false);
    setShuffleMode(false);
    setPlayedIds([]);
  };

  useEffect(() => {
    loadPlaylists();
  }, [roomId]);

  // ➕ CREATE PLAYLIST
  const createPlaylist = async () => {
    if (!playlistName || !user) return;

    await supabase.from("playlists").insert({
      room_id: roomId,
      user_id: user.id,
      name: playlistName,
    });

    setPlaylistName("");
    setShowCreate(false);
    loadPlaylists();
  };

  // 🎶 ADD SONG
  const addSong = async () => {
    if (!selectedPlaylist || !songUrl || !songTitle || !user) return;

    const videoId = getVideoId(songUrl);

    await supabase.from("songs").insert({
      playlist_id: selectedPlaylist.id,
      title: songTitle,
      youtube_url: songUrl,
      video_id: videoId,
      added_by: user.id,
    });

    setSongTitle("");
    setSongUrl("");
    loadSongs(selectedPlaylist.id);
  };

  // ❌ DELETE
  const deleteSong = async (song: any) => {
    if (song.added_by !== user.id) {
      alert("You can't delete this song ❌");
      return;
    }

    await supabase.from("songs").delete().eq("id", song.id);
    loadSongs(selectedPlaylist.id);
  };

  // ▶ / ⏸
  const togglePlay = (song: any) => {
    if (currentSong?.id === song.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);

      // ❗ turn off shuffle when manual play
      setShuffleMode(false);
      setPlayedIds([]);
    }
  };

  // 🔀 SHUFFLE
  const shufflePlaylist = () => {
    if (!songs.length) return;

    const remaining = songs.filter((s) => !playedIds.includes(s.id));
    const pool = remaining.length ? remaining : songs;

    const random = pool[Math.floor(Math.random() * pool.length)];

    setCurrentSong(random);
    setIsPlaying(true);
    setShuffleMode(true);
    setPlayedIds((prev) => [...prev, random.id]);
  };

  // ⏭ NEXT
  const nextSong = () => {
    if (!songs.length) return;

    if (shuffleMode) {
      shufflePlaylist();
      return;
    }

    const index = songs.findIndex((s) => s.id === currentSong?.id);
    const next = songs[index + 1] || songs[0];

    setCurrentSong(next);
    setIsPlaying(true);
  };

  // ⏮ PREV
  const prevSong = () => {
    if (!songs.length) return;

    const index = songs.findIndex((s) => s.id === currentSong?.id);
    const prev = songs[index - 1] || songs[songs.length - 1];

    setCurrentSong(prev);
    setIsPlaying(true);
  };

  // ⏹ STOP
  const stopSong = () => {
    setCurrentSong(null);
    setIsPlaying(false);
    setShuffleMode(false);
  };

  // 🎧 AUTO NEXT (simple fallback ~3min)
  useEffect(() => {
    if (!isPlaying || !currentSong) return;

    const timer = setTimeout(() => {
      nextSong();
    }, 180000); // 3 minutes

    return () => clearTimeout(timer);
  }, [currentSong, isPlaying]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      <h1 className="text-2xl font-bold text-pink-600 mb-4">
        🎵 My Playlists
      </h1>

      {/* CREATE */}
      <div className="bg-white/80 p-4 rounded-2xl shadow mb-4 border border-pink-200">
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-pink-400 text-gray-900 px-4 py-2 rounded-xl font-semibold"
          >
            ➕ Make Playlist
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-pink-300 text-gray-800"
            />
            <button
              onClick={createPlaylist}
              className="bg-purple-400 text-gray-900 px-4 rounded-xl font-semibold"
            >
              Create
            </button>
          </div>
        )}
      </div>

      {/* PLAYLISTS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {playlists.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setSelectedPlaylist(p);
              loadSongs(p.id);
            }}
            className="bg-white/80 p-4 rounded-2xl shadow border border-pink-100"
          >
            <p className="text-pink-600 font-semibold">{p.name}</p>
          </div>
        ))}
      </div>

      {/* SONG SECTION */}
      {selectedPlaylist && (
        <div className="bg-white/80 p-4 rounded-2xl shadow border border-pink-200">

          <h2 className="font-bold text-purple-600 mb-2">
            🎶 {selectedPlaylist.name}
          </h2>

          {/* 🎧 NOW PLAYING */}
          {currentSong && isPlaying && (
            <p className="mb-3 text-pink-600 font-semibold">
              🎧 Now Playing: {currentSong.title}
            </p>
          )}

          {/* 🔀 CONTROL */}
          <div className="flex gap-3 mb-4">
            {!shuffleMode ? (
              <button
                onClick={shufflePlaylist}
                className="px-4 py-2 rounded-xl bg-purple-400 text-gray-900"
              >
                🔀 Shuffle
              </button>
            ) : (
              <button
                onClick={stopSong}
                className="px-4 py-2 bg-red-400 rounded-xl text-gray-900"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* ADD SONG */}
          <div className="flex flex-col gap-2 mb-4">
            <input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Song title"
              className="p-2 rounded-xl border border-pink-300 text-gray-800"
            />

            <input
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="YouTube link"
              className="p-2 rounded-xl border border-pink-300 text-gray-800"
            />

            <button
              onClick={addSong}
              className="bg-pink-400 text-gray-900 py-2 rounded-xl"
            >
              ➕ Add Song
            </button>
          </div>

          {/* SONG LIST */}
          <div className="space-y-3">
            {songs.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center bg-white p-3 rounded-xl border border-pink-100"
              >
                <p className="text-gray-800">{s.title}</p>

                <div className="flex items-center gap-3">

                  <button onClick={prevSong} className="text-purple-500 text-lg">⏮</button>

                  <button
                    onClick={() => togglePlay(s)}
                    className="text-green-500 text-xl"
                  >
                    {currentSong?.id === s.id && isPlaying ? "⏸" : "▶"}
                  </button>

                  <button onClick={nextSong} className="text-purple-500 text-lg">⏭</button>

                  <button onClick={() => deleteSong(s)} className="text-red-500">✕</button>

                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* PLAYER */}
      {currentSong && isPlaying && (
        <iframe
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${currentSong.video_id}?autoplay=1`}
          allow="autoplay"
        />
      )}

    </main>
  );
}