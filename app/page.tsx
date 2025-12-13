export default function Home() {
  return (
    <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center">
      <h1 className="text-[#06b6d4] text-6xl font-extrabold tracking-wide drop-shadow-lg">
        AUCTION SYSTEM
      </h1>

      <p className="text-[#94a3b8] mt-4 text-xl">Choose a mode to continue</p>

      <div className="mt-10 flex gap-6">
        {/* Controller Button */}
        <a
          href="/controller"
          className="px-8 py-4 bg-[#06b6d4] text-[#0f172a] font-bold rounded-xl shadow-lg hover:scale-105 transition"
        >
          Controller Mode
        </a>

        {/* Display Button */}
        <a
          href="/display"
          className="px-8 py-4 bg-[#0b1220] text-[#06b6d4] border border-[#06b6d4] rounded-xl shadow-lg hover:scale-105 transition"
        >
          Display Mode
        </a>
      </div>
    </div>
  );
}
