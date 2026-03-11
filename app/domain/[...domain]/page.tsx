import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'

export default async function CustomDomainSite({ params }: { params: Promise<{ domain: string[] }> }) {
  // 🧠 CATCH-ALL ROUTER LOGIC FOR CUSTOM DOMAINS
  // If URL is /domain/luigispizza.com/about -> domain is ['luigispizza.com', 'about']
  const resolvedParams = await params;
  const customDomain = resolvedParams.domain[0];
  const pagePath = resolvedParams.domain.length > 1 ? '/' + resolvedParams.domain.slice(1).join('/') : '/';

  // 1. Fetch the site config using the Custom Domain
  const { data } = await supabase
    .from('websites')
    .select('pages, page_blocks, is_active')
    .eq('custom_domain', customDomain)
    .single();

  // 2. Kill Switch / 404 Check
  if (!data || data.is_active === false) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white font-sans">
              <h1 className="text-4xl font-black mb-2">404 | Site Unavailable</h1>
              <p className="text-gray-400">This website is currently offline or suspended.</p>
          </div>
      )
  }

  // 3. Find the exact page the user requested
  let blocks = [];
  if (data.pages && data.pages[pagePath]) {
      blocks = data.pages[pagePath].blocks;
  } else if (pagePath === '/' && data.page_blocks) {
      // Legacy fallback
      blocks = typeof data.page_blocks === 'string' ? JSON.parse(data.page_blocks) : data.page_blocks;
  } else {
      return notFound(); 
  }

  // 4. Render the Live Page!
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
        
        <style>{`
            @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .animate-marquee { animation: scroll 30s linear infinite; width: max-content; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {blocks.map((block: any) => {
            const bgStyles: any = { backgroundColor: block.data.bgColor, color: block.data.textColor }
            if (block.data.bgImage) { bgStyles.backgroundImage = `url(${block.data.bgImage})`; bgStyles.backgroundSize = 'cover'; bgStyles.backgroundPosition = 'center'; }
            
            let borderClass = "w-full"; 
            if (block.data.borderStyle === 'minimal') borderClass = "w-[90%] max-w-7xl mx-auto my-12 rounded-3xl border border-gray-200 shadow-sm overflow-hidden";
            if (block.data.borderStyle === 'shadow') borderClass = "w-[90%] max-w-7xl mx-auto my-12 rounded-2xl shadow-2xl overflow-hidden";
            if (block.data.borderStyle === 'tv') borderClass = "w-[95%] max-w-7xl mx-auto my-16 border-[16px] border-gray-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative";

            if (block.type === 'nav') return (
                <nav key={block.id} style={bgStyles} className={`px-6 md:px-12 py-5 flex justify-between items-center border-b border-opacity-20 z-50 shadow-sm shrink-0 ${borderClass}`}>
                    <a href="/" className="flex items-center gap-3">
                        {block.data.logoImage && <img src={block.data.logoImage} alt="Logo" className="h-10 object-contain" />}
                        {!block.data.logoImage && <div className="text-2xl font-black tracking-tighter uppercase">{block.data.logoText}</div>}
                    </a>
                    <div className="hidden md:flex gap-8 text-sm font-bold opacity-80">
                        {block.data.links?.map((link:any, i:number) => {
                            // 🛑 DIFFERENT FROM PUBLIC ROUTER: Real domains just use the raw path!
                            const finalUrl = link.url;
                            return <a key={i} href={finalUrl} className="hover:opacity-100 transition">{link.name}</a>
                        })}
                    </div>
                    <a href={block.data.ctaLink} style={{ backgroundColor: block.data.textColor, color: block.data.bgColor }} className="px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:scale-105 transition">{block.data.ctaText}</a>
                </nav>
            )
            
            if (block.type === 'hero') return (
                <div key={block.id} className={`relative min-h-[75vh] flex items-center justify-center text-center px-6 shrink-0 overflow-hidden ${borderClass}`} style={{ color: block.data.textColor || '#ffffff' }}>
                    {block.data.bgVideo ? ( <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0"><source src={block.data.bgVideo} type="video/mp4" /></video> ) : ( <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${block.data.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div> )}
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <h1 className="relative z-20 text-5xl md:text-7xl lg:text-8xl font-black drop-shadow-2xl tracking-tight max-w-5xl leading-tight">{block.data.headline}</h1>
                </div>
            )

            if (block.type === 'video') return (
                <div key={block.id} style={bgStyles} className={`py-24 px-6 shrink-0 ${borderClass}`}>
                    <div className="max-w-5xl mx-auto text-center">
                        {block.data.heading && <h2 className="text-3xl md:text-4xl font-bold mb-10 tracking-tight">{block.data.heading}</h2>}
                        <div className="aspect-video bg-black overflow-hidden shadow-2xl rounded-2xl">
                            <video controls src={block.data.url} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            )
            
            if (block.type === 'features') return (
                <div key={block.id} style={bgStyles} className={`py-24 px-6 shrink-0 ${borderClass}`}>
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">{block.data.heading}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {block.data.items?.map((item:any, i:number) => (
                                <div key={i} className="space-y-4 p-8 rounded-2xl border border-black/10 transition bg-black/5 overflow-hidden hover:-translate-y-1 hover:shadow-lg duration-300">
                                    {item.image ? ( <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-xl shadow-md mb-6" /> ) : ( <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto text-2xl font-black shadow-md" style={{ backgroundColor: block.data.textColor, color: block.data.bgColor }}>{i+1}</div> )}
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="opacity-80 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
            
            if (block.type === 'split') return (
                <div key={block.id} style={bgStyles} className={`flex flex-col ${block.data.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} shrink-0 ${borderClass}`}>
                    <div className="md:w-1/2 min-h-[400px] md:min-h-[600px]" style={{ backgroundImage: `url(${block.data.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div className="md:w-1/2 p-12 lg:p-24 flex flex-col justify-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{block.data.heading}</h2>
                        <p className="text-lg opacity-80 leading-relaxed whitespace-pre-line">{block.data.content}</p>
                    </div>
                </div>
            )
            
            if (block.type === 'menu') return (
                <div key={block.id} style={bgStyles} className={`py-24 px-6 shrink-0 ${borderClass}`}>
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-black mb-16 text-center uppercase tracking-widest">{block.data.category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {block.data.items?.map((item: any, idx: number) => (
                                <div key={idx} className="group/item">
                                    <div className="flex justify-between items-baseline mb-2 border-b-2 border-dotted border-current pb-2 opacity-90"><h3 className="text-xl font-bold pr-4">{item.name}</h3><span className="text-lg font-black pl-4">{item.price}</span></div>
                                    <p className="opacity-70 italic pt-2">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
            
            if (block.type === 'gallery') {
                const items = block.data.items || block.data.images?.map((url:string)=>({url, caption:''})) || []
                const renderItems = block.data.autoScroll ? [...items, ...items, ...items, ...items] : items; 
                
                return (
                <div key={block.id} style={bgStyles} className={`py-16 shrink-0 relative overflow-hidden ${borderClass}`}>
                    {block.data.layout === 'carousel' ? (
                        <div className={`flex gap-6 px-6 ${block.data.autoScroll ? 'animate-marquee hover:[animation-play-state:paused]' : 'overflow-x-auto snap-x snap-mandatory hide-scrollbar'}`}>
                            {renderItems.map((item:any, i:number) => (
                                <div key={i} className="shrink-0 w-[85vw] md:w-[35vw] snap-center rounded-xl overflow-hidden shadow-xl bg-black/5 border border-black/10 flex flex-col relative" style={{ height: '500px' }}>
                                    <img src={item.url} className="w-full h-full object-cover flex-1" alt="Gallery item" />
                                    {item.caption && <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/70 to-transparent text-white p-6 pt-12 font-bold text-center tracking-wide text-lg">{item.caption}</div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 w-full px-6 gap-4">
                            {items.map((item:any, i:number) => (
                                <div key={i} className="aspect-square hover:opacity-90 transition rounded-xl overflow-hidden shadow-sm relative group" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    {item.caption && <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 text-white p-4 font-bold text-center text-lg">{item.caption}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            if (block.type === 'testimonials') return (
                <div key={block.id} style={bgStyles} className={`py-24 px-6 border-y border-black/5 shrink-0 ${borderClass}`}>
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">{block.data.heading}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {block.data.reviews?.map((rev:any, i:number) => (
                                <div key={i} className="p-10 rounded-3xl shadow-md border border-black/10 relative bg-white/5">
                                    <div className="text-yellow-500 text-2xl mb-4 tracking-widest drop-shadow-sm">★★★★★</div>
                                    <p className="text-xl font-medium leading-relaxed mb-6 opacity-90">"{rev.text}"</p>
                                    <p className="font-bold uppercase tracking-wide text-sm">- {rev.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
            
            if (block.type === 'text') return (
                <div key={block.id} style={bgStyles} className={`py-24 px-6 text-center shrink-0 ${borderClass}`}>
                    <div className="max-w-4xl mx-auto"><p className="text-2xl whitespace-pre-line leading-relaxed font-light opacity-90">{block.data.content}</p></div>
                </div>
            )
            
            if (block.type === 'footer') return (
                <footer key={block.id} style={bgStyles} className={`py-20 text-center px-6 mt-auto shrink-0 ${borderClass}`}>
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h3 className="text-2xl font-black mb-6 tracking-tight">VISIT US</h3>
                        <p className="text-lg opacity-80">{block.data.address}</p>
                        <p className="text-lg font-medium opacity-90">{block.data.phone}</p>
                        <p className="opacity-80">{block.data.hours}</p>
                        <div className="w-24 h-px bg-current opacity-20 mx-auto my-10"></div>
                        <p className="text-sm font-medium tracking-wide uppercase opacity-60">{block.data.copyright}</p>
                    </div>
                </footer>
            )
            return null;
        })}
    </div>
  )
}