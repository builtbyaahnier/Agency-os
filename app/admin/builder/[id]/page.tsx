'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

type Block = { id: string; type: 'hero' | 'text' | 'menu' | 'split' | 'nav' | 'features' | 'testimonials' | 'gallery' | 'footer' | 'video'; data: any; }
type Tab = 'templates' | 'add' | 'layers' | 'edit' | 'publish';
type Template = { name: string; blocks: Block[] };
type PageData = { name: string; path: string; blocks: Block[] };

export default function AdminBuilder() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [pagesData, setPagesData] = useState<Record<string, PageData>>({ '/': { name: 'Home', path: '/', blocks: [] } })
  const [activePagePath, setActivePagePath] = useState<string>('/')
  const blocks = pagesData[activePagePath]?.blocks || []

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // ☁️ UPLOAD LOADING STATE
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState('') 
  const [isActive, setIsActive] = useState(true) 
  const [customDomain, setCustomDomain] = useState('') 
  const [activeTab, setActiveTab] = useState<Tab>('add')
  const [recentColors, setRecentColors] = useState<string[]>(['#ffffff', '#000000', '#4f46e5', '#ef4444', '#f9fafb', '#111827'])
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  useEffect(() => {
    const loadSite = async () => {
      const { data } = await supabase.from('websites').select('pages, page_blocks, slug, is_active, custom_domain').eq('client_id', clientId).single()
      if (data) {
        if (data.pages && Object.keys(data.pages).length > 0) setPagesData(data.pages) 
        else if (data.page_blocks) setPagesData({ '/': { name: 'Home', path: '/', blocks: typeof data.page_blocks === 'string' ? JSON.parse(data.page_blocks) : data.page_blocks } })
        if (data.slug) setSlug(data.slug)
        if (data.is_active !== undefined) setIsActive(data.is_active)
        if (data.custom_domain) setCustomDomain(data.custom_domain) 
      }
      const savedTpls = localStorage.getItem('agency_templates')
      if (savedTpls) setCustomTemplates(JSON.parse(savedTpls))
      setLoading(false)
    }
    loadSite()
  }, [clientId])

  // ☁️ UNIVERSAL SUPABASE UPLOADER FUNCTION
  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
      const file = e.target.files?.[0]
      if (!file) return
      setIsUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`
      const filePath = `${clientId}/${fileName}` // Organizes files by client ID folder!

      const { error } = await supabase.storage.from('agency-media').upload(filePath, file)
      
      if (error) {
          alert("Upload failed: " + error.message)
          setIsUploading(false)
          return
      }

      const { data } = supabase.storage.from('agency-media').getPublicUrl(filePath)
      callback(data.publicUrl)
      setIsUploading(false)
  }

  const createNewPage = () => {
      const name = prompt("Enter page name (e.g., 'About Us'):")
      if (!name) return
      let path = prompt("Enter URL path (e.g., '/about'):")
      if (!path) return
      if (!path.startsWith('/')) path = '/' + path
      if (pagesData[path]) return alert("A page with this path already exists!")
      
      const homeBlocks = pagesData['/']?.blocks || []
      const navBlock = homeBlocks.find(b => b.type === 'nav')
      const footerBlock = homeBlocks.find(b => b.type === 'footer')
      const initialBlocks: any[] = []
      if (navBlock) initialBlocks.push(JSON.parse(JSON.stringify(navBlock)))
      if (footerBlock) initialBlocks.push(JSON.parse(JSON.stringify(footerBlock)))
      
      setPagesData(prev => ({ ...prev, [path]: { name, path, blocks: initialBlocks } }))
      setActivePagePath(path)
      setActiveTab('add')
  }

  const setBlocks = (newBlocks: Block[] | ((prev: Block[]) => Block[])) => {
      setPagesData(prev => {
          const updatedBlocks = typeof newBlocks === 'function' ? newBlocks(prev[activePagePath].blocks) : newBlocks;
          return { ...prev, [activePagePath]: { ...prev[activePagePath], blocks: updatedBlocks } }
      })
  }

  const handleColorChange = (key: 'bgColor' | 'textColor', color: string) => {
      updateActiveBlock({ [key]: color })
      setRecentColors(prev => { const newColors = new Set([color, ...prev]); return Array.from(newColors).slice(0, 8) })
  }

  const saveAsTemplate = () => {
      if (blocks.length === 0) return alert("Add some blocks first!")
      const name = prompt("Name your preset:")
      if (!name) return
      const newTpl = { name, blocks: JSON.parse(JSON.stringify(blocks)) }
      const updatedTpls = [...customTemplates, newTpl]
      setCustomTemplates(updatedTpls)
      localStorage.setItem('agency_templates', JSON.stringify(updatedTpls))
      alert("Template saved successfully!")
  }

  const addBlock = (type: Block['type']) => {
    const theme = { bgColor: '#ffffff', textColor: '#111827', bgImage: '', borderStyle: 'none' } 
    let defaultData: any = { ...theme }

    if (type === 'hero') defaultData = { headline: 'Experience Authentic Italian', bgImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600', bgVideo: '', textColor: '#ffffff' }
    if (type === 'video') defaultData = { ...theme, heading: 'Watch Our Story', url: 'https://www.w3schools.com/html/mov_bbb.mp4', borderStyle: 'tv' }
    if (type === 'gallery') defaultData = { ...theme, layout: 'carousel', autoScroll: false, items: [{url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800", caption: "Head Chef Mario"}, {url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800", caption: "Our Kitchen"}] }
    if (type === 'text') defaultData = { ...theme, content: 'Add your text here...' }
    if (type === 'split') defaultData = { ...theme, heading: 'Our Story', content: 'We started in 2010...', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000', imageLeft: true }
    if (type === 'menu') defaultData = { ...theme, category: 'Signature Dishes', items: [{ name: 'Truffle Burger', price: '$18', desc: 'Wagyu beef, truffle aioli' }] }
    if (type === 'nav') defaultData = { bgColor: '#ffffff', textColor: '#111827', logoText: "LUIGI'S", logoImage: "", ctaText: "Order Now", ctaLink: "/order", links: [{name: "Home", url: "/"}, {name: "About", url: "/about"}] }
    if (type === 'features') defaultData = { ...theme, heading: "Why Choose Us", items: [{title: "Fresh Ingredients", desc: "Sourced locally every day.", image: ""}] } 
    if (type === 'testimonials') defaultData = { bgColor: '#f9fafb', textColor: '#111827', heading: "Guest Reviews", reviews: [{name: "Sarah J.", text: "Best food in the city!"}] }
    if (type === 'footer') defaultData = { bgColor: '#030712', textColor: '#9ca3af', address: "123 Main St", phone: "(555) 123-4567", hours: "Mon-Sun: 11am - 10pm", copyright: `© ${new Date().getFullYear()} Luigi's Pizza` }

    const newBlock: Block = { id: Math.random().toString(36).substring(2, 9), type, data: defaultData }
    setBlocks([...blocks, newBlock])
    setActiveBlockId(newBlock.id)
    setActiveTab('edit')
  }

  const removeBlock = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setBlocks(blocks.filter(b => b.id !== id)); if (activeBlockId === id) setActiveBlockId(null) }
  
  const updateActiveBlock = (newData: any) => {
    setPagesData(prev => {
        const newState = JSON.parse(JSON.stringify(prev))
        const activeBlock = newState[activePagePath].blocks.find((b: Block) => b.id === activeBlockId)
        if (!activeBlock) return prev
        const mergedData = { ...activeBlock.data, ...newData }
        activeBlock.data = mergedData
        if (activeBlock.type === 'nav' || activeBlock.type === 'footer') {
            Object.keys(newState).forEach(path => {
                const matchingBlock = newState[path].blocks.find((b: Block) => b.type === activeBlock.type)
                if (matchingBlock) matchingBlock.data = mergedData
            })
        }
        return newState
    })
  }

  const updateArrayItem = (arrayName: string, index: number, field: string, value: string) => { const activeBlock = blocks.find(b => b.id === activeBlockId); if (!activeBlock) return; const newArray = [...activeBlock.data[arrayName]]; newArray[index] = { ...newArray[index], [field]: value }; updateActiveBlock({ [arrayName]: newArray }) }
  const addArrayItem = (arrayName: string, defaultObj: any) => { const activeBlock = blocks.find(b => b.id === activeBlockId); if (!activeBlock) return; updateActiveBlock({ [arrayName]: [...(activeBlock.data[arrayName] || []), defaultObj] }) }
  const removeArrayItem = (arrayName: string, index: number) => { const activeBlock = blocks.find(b => b.id === activeBlockId); if (!activeBlock) return; updateActiveBlock({ [arrayName]: activeBlock.data[arrayName].filter((_: any, i: number) => i !== index) }) }
  
  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedIdx(index); e.dataTransfer.effectAllowed = 'move'; }
  const handleDragEnter = (e: React.DragEvent, index: number) => { e.preventDefault(); if (draggedIdx === null || draggedIdx === index) return; const newBlocks = [...blocks]; const draggedBlock = newBlocks[draggedIdx]; newBlocks.splice(draggedIdx, 1); newBlocks.splice(index, 0, draggedBlock); setDraggedIdx(index); setBlocks(newBlocks); }
  const handleDragEnd = () => setDraggedIdx(null)

  const saveSite = async () => {
    setIsSaving(true)
    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-')
    const formattedDomain = customDomain.toLowerCase().replace(/\s+/g, '').replace('https://', '').replace('http://', '').replace('www.', '')
    const { error } = await supabase.from('websites').upsert({ client_id: clientId, page_blocks: blocks, pages: pagesData, slug: formattedSlug || null, is_active: isActive, custom_domain: formattedDomain || null }, { onConflict: 'client_id' })
    if (error) { if (error.code === '23505') alert("⚠️ That URL Slug or Domain is already taken!"); else alert("Error: " + error.message) } else { setSlug(formattedSlug); setCustomDomain(formattedDomain); alert("Site saved successfully! 🚀") }
    setIsSaving(false)
  }

  const activeBlock = blocks.find(b => b.id === activeBlockId)
  if (loading) return <div className="p-10 text-center font-bold">Loading Architect...</div>
  const galleryItems = activeBlock?.type === 'gallery' ? (activeBlock.data.items || activeBlock.data.images?.map((url:string)=>({url, caption:''}))) || [] : []

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: scroll 30s linear infinite; width: max-content; } .animate-marquee:hover { animation-play-state: paused; } .resize-handle { resize: horizontal; overflow: hidden; min-width: 250px; max-width: 80vw; border-right: 3px solid rgba(0,0,0,0.1); cursor: ew-resize; } .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg z-20 h-full shrink-0">
        <div className="bg-gray-900 text-white shrink-0 flex flex-col border-b border-gray-800">
            <div className="p-4 flex justify-between items-center"><h1 className="font-bold text-sm tracking-wide uppercase">Agency Architect</h1><button onClick={() => router.push('/dashboard')} className="text-xs text-gray-400 hover:text-white">Exit</button></div>
            <div className="bg-gray-950 px-4 py-3 flex items-center justify-between gap-2 border-t border-gray-800">
                <select value={activePagePath} onChange={(e) => { setActivePagePath(e.target.value); setActiveTab('layers'); setActiveBlockId(null); }} className="flex-1 bg-gray-800 text-white border border-gray-700 p-1.5 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {Object.values(pagesData).map(page => <option key={page.path} value={page.path}>{page.name} ({page.path})</option>)}
                </select>
                <button onClick={createNewPage} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-indigo-500 transition shadow-sm">+ New Page</button>
            </div>
            {/* UPLOAD STATUS BAR */}
            {isUploading && <div className="bg-blue-600 text-white text-[10px] font-bold py-1 text-center animate-pulse">☁️ Uploading Media to Cloud...</div>}
        </div>
        
        <div className="flex border-b border-gray-200 bg-gray-50 text-[9px] font-bold text-gray-500 uppercase shrink-0 overflow-x-auto">
            <button className={`flex-1 py-3 px-1 text-center border-b-2 transition ${activeTab === 'templates' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActiveTab('templates')}>🔖 Presets</button>
            <button className={`flex-1 py-3 px-1 text-center border-b-2 transition ${activeTab === 'add' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActiveTab('add')}>➕ Add</button>
            <button className={`flex-1 py-3 px-1 text-center border-b-2 transition ${activeTab === 'layers' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActiveTab('layers')}>↕️ Layers</button>
            <button className={`flex-1 py-3 px-1 text-center border-b-2 transition ${activeTab === 'edit' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActiveTab('edit')}>⚙️ Edit</button>
            <button className={`flex-1 py-3 px-1 text-center border-b-2 transition ${activeTab === 'publish' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActiveTab('publish')}>🚀 Publish</button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            {activeTab === 'templates' && ( <div className="space-y-6"><button onClick={saveAsTemplate} className="w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition">💾 Save Page as Preset</button><div className="space-y-3"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Your Saved Presets</p>{customTemplates.length === 0 && <p className="text-sm text-gray-400 italic">No custom presets saved yet.</p>}{customTemplates.map((tpl, i) => (<div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-500 transition cursor-pointer" onClick={() => { if(confirm("Replace current canvas with this preset?")) setBlocks(tpl.blocks) }}><span className="font-bold text-gray-700">{tpl.name}</span><span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{tpl.blocks.length} Blocks</span></div>))}</div></div> )}
            {activeTab === 'add' && ( <div className="space-y-4"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Component Library</p><div className="grid grid-cols-2 gap-2"><button onClick={() => addBlock('nav')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">🧭 Navigation</button><button onClick={() => addBlock('hero')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">🖼️ Hero</button><button onClick={() => addBlock('features')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">🎯 Features</button><button onClick={() => addBlock('split')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">🌗 Split</button><button onClick={() => addBlock('menu')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">🍽️ Menu</button><button onClick={() => addBlock('gallery')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">📸 Gallery</button><button onClick={() => addBlock('video')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">▶️ Video</button><button onClick={() => addBlock('testimonials')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">⭐ Reviews</button><button onClick={() => addBlock('text')} className="bg-white border border-gray-300 rounded p-3 text-xs font-semibold hover:border-indigo-500 shadow-sm transition">📝 Text</button><button onClick={() => addBlock('footer')} className="col-span-2 bg-gray-900 text-white border border-gray-800 rounded p-3 text-xs font-semibold hover:bg-gray-700 shadow-sm transition">🛑 Footer</button></div></div> )}
            {activeTab === 'layers' && ( <div className="space-y-4 h-full"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Page Layers</p>{blocks.length === 0 && <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">No blocks added yet.</div>}<div className="space-y-2 pb-10">{blocks.map((block, i) => (<div key={block.id} draggable onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragOver={(e) => e.preventDefault()} onDragEnd={handleDragEnd} onClick={() => { setActiveBlockId(block.id); setActiveTab('edit'); }} className={`p-3 rounded-md border cursor-grab active:cursor-grabbing flex justify-between items-center transition shadow-sm ${activeBlockId === block.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white hover:border-gray-300'} ${draggedIdx === i ? 'opacity-50' : 'opacity-100'}`}><div className="font-bold text-sm text-gray-700 capitalize flex items-center gap-3"><span className="text-gray-300 cursor-grab">⋮⋮</span><span className="text-gray-400 text-xs">{(i+1).toString().padStart(2, '0')}</span> {block.type}</div><button onClick={(e) => removeBlock(block.id, e)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded ml-1">×</button></div>))}</div></div> )}
            
            {activeTab === 'edit' && (
                <div className="space-y-4 pb-10">
                    <div className="flex justify-between items-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Block Settings</p>{activeBlock && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-1 rounded font-bold uppercase">{activeBlock.type}</span>}</div>
                    {!activeBlock && <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">Select a layer to edit.</div>}
                    
                    {/* 🎨 GLOBAL SETTINGS WITH UPLOAD 📤 */}
                    {activeBlock && activeBlock.type !== 'hero' && activeBlock.type !== 'nav' && activeBlock.type !== 'footer' && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-3">
                            <div className="flex gap-3"><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Background Color</label><input type="color" value={activeBlock.data.bgColor || '#ffffff'} onChange={e => handleColorChange('bgColor', e.target.value)} className="w-full h-8 cursor-pointer rounded" /></div><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Text Color</label><input type="color" value={activeBlock.data.textColor || '#000000'} onChange={e => handleColorChange('textColor', e.target.value)} className="w-full h-8 cursor-pointer rounded" /></div></div>
                            <div className="border-t border-gray-100 pt-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Background Image</label>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="https://..." className="flex-1 border border-gray-300 p-2 rounded text-xs focus:ring-1 focus:ring-indigo-500" value={activeBlock.data.bgImage || ''} onChange={e => updateActiveBlock({ bgImage: e.target.value })} />
                                    <label className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs font-bold cursor-pointer hover:bg-indigo-100 flex items-center justify-center">
                                        📤 <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ bgImage: url }))} />
                                    </label>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-2"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Block Container Style</label><select value={activeBlock.data.borderStyle || 'none'} onChange={e => updateActiveBlock({ borderStyle: e.target.value })} className="w-full border p-1.5 rounded text-xs bg-gray-50"><option value="none">None (Full Width)</option><option value="minimal">Minimal Rounded Box</option><option value="tv">Retro TV Frame</option><option value="shadow">Floating Shadow Box</option></select></div>
                        </div>
                    )}

                    {/* 🧭 NAV WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'nav' && ( <div className="space-y-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm relative"><div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">UNIVERSAL BLOCK</div><div><label className="block text-xs font-bold text-gray-700 pt-4">Logo Text</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.logoText} onChange={e => updateActiveBlock({ logoText: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-gray-700">Logo Image URL</label>
                        <div className="flex gap-2 mt-1">
                            <input type="text" placeholder="https://..." className="flex-1 border p-2 rounded text-sm" value={activeBlock.data.logoImage || ''} onChange={e => updateActiveBlock({ logoImage: e.target.value })} />
                            <label className="bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs font-bold cursor-pointer hover:bg-indigo-100 flex items-center justify-center shadow-sm">
                                📤 <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ logoImage: url }))} />
                            </label>
                        </div></div>
                        <div className="flex gap-3"><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Background</label><input type="color" value={activeBlock.data.bgColor || '#ffffff'} onChange={e => updateActiveBlock({ bgColor: e.target.value })} className="w-full h-8 cursor-pointer rounded" /></div><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Text Color</label><input type="color" value={activeBlock.data.textColor || '#000000'} onChange={e => updateActiveBlock({ textColor: e.target.value })} className="w-full h-8 cursor-pointer rounded" /></div></div><div className="border-t border-indigo-200 pt-3"><label className="block text-xs font-bold text-gray-700">Button (CTA)</label><div className="flex gap-2 mt-1"><input type="text" placeholder="Text" className="w-1/2 border p-2 rounded text-sm" value={activeBlock.data.ctaText} onChange={e => updateActiveBlock({ ctaText: e.target.value })} /><input type="text" placeholder="Link URL" className="w-1/2 border p-2 rounded text-sm" value={activeBlock.data.ctaLink} onChange={e => updateActiveBlock({ ctaLink: e.target.value })} /></div></div><div className="border-t border-indigo-200 pt-3"><label className="block text-xs font-bold text-gray-700 mb-2">Navigation Links</label>{activeBlock.data.links?.map((link:any, i:number) => (<div key={i} className="flex gap-2 mb-2 bg-white p-2 rounded border"><input type="text" placeholder="Name" className="w-1/3 border p-1 rounded text-xs" value={link.name} onChange={e => updateArrayItem('links', i, 'name', e.target.value)} /><input type="text" placeholder="URL (/about)" className="flex-1 border p-1 rounded text-xs" value={link.url} onChange={e => updateArrayItem('links', i, 'url', e.target.value)} /><button onClick={() => removeArrayItem('links', i)} className="text-red-500 font-bold px-2">×</button></div>))}<button onClick={() => addArrayItem('links', {name: 'New Link', url: '/'})} className="w-full bg-white text-xs font-bold py-2 rounded border border-indigo-100 text-indigo-600 hover:bg-indigo-100">+ Add Link</button></div></div> )}
                    
                    {/* 📸 GALLERY WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'gallery' && ( <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
                            <button onClick={() => updateActiveBlock({ layout: 'grid' })} className={`flex-1 text-xs py-1.5 rounded font-bold ${activeBlock.data.layout !== 'carousel' ? 'bg-white shadow' : 'text-gray-500'}`}>Grid</button>
                            <button onClick={() => updateActiveBlock({ layout: 'carousel' })} className={`flex-1 text-xs py-1.5 rounded font-bold ${activeBlock.data.layout === 'carousel' ? 'bg-white shadow' : 'text-gray-500'}`}>Carousel</button>
                        </div>
                        {activeBlock.data.layout === 'carousel' && ( <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-100 cursor-pointer"><input type="checkbox" checked={activeBlock.data.autoScroll || false} onChange={e => updateActiveBlock({ autoScroll: e.target.checked })} /> Enable Auto-Scrolling Infinite Loop</label> )}
                        <div className="border-t pt-3"><label className="block text-xs font-bold text-gray-700 mb-2">Image Cards</label>
                            {galleryItems.map((item:any, i:number) => (
                                <div key={i} className="mb-3 bg-gray-50 p-2 rounded border relative space-y-1"><button onClick={() => removeArrayItem('items', i)} className="absolute top-1 right-2 text-red-500 font-bold">×</button>
                                    <div className="flex gap-2 pr-6">
                                        <input type="text" placeholder="Image URL" className="flex-1 border p-1 rounded text-xs" value={item.url} onChange={e => updateArrayItem('items', i, 'url', e.target.value)} />
                                        <label className="bg-white border px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100">📤<input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateArrayItem('items', i, 'url', url))} /></label>
                                    </div>
                                    <input type="text" placeholder="Caption (e.g. Employee of the Month)" className="w-full border p-1 rounded text-xs font-bold" value={item.caption || ''} onChange={e => updateArrayItem('items', i, 'caption', e.target.value)} />
                                </div>
                            ))}
                            <button onClick={() => addArrayItem('items', {url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', caption: 'New Team Member'})} className="w-full bg-gray-100 text-xs font-bold py-2 rounded text-gray-600 hover:bg-gray-200">+ Add Card</button>
                        </div>
                    </div> )}

                    {/* ▶️ VIDEO WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'video' && ( <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><label className="block text-xs font-bold text-gray-700">Heading</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.heading} onChange={e => updateActiveBlock({ heading: e.target.value })} /><label className="block text-xs font-bold text-gray-700 pt-2 border-t">Video URL</label>
                        <div className="flex gap-2">
                            <input type="text" placeholder="https://.../video.mp4" className="flex-1 border p-2 rounded text-sm" value={activeBlock.data.url} onChange={e => updateActiveBlock({ url: e.target.value })} />
                            <label className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs font-bold cursor-pointer hover:bg-indigo-100 flex items-center justify-center">📤 <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ url: url }))} /></label>
                        </div>
                    </div> )}

                    {/* 🖼️ HERO WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'hero' && ( <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><label className="block text-xs font-bold text-gray-700">Headline</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.headline} onChange={e => updateActiveBlock({ headline: e.target.value })} />
                        <label className="block text-xs font-bold text-gray-700 pt-2 border-t">Background Image URL</label>
                        <div className="flex gap-2"><input type="text" className="flex-1 border p-2 rounded text-sm" value={activeBlock.data.bgImage} onChange={e => updateActiveBlock({ bgImage: e.target.value })} /><label className="bg-gray-100 border px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-gray-200">📤<input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ bgImage: url }))} /></label></div>
                        <label className="block text-xs font-bold text-indigo-600 pt-2 border-t">▶️ Background Video (MP4)</label>
                        <div className="flex gap-2"><input type="text" placeholder="https://.../video.mp4" className="flex-1 border border-indigo-200 bg-indigo-50 p-2 rounded text-sm" value={activeBlock.data.bgVideo || ''} onChange={e => updateActiveBlock({ bgVideo: e.target.value })} /><label className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-indigo-100">📤<input type="file" className="hidden" accept="video/mp4" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ bgVideo: url }))} /></label></div>
                    </div> )}

                    {/* 🎯 FEATURES WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'features' && ( <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><div><label className="block text-xs font-bold text-gray-700">Section Heading</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.heading} onChange={e => updateActiveBlock({ heading: e.target.value })} /></div><div className="border-t pt-3"><label className="block text-xs font-bold text-gray-700 mb-2">Feature Cards</label>{activeBlock.data.items?.map((item:any, i:number) => (<div key={i} className="mb-3 bg-gray-50 p-2 rounded border relative space-y-1"><button onClick={() => removeArrayItem('items', i)} className="absolute top-1 right-2 text-red-500 font-bold">×</button><input type="text" placeholder="Title" className="w-full border p-1 rounded text-xs font-bold pr-6" value={item.title} onChange={e => updateArrayItem('items', i, 'title', e.target.value)} /><textarea placeholder="Description" rows={2} className="w-full border p-1 rounded text-xs" value={item.desc} onChange={e => updateArrayItem('items', i, 'desc', e.target.value)} />
                        <div className="flex gap-2"><input type="text" placeholder="Image URL (Optional)" className="flex-1 border p-1 rounded text-xs" value={item.image || ''} onChange={e => updateArrayItem('items', i, 'image', e.target.value)} /><label className="bg-white border px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100">📤<input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateArrayItem('items', i, 'image', url))} /></label></div>
                    </div>))}<button onClick={() => addArrayItem('items', {title: 'New Feature', desc: 'Description here', image: ''})} className="w-full bg-gray-100 text-xs font-bold py-2 rounded text-gray-600 hover:bg-gray-200">+ Add Feature</button></div></div> )}
                    
                    {/* 🌗 SPLIT WITH UPLOAD 📤 */}
                    {activeBlock?.type === 'split' && ( <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><label className="block text-xs font-bold text-gray-700">Heading</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.heading} onChange={e => updateActiveBlock({ heading: e.target.value })} /><label className="block text-xs font-bold text-gray-700">Story Text</label><textarea rows={4} className="w-full border p-2 rounded text-sm" value={activeBlock.data.content} onChange={e => updateActiveBlock({ content: e.target.value })} /><label className="block text-xs font-bold text-gray-700">Image URL</label>
                        <div className="flex gap-2"><input type="text" className="flex-1 border p-2 rounded text-sm" value={activeBlock.data.image} onChange={e => updateActiveBlock({ image: e.target.value })} /><label className="bg-gray-100 border px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-gray-200 flex items-center">📤<input type="file" className="hidden" accept="image/*" onChange={(e) => uploadMedia(e, (url) => updateActiveBlock({ image: url }))} /></label></div>
                        <div className="pt-2 border-t"><label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={activeBlock.data.imageLeft} onChange={e => updateActiveBlock({ imageLeft: e.target.checked })} /> Align Image to Left Side</label></div></div> )}
                    
                    {activeBlock?.type === 'menu' && ( <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><div><label className="block text-xs font-bold text-gray-700">Category Name</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.category} onChange={e => updateActiveBlock({ category: e.target.value })} /></div><div className="border-t pt-3"><label className="block text-xs font-bold text-gray-700 mb-2">Menu Items</label>{activeBlock.data.items?.map((item:any, i:number) => (<div key={i} className="mb-3 bg-gray-50 p-2 rounded border relative"><button onClick={() => removeArrayItem('items', i)} className="absolute top-1 right-2 text-red-500 font-bold">×</button><div className="flex gap-2 mb-1 pr-6"><input type="text" placeholder="Dish Name" className="flex-1 border p-1 rounded text-xs font-bold" value={item.name} onChange={e => updateArrayItem('items', i, 'name', e.target.value)} /><input type="text" placeholder="Price" className="w-20 border p-1 rounded text-xs font-bold text-green-700" value={item.price} onChange={e => updateArrayItem('items', i, 'price', e.target.value)} /></div><textarea placeholder="Description" rows={2} className="w-full border p-1 rounded text-xs" value={item.desc} onChange={e => updateArrayItem('items', i, 'desc', e.target.value)} /></div>))}<button onClick={() => addArrayItem('items', {name: 'New Item', price: '$0', desc: 'Description'})} className="w-full bg-gray-100 text-xs font-bold py-2 rounded text-gray-600 hover:bg-gray-200">+ Add Menu Item</button></div></div> )}
                    {activeBlock?.type === 'testimonials' && ( <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><div><label className="block text-xs font-bold text-gray-700">Section Heading</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.heading} onChange={e => updateActiveBlock({ heading: e.target.value })} /></div><div className="border-t pt-3"><label className="block text-xs font-bold text-gray-700 mb-2">Reviews</label>{activeBlock.data.reviews?.map((rev:any, i:number) => (<div key={i} className="mb-3 bg-gray-50 p-2 rounded border relative"><button onClick={() => removeArrayItem('reviews', i)} className="absolute top-1 right-2 text-red-500 font-bold">×</button><input type="text" placeholder="Reviewer Name" className="w-full border p-1 rounded text-xs mb-1 font-bold pr-6" value={rev.name} onChange={e => updateArrayItem('reviews', i, 'name', e.target.value)} /><textarea placeholder="Review text..." rows={2} className="w-full border p-1 rounded text-xs" value={rev.text} onChange={e => updateArrayItem('reviews', i, 'text', e.target.value)} /></div>))}<button onClick={() => addArrayItem('reviews', {name: 'John D.', text: 'Great experience!'})} className="w-full bg-gray-100 text-xs font-bold py-2 rounded text-gray-600 hover:bg-gray-200">+ Add Review</button></div></div> )}
                    {activeBlock?.type === 'text' && ( <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><label className="block text-xs font-bold text-gray-700">Text Content</label><textarea rows={6} className="w-full border p-2 rounded text-sm" value={activeBlock.data.content} onChange={e => updateActiveBlock({ content: e.target.value })} /></div> )}
                    {activeBlock?.type === 'footer' && ( <div className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm relative"><div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">UNIVERSAL BLOCK</div><label className="block text-xs font-bold text-gray-700 pt-4">Physical Address</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.address} onChange={e => updateActiveBlock({ address: e.target.value })} /><label className="block text-xs font-bold text-gray-700">Phone Number</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.phone} onChange={e => updateActiveBlock({ phone: e.target.value })} /><label className="block text-xs font-bold text-gray-700">Working Hours</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.hours} onChange={e => updateActiveBlock({ hours: e.target.value })} /><label className="block text-xs font-bold text-gray-700">Copyright Text</label><input type="text" className="w-full border p-2 rounded text-sm" value={activeBlock.data.copyright} onChange={e => updateActiveBlock({ copyright: e.target.value })} /><div className="flex gap-3 pt-2 border-t border-indigo-200"><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Background</label><input type="color" value={activeBlock.data.bgColor || '#030712'} onChange={e => updateActiveBlock({ bgColor: e.target.value })} className="w-full h-8 cursor-pointer rounded" /></div><div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Text Color</label><input type="color" value={activeBlock.data.textColor || '#9ca3af'} onChange={e => updateActiveBlock({ textColor: e.target.value })} className="w-full h-8 cursor-pointer rounded" /></div></div></div> )}
                </div>
            )}
            {activeTab === 'publish' && (
                <div className="space-y-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Launch Settings</p>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Standard URL Slug</label><div className="flex items-center shadow-sm"><span className="text-xs text-gray-500 bg-gray-50 border border-gray-300 border-r-0 px-2 py-2 rounded-l-md font-mono">/site/</span><input type="text" placeholder="luigis" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="w-full border border-gray-300 p-2 rounded-r-md text-sm font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div></div><div className="border-t pt-4"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Custom Domain <span className="text-amber-500">★ Premium</span></label><input type="text" placeholder="e.g. luigispizza.com" value={customDomain} onChange={e => setCustomDomain(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md text-sm font-bold text-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono" /></div></div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Billing & Account Status</label><div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"><span className="text-xs font-bold text-gray-700">Site Status</span><button onClick={() => setIsActive(!isActive)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${isActive ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>{isActive ? '🟢 ONLINE & ACTIVE' : '🔴 SUSPENDED'}</button></div></div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col relative overflow-hidden border-l border-gray-200">
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
              <span className="text-sm font-medium"><span className="text-gray-400">Previewing:</span> <span className="font-bold text-indigo-600">{pagesData[activePagePath]?.name} ({activePagePath})</span></span>
              <button onClick={saveSite} disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition shadow-sm">{isSaving ? 'Saving...' : '💾 Save Entire Site'}</button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col scroll-smooth p-4 bg-gray-100">
              {blocks.length === 0 && <div className="flex items-center justify-center h-full text-gray-400">This page is empty. Click "+ Add" to begin building.</div>}
              <div className="max-w-7xl mx-auto w-full bg-white shadow-2xl rounded-lg border border-gray-200 min-h-screen flex flex-col">
                {blocks.map(block => {
                    const bgStyles: any = { backgroundColor: block.data.bgColor, color: block.data.textColor }
                    if (block.data.bgImage) { bgStyles.backgroundImage = `url(${block.data.bgImage})`; bgStyles.backgroundSize = 'cover'; bgStyles.backgroundPosition = 'center'; }
                    let borderClass = "";
                    if (block.data.borderStyle === 'minimal') borderClass = "m-6 rounded-3xl border border-gray-200 shadow-sm overflow-hidden";
                    if (block.data.borderStyle === 'shadow') borderClass = "m-6 rounded-2xl shadow-xl overflow-hidden";
                    if (block.data.borderStyle === 'tv') borderClass = "m-8 border-[16px] border-gray-900 rounded-[2rem] shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative";

                    const clickToEditProps = { key: block.id, onClick: () => { setActiveBlockId(block.id); setActiveTab('edit'); }, className: `group relative cursor-pointer ring-2 ring-transparent hover:ring-indigo-500 transition-all ${activeBlockId === block.id ? 'ring-indigo-500' : ''} ${borderClass}` }

                    if (block.type === 'nav') return (
                        <nav {...clickToEditProps} style={bgStyles} className={`px-6 md:px-12 py-5 flex justify-between items-center border-b border-opacity-20 z-50 shadow-sm shrink-0 ${clickToEditProps.className}`}>
                            <div className="flex items-center gap-3">
                                {block.data.logoImage && <img src={block.data.logoImage} alt="Logo" className="h-10 object-contain" />}
                                {!block.data.logoImage && <div className="text-2xl font-black tracking-tighter uppercase">{block.data.logoText}</div>}
                            </div>
                            <div className="hidden md:flex gap-8 text-sm font-bold opacity-80">
                                {block.data.links?.map((link:any, i:number) => <span key={i} className="hover:opacity-100 transition cursor-pointer">{link.name}</span>)}
                            </div>
                            <span style={{ backgroundColor: block.data.textColor, color: block.data.bgColor }} className="px-6 py-2.5 rounded-full text-sm font-bold shadow-md cursor-pointer">{block.data.ctaText}</span>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition">EDIT NAV (UNIVERSAL)</div>
                        </nav>
                    )
                    
                    if (block.type === 'hero') return (
                        <div {...clickToEditProps} className={`relative min-h-[70vh] flex items-center justify-center text-center px-6 shrink-0 overflow-hidden ${clickToEditProps.className}`} style={{ color: block.data.textColor || '#ffffff' }}>
                            {block.data.bgVideo ? ( <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0"><source src={block.data.bgVideo} type="video/mp4" /></video> ) : ( <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${block.data.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div> )}
                            <div className="absolute inset-0 bg-black/50 z-10"></div>
                            <h1 className="relative z-20 text-5xl md:text-7xl lg:text-8xl font-black drop-shadow-2xl tracking-tight max-w-5xl leading-tight">{block.data.headline}</h1>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-30">EDIT HERO</div>
                        </div>
                    )

                    if (block.type === 'video') return (
                        <div {...clickToEditProps} style={bgStyles} className={`py-12 px-6 w-full shrink-0 ${clickToEditProps.className}`}>
                            <div className="max-w-5xl mx-auto text-center">
                                {block.data.heading && <h2 className="text-3xl md:text-4xl font-bold mb-10 tracking-tight">{block.data.heading}</h2>}
                                <div className="aspect-video bg-black overflow-hidden shadow-xl">
                                    <video controls src={block.data.url} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT VIDEO</div>
                        </div>
                    )
                    
                    if (block.type === 'features') return (
                        <div {...clickToEditProps} style={bgStyles} className={`py-24 px-6 w-full shrink-0 ${clickToEditProps.className}`}>
                            <div className="max-w-7xl mx-auto">
                                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">{block.data.heading}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                                    {block.data.items?.map((item:any, i:number) => (
                                        <div key={i} className="space-y-4 p-8 rounded-2xl border border-black/10 transition bg-black/5 overflow-hidden">
                                            {item.image ? ( <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-xl shadow-md mb-6" /> ) : ( <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto text-2xl font-black shadow-md" style={{ backgroundColor: block.data.textColor, color: block.data.bgColor }}>{i+1}</div> )}
                                            <h3 className="text-xl font-bold">{item.title}</h3>
                                            <p className="opacity-80 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT FEATURES</div>
                        </div>
                    )
                    
                    if (block.type === 'split') return (
                        <div {...clickToEditProps} style={bgStyles} className={`flex flex-col ${block.data.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} w-full shrink-0 ${clickToEditProps.className}`}>
                            <div className="md:w-1/2 min-h-[400px] md:min-h-[600px]" style={{ backgroundImage: `url(${block.data.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <div className="md:w-1/2 p-12 lg:p-24 flex flex-col justify-center">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{block.data.heading}</h2>
                                <p className="text-lg opacity-80 leading-relaxed whitespace-pre-line">{block.data.content}</p>
                            </div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT SPLIT</div>
                        </div>
                    )
                    
                    if (block.type === 'menu') return (
                        <div {...clickToEditProps} style={bgStyles} className={`py-24 px-6 w-full shrink-0 ${clickToEditProps.className}`}>
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
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT MENU</div>
                        </div>
                    )
                    
                    if (block.type === 'gallery') {
                        const items = block.data.items || block.data.images?.map((url:string)=>({url, caption:''})) || []
                        const renderItems = block.data.autoScroll ? [...items, ...items, ...items] : items; 
                        
                        return (
                        <div {...clickToEditProps} style={bgStyles} className={`w-full py-16 shrink-0 relative overflow-hidden ${clickToEditProps.className}`}>
                            {block.data.layout === 'carousel' ? (
                                <div className={`flex gap-6 px-6 ${block.data.autoScroll ? 'animate-marquee hover:[animation-play-state:paused]' : 'overflow-x-auto snap-x snap-mandatory hide-scrollbar'}`}>
                                    {renderItems.map((item:any, i:number) => (
                                        <div key={i} className="resize-handle shrink-0 snap-center rounded-xl overflow-hidden shadow-md bg-black/5 border border-black/10 flex flex-col relative" style={{ height: '400px' }}>
                                            <img src={item.url} className="w-full h-full object-cover flex-1" alt="Gallery item" />
                                            {item.caption && <div className="absolute bottom-0 w-full bg-black/70 backdrop-blur-sm text-white p-4 font-bold text-center tracking-wide">{item.caption}</div>}
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
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT GALLERY</div>
                        </div>
                    )}
                    
                    if (block.type === 'testimonials') return (
                        <div {...clickToEditProps} style={bgStyles} className={`py-24 px-6 w-full border-y border-black/5 shrink-0 ${clickToEditProps.className}`}>
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">{block.data.heading}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {block.data.reviews?.map((rev:any, i:number) => (
                                        <div key={i} className="p-10 rounded-3xl shadow-sm border border-black/10 relative bg-white/5">
                                            <div className="text-yellow-500 text-2xl mb-4 tracking-widest drop-shadow-sm">★★★★★</div>
                                            <p className="text-xl font-medium leading-relaxed mb-6 opacity-90">"{rev.text}"</p>
                                            <p className="font-bold uppercase tracking-wide text-sm">- {rev.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT REVIEWS</div>
                        </div>
                    )
                    
                    if (block.type === 'text') return (
                        <div {...clickToEditProps} style={bgStyles} className={`py-24 px-6 text-center w-full shrink-0 ${clickToEditProps.className}`}>
                            <div className="max-w-4xl mx-auto"><p className="text-2xl whitespace-pre-line leading-relaxed font-light opacity-90">{block.data.content}</p></div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT TEXT</div>
                        </div>
                    )
                    
                    if (block.type === 'footer') return (
                        <footer {...clickToEditProps} style={bgStyles} className={`py-20 text-center px-6 mt-auto w-full shrink-0 ${clickToEditProps.className}`}>
                            <div className="max-w-4xl mx-auto space-y-4">
                                <h3 className="text-2xl font-black mb-6 tracking-tight">VISIT US</h3>
                                <p className="text-lg opacity-80">{block.data.address}</p>
                                <p className="text-lg font-medium opacity-90">{block.data.phone}</p>
                                <p className="opacity-80">{block.data.hours}</p>
                                <div className="w-24 h-px bg-current opacity-20 mx-auto my-10"></div>
                                <p className="text-sm font-medium tracking-wide uppercase opacity-60">{block.data.copyright}</p>
                            </div>
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold opacity-0 group-hover:opacity-100 transition z-10">EDIT FOOTER (UNIVERSAL)</div>
                        </footer>
                    )
                    return null;
                })}
              </div>
          </div>
      </div>
    </div>
  )
}