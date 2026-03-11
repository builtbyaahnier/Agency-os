'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Block = {
  id: string;
  type: 'hero' | 'text' | 'menu' | 'split';
  data: any;
}

export default function ClientBuilder() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSite = async () => {
      // 1. Get logged-in client
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // 2. Fetch their specific website blocks
      const { data } = await supabase.from('websites').select('page_blocks').eq('client_id', user.id).single()
      
      if (data && data.page_blocks) {
        setBlocks(typeof data.page_blocks === 'string' ? JSON.parse(data.page_blocks) : data.page_blocks)
      }
      setLoading(false)
    }
    loadSite()
  }, [router])

  // --- CLIENT SAFE UPDATES (No adding/deleting allowed) ---
  const updateActiveBlock = (newData: any) => {
    setBlocks(blocks.map(b => b.id === activeBlockId ? { ...b, data: { ...b.data, ...newData } } : b))
  }

  // Special function to handle menu items without the ugly JSON box!
  const updateMenuItem = (index: number, field: string, value: string) => {
      const block = blocks.find(b => b.id === activeBlockId);
      if (!block) return;
      
      const newItems = [...block.data.items];
      newItems[index] = { ...newItems[index], [field]: value };
      updateActiveBlock({ items: newItems });
  }

  const saveSite = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('websites').update({ page_blocks: blocks }).eq('client_id', user.id)
    if (error) alert("Error: " + error.message)
    else alert("Website Updated Successfully! 🚀")
    setIsSaving(false)
  }

  const activeBlock = blocks.find(b => b.id === activeBlockId)

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading your website editor...</div>

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* LEFT PANEL: Restricted Client Editor */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10 h-full">
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
            <h1 className="font-bold text-sm tracking-wide uppercase">Website Editor</h1>
            <button onClick={() => router.push('/dashboard')} className="text-xs text-indigo-200 hover:text-white">Dashboard</button>
        </div>

        {/* 1. Layers (Notice there are no Add/Delete/Move buttons) */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
             <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Website Sections</p>
             {blocks.length === 0 && <p className="text-sm text-gray-400 italic">No sections found. Contact support.</p>}
             
             <div className="space-y-2">
                 {blocks.map((block) => (
                     <div key={block.id} onClick={() => setActiveBlockId(block.id)}
                        className={`p-3 rounded-md border cursor-pointer flex justify-between items-center transition ${activeBlockId === block.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'}`}>
                         <span className="text-sm capitalize">{block.type} Section</span>
                         <span className="text-xs text-gray-400">Edit ➔</span>
                     </div>
                 ))}
             </div>
        </div>

        {/* 2. Settings Form (Client Safe) */}
        <div className="flex-1 bg-white p-4 overflow-y-auto">
             <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Edit Content</p>

             {!activeBlock && <p className="text-sm text-gray-400">Select a section above to edit its text and images.</p>}

             {activeBlock?.type === 'hero' && (
                 <div className="space-y-4">
                     <label className="block text-xs font-medium text-gray-700">Headline</label>
                     <input type="text" className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.headline} onChange={e => updateActiveBlock({ headline: e.target.value })} />
                     <label className="block text-xs font-medium text-gray-700">Background Image URL</label>
                     <input type="text" className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.bgImage} onChange={e => updateActiveBlock({ bgImage: e.target.value })} />
                 </div>
             )}

             {activeBlock?.type === 'text' && (
                 <div className="space-y-4">
                     <label className="block text-xs font-medium text-gray-700">Text Content</label>
                     <textarea rows={6} className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.content} onChange={e => updateActiveBlock({ content: e.target.value })} />
                 </div>
             )}

             {activeBlock?.type === 'split' && (
                 <div className="space-y-4">
                     <label className="block text-xs font-medium text-gray-700">Heading</label>
                     <input type="text" className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.heading} onChange={e => updateActiveBlock({ heading: e.target.value })} />
                     <label className="block text-xs font-medium text-gray-700">Story Text</label>
                     <textarea rows={4} className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.content} onChange={e => updateActiveBlock({ content: e.target.value })} />
                     <label className="block text-xs font-medium text-gray-700">Image URL</label>
                     <input type="text" className="w-full border p-2 rounded text-sm focus:ring-indigo-500" value={activeBlock.data.image} onChange={e => updateActiveBlock({ image: e.target.value })} />
                 </div>
             )}

             {/* CLIENT-SAFE MENU EDITOR (NO JSON!) */}
             {activeBlock?.type === 'menu' && (
                 <div className="space-y-6">
                     <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">Menu Category</label>
                         <input type="text" className="w-full border p-2 rounded text-sm font-bold focus:ring-indigo-500" value={activeBlock.data.category} onChange={e => updateActiveBlock({ category: e.target.value })} />
                     </div>
                     
                     <div className="space-y-4">
                         <label className="block text-xs font-medium text-gray-700 border-b pb-2">Menu Items</label>
                         {activeBlock.data.items?.map((item: any, idx: number) => (
                             <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                                 <div className="flex gap-2">
                                     <div className="flex-1">
                                         <span className="text-[10px] text-gray-500 uppercase">Name</span>
                                         <input type="text" className="w-full border p-1 rounded text-sm" value={item.name} onChange={e => updateMenuItem(idx, 'name', e.target.value)} />
                                     </div>
                                     <div className="w-20">
                                         <span className="text-[10px] text-gray-500 uppercase">Price</span>
                                         <input type="text" className="w-full border p-1 rounded text-sm" value={item.price} onChange={e => updateMenuItem(idx, 'price', e.target.value)} />
                                     </div>
                                 </div>
                                 <div>
                                     <span className="text-[10px] text-gray-500 uppercase">Description</span>
                                     <input type="text" className="w-full border p-1 rounded text-sm text-gray-600" value={item.desc} onChange={e => updateMenuItem(idx, 'desc', e.target.value)} />
                                 </div>
                             </div>
                         ))}
                         <p className="text-xs text-gray-400 italic mt-2">To add or remove menu items, please submit a support ticket from your dashboard.</p>
                     </div>
                 </div>
             )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Canvas */}
      <div className="flex-1 bg-gray-200 flex flex-col relative">
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
              <span className="text-sm text-gray-500 font-medium">Live Preview</span>
              <button onClick={saveSite} disabled={isSaving} className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition shadow-sm">
                  {isSaving ? 'Saving...' : '💾 Publish Changes'}
              </button>
          </div>

          <div className="flex-1 overflow-y-auto flex justify-center pb-20">
              <div className="w-full max-w-5xl bg-white shadow-2xl min-h-screen">
                  {blocks.length === 0 && <div className="flex items-center justify-center h-full text-gray-400">Your site is being built. Check back soon!</div>}

                  {/* IDENTICAL RENDER LOGIC TO PUBLIC SITE */}
                  {blocks.map(block => {
                      if (block.type === 'hero') return (
                          <div key={block.id} className="relative h-[60vh] flex items-center justify-center text-center px-4" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${block.data.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                              <h1 className="text-5xl md:text-7xl font-extrabold text-white">{block.data.headline}</h1>
                          </div>
                      )
                      if (block.type === 'text') return (
                          <div key={block.id} className="max-w-4xl mx-auto py-16 px-6 text-center">
                              <p className="text-xl text-gray-600 whitespace-pre-line">{block.data.content}</p>
                          </div>
                      )
                      if (block.type === 'split') return (
                          <div key={block.id} className={`flex flex-col ${block.data.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} bg-white`}>
                              <div className="md:w-1/2 min-h-[400px]" style={{ backgroundImage: `url(${block.data.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                              <div className="md:w-1/2 p-12 lg:p-24 flex flex-col justify-center">
                                  <h2 className="text-4xl font-bold mb-6 text-gray-900">{block.data.heading}</h2>
                                  <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">{block.data.content}</p>
                              </div>
                          </div>
                      )
                      if (block.type === 'menu') return (
                          <div key={block.id} className="max-w-4xl mx-auto py-20 px-6">
                              <h2 className="text-3xl font-bold mb-10 text-center text-gray-900 uppercase tracking-widest">{block.data.category}</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                  {block.data.items?.map((item: any, idx: number) => (
                                      <div key={idx} className="border-b border-gray-200 pb-4">
                                          <div className="flex justify-between items-baseline mb-2">
                                              <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                                              <span className="text-lg font-semibold text-indigo-600">{item.price}</span>
                                          </div>
                                          <p className="text-gray-500 italic">{item.desc}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )
                      return null;
                  })}
              </div>
          </div>
      </div>
    </div>
  )
}