"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function DecisionMaker() {
  const params = useParams();
  const roomId = params.id as string;

  const [input, setInput] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = [
    "#f9a8d4",
    "#f472b6",
    "#c084fc",
    "#a78bfa",
    "#fb7185",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
  ];

  // ➕ add option
  const addChoice = () => {
    if (!input.trim()) return;
    setChoices([...choices, input.trim()]);
    setInput("");
  };

  // ✏️ edit inline
  const updateChoice = (index: number, value: string) => {
    const updated = [...choices];
    updated[index] = value;
    setChoices(updated);
  };

  // ❌ delete option
  const deleteChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  // 🎡 spin logic
  const spin = () => {
    if (choices.length === 0 || spinning) return;

    setSpinning(true);
    setResult(null);

    const segmentAngle = 360 / choices.length;
    const randomIndex = Math.floor(Math.random() * choices.length);

    const extraSpins = 5 * 360;
    const targetAngle =
      extraSpins + randomIndex * segmentAngle + segmentAngle / 2;

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setResult(choices[randomIndex]);
      setSpinning(false);
    }, 3000);
  };

  // 🔁 RESPIN (KEEP RESULT)
  const respinKeep = () => {
    setResult(null);
    spin();
  };

  // ❌ REMOVE RESULT + RESPIN
  const respinRemove = () => {
    if (!result) return;

    const updated = choices.filter((c) => c !== result);
    setChoices(updated);
    setResult(null);

    setTimeout(() => {
      if (updated.length > 0) {
        spin();
      }
    }, 200);
  };

  // 🎨 wheel draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const center = size / 2;
    const radius = size / 2;

    ctx.clearRect(0, 0, size, size);

    // EMPTY WHEEL
    if (choices.length === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius - 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe4f0";
      ctx.fill();

      ctx.fillStyle = "#6b7280";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add options to start 🎡", center, center);
      return;
    }

    const angleStep = (Math.PI * 2) / choices.length;

    choices.forEach((choice, i) => {
      const start = i * angleStep;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, start + angleStep);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + angleStep / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#111";
      ctx.font = "14px sans-serif";
      ctx.fillText(choice, radius - 10, 5);
      ctx.restore();
    });
  }, [choices]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-6">

      <h1 className="text-2xl font-bold text-pink-600 mb-4">
        🎡 Decision Maker
      </h1>

      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 rounded-xl border border-pink-300 text-black"
          placeholder="Add option..."
        />

        <button
          onClick={addChoice}
          className="bg-pink-400 text-white px-4 rounded-xl"
        >
          Add
        </button>
      </div>

      {/* OPTIONS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {choices.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-pink-200"
          >
            <input
              value={c}
              onChange={(e) => updateChoice(i, e.target.value)}
              className="bg-transparent outline-none text-pink-600 w-24"
            />
            <button onClick={() => deleteChoice(i)}>❌</button>
          </div>
        ))}
      </div>

      {/* POINTER */}
      <div className="flex justify-center relative z-20">
        <div className="absolute -top-2 text-red-500 text-3xl">▼</div>
      </div>

      {/* WHEEL */}
      <div className="flex justify-center mb-6">
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* SPIN */}
      <button
        onClick={spin}
        disabled={spinning}
        className="w-full py-3 bg-purple-400 text-white rounded-xl font-semibold shadow"
      >
        {spinning ? "Spinning..." : "🎡 Spin Wheel"}
      </button>

      {/* RESULT + RESPIN OPTIONS */}
      {result && (
        <div className="mt-6 bg-white p-5 rounded-2xl text-center shadow">

          <p className="text-lg font-bold text-pink-600">
            🎉 Result: {result}
          </p>

          <div className="flex gap-3 justify-center mt-4">

            <button
              onClick={respinKeep}
              className="px-4 py-2 bg-green-400 text-white rounded-xl"
            >
              🔁 Respin (keep)
            </button>

            <button
              onClick={respinRemove}
              className="px-4 py-2 bg-red-400 text-white rounded-xl"
            >
              ❌ Remove & Respin
            </button>

          </div>

        </div>
      )}

    </main>
  );
}