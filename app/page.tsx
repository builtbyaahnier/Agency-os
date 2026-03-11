import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden relative font-sans">
      
      {/* 🌌 BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      {/* 🧭 NAVIGATION */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">A</span>
          Agency OS
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-white transition hidden md:block">
            Client Login
          </Link>
          <Link href="#contact" className="px-6 py-2.5 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition shadow-lg shadow-white/10 hover:scale-105 duration-200">
            Get Started
          </Link>
        </div>
      </nav>

      {/* 🦸‍♂️ HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 md:pt-32 pb-32 max-w-5xl mx-auto text-center">
        
        {/* AVAILABILITY BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Accepting New Clients
        </div>

        {/* HEADLINE */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1]">
          Websites that <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            fill seats.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-16 leading-relaxed font-medium">
          We design, build, and manage high-converting digital storefronts for businesses that want more traffic, more bookings, and zero technical headaches. 
        </p>

        {/* 🎬 FOUNDER VIDEO STAGE (PLACEHOLDER) */}
        <div className="w-full max-w-4xl mx-auto relative group mt-4 cursor-pointer">
          {/* Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-300"></div>
          
          <div className="relative aspect-video bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center hover:bg-gray-900 transition-colors shadow-2xl">
            
            {/* The Stage Elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            {/* Play Button */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform duration-300 mb-6 z-10 border border-indigo-400/30">
              <div className="w-0 h-0 border-t-[12px] md:border-t-[16px] border-t-transparent border-l-[20px] md:border-l-[26px] border-l-white border-b-[12px] md:border-b-[16px] border-b-transparent ml-2"></div>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-white mb-2 z-10 tracking-tight">Our Story</h3>
            <p className="text-gray-400 text-sm md:text-base max-w-md text-center z-10 px-4">Meet the founders. Learn how we started, our journey, and why we are obsessed with building tools that grow local businesses.</p>
            
            {/* Fake Video UI */}
            <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-gray-300 border border-white/5">00:00 / --:--</div>
          </div>
        </div>

      </main>
    </div>
  )
}