import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 px-4">
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-10 w-full max-w-md text-center">
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-pink-600">
          Chaotic Club 🎀
        </h1>

        <p className="text-gray-600 mt-3">
          Create chaos. Play together. Have fun 💫
        </p>

        {/* Buttons */}
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

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          made for chaotic friends 💕
        </p>

      </div>
    </main>
  );
}