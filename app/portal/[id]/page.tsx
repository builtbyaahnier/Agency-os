'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// 📊 MOCK ANALYTICS DATA 
const mockAnalytics = [
  { name: '1st', visitors: 120 }, { name: '5th', visitors: 300 },
  { name: '10th', visitors: 250 }, { name: '15th', visitors: 450 },
  { name: '20th', visitors: 380 }, { name: '25th', visitors: 600 },
  { name: '30th', visitors: 850 }
]

export default function ClientPortal() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [site, setSite] = useState<any>(null)
  
  const [loading, setLoading] = useState(true) 
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false)

  // 🧭 NEW: Tab State for the Navbar!
  const [activeTab, setActiveTab] = useState<'dashboard' | 'media'>('dashboard')

  const [authUser, setAuthUser] = useState<any>(null)
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const fetchAuthAndSite = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
          router.replace(`/login?next=/portal/${clientId}`)
          return; 
      }
      
      setAuthUser(session.user)

      const { data } = await supabase
        .from('websites')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (data) {
          setSite(data)
          if (!data.user_id && session.user.email !== 'builtbyaahnier@gmail.com') {
              await supabase.from('websites').update({ user_id: session.user.id }).eq('client_id', clientId)
          }
      }
      
      setLoading(false) 
    }
    
    fetchAuthAndSite()
  }, [clientId, router]) 

  useEffect(() => {
    if (loading) return; 

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40; 
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      setMousePos({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [loading]); 

  const handleCheckout = async () => {
    setIsCheckoutLoading(true)
    try {
      const response = await fetch('/api/subscribe', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId, priceId: 'price_1T7N0UFWlyRMbb63X1oLzDeM' }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url 
      else { alert("Checkout Error: " + data.error); setIsCheckoutLoading(false) }
    } catch (error) {
      alert("Something went wrong connecting to Stripe."); setIsCheckoutLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url 
      else alert("Portal Error: " + data.error)
    } catch (error) {
      alert("Something went wrong connecting to Stripe.")
    }
  }

  const submitTicket = async () => {
    if (!ticketTitle || !ticketDescription) return alert("Please fill out both the subject and the details.")
    if (!authUser) return alert("You must be logged in to submit a ticket.");
    
    setIsSubmittingTicket(true)

    const { error } = await supabase.from('tickets').insert([{
        user_id: authUser.id,   
        client_id: clientId,    
        title: ticketTitle,
        description: ticketDescription,
        status: 'open'
    }])

    if (error) {
        alert("Error sending request: " + error.message)
    } else {
        setShowTicketModal(false)
        setTicketTitle('')
        setTicketDescription('')
        alert("✅ Request submitted! Our team has been notified and will get to work.")
    }
    
    setIsSubmittingTicket(false)
  }

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.replace('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-indigo-400 font-bold animate-pulse tracking-widest uppercase">Securing Connection...</div>
  if (!site) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white"><h1 className="text-2xl font-black mb-2">Portal Unavailable</h1><p className="text-gray-400">This link is invalid or the account has been removed.</p></div>

  const liveUrl = site.custom_domain ? `http://${site.custom_domain}` : `${window.location.origin}/site/${site.slug}`

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 selection:bg-indigo-100 relative overflow-hidden">
      
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M59 0h1v60h-1zM0 59h60v1H0z' fill='rgba(255,255,255,0.08)' fill-rule='evenodd'/%3E%3C/svg%3E")`, transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)`, transition: 'transform 0.1s ease-out' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1000px', height: '1000px', marginTop: '-500px', marginLeft: '-500px', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(0,0,0,0) 60%)', transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`, transition: 'transform 0.1s ease-out' }} />
      </div>

      {/* 🧭 UPGRADED HEADER WITH NAVBAR */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 md:px-12 py-5 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-12">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/40">C</span>
                Client Portal
            </h1>
            
            {/* 🔗 THE NAVIGATION LINKS */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
                <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`transition-colors ${activeTab === 'dashboard' ? 'text-white' : 'hover:text-white'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('media')} 
                    className={`transition-colors ${activeTab === 'media' ? 'text-white' : 'hover:text-white'}`}
                >
                    Media Drive
                </button>
            </nav>
        </div>

        <div className="flex items-center gap-4">
           <span className="text-xs font-bold text-gray-400 hidden md:block">{authUser?.email}</span>
           <button onClick={handleLogout} className="bg-white/5 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition shadow-sm border border-white/10">Log Out</button>
        </div>
      </header>

      {/* ☀️ MAIN CANVAS */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-8 z-20">
        
        {/* =========================================
            TAB 1: DASHBOARD OVERVIEW
        ========================================= */}
        {activeTab === 'dashboard' && (
            <>
                <div className="mb-4 relative z-30">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">Welcome to your dashboard.</h2>
                  <p className="text-white text-lg md:text-xl max-w-2xl font-semibold leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Manage your online presence, view your traffic, and securely handle your billing all in one place.</p>
                </div>

                {/* 📈 CLIENT-FACING TRAFFIC GRAPH */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative z-30 mb-8">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Website Traffic</h2>
                            <p className="text-sm text-gray-400">Unique visitors over the last 30 days.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-indigo-400">3,300</p>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">+12% this month</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockAnalytics}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                                    itemStyle={{ color: '#818CF8' }}
                                />
                                <Line type="monotone" dataKey="visitors" stroke="#818CF8" strokeWidth={4} dot={{ r: 4, fill: '#818CF8', strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-30">
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-2xl hover:shadow-indigo-500/20 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">🌍</div>
                      <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${site.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {site.is_active ? '🟢 Website Online' : '🔴 Suspended'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Your Live Website</h3>
                    <p className="text-gray-500 text-sm mb-8 flex-1 leading-relaxed">Your custom website is currently deployed on our high-speed edge network. Click below to view the live public version.</p>
                    <a href={liveUrl} target="_blank" className="w-full text-center bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Launch Live Site ↗</a>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-2xl hover:shadow-orange-500/20 transition-all flex flex-col group">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform shadow-sm">✨</div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Request Updates</h3>
                    <p className="text-gray-500 text-sm mb-8 flex-1 leading-relaxed">Need to change a menu item, swap out a team photo, or add a new holiday promotion? Send us the details and our team will handle it.</p>
                    <button onClick={() => setShowTicketModal(true)} className="w-full bg-white border-2 border-gray-200 text-gray-900 py-3.5 rounded-xl font-bold hover:border-gray-900 hover:bg-gray-50 transition-colors">Submit Edit Request</button>
                  </div>

                  <div className={`md:col-span-2 bg-white p-8 md:p-10 rounded-[2rem] border shadow-2xl transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mt-2 group overflow-hidden relative ${site.is_subscribed ? 'border-emerald-200 hover:shadow-emerald-500/20' : 'border-indigo-200 hover:shadow-indigo-500/30'}`}>
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 pointer-events-none ${site.is_subscribed ? 'bg-emerald-50' : 'bg-indigo-50'}`}></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 flex-1 w-full z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-sm border ${site.is_subscribed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>💳</div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">Manage your payment methods, view past invoices, and securely update your software subscription via our secure Stripe integration.</p>
                      </div>
                    </div>
                    
                    {site.is_subscribed ? (
                      <div className="flex flex-col items-end gap-2 z-10 w-full lg:w-auto">
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start lg:self-end mb-1 shadow-sm">✅ Active Plan</span>
                        <button onClick={handleManageBilling} className="w-full lg:w-auto bg-gray-900 text-white border border-gray-800 px-8 py-4 rounded-xl font-bold hover:bg-black hover:shadow-xl transition-all shrink-0 flex items-center justify-center gap-2">⚙️ Manage Billing</button>
                      </div>
                    ) : (
                      <button onClick={handleCheckout} disabled={isCheckoutLoading} className="w-full lg:w-auto bg-indigo-600 text-white border border-indigo-500 px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 transition-all shrink-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait z-10">
                        {isCheckoutLoading ? 'Connecting to Stripe...' : 'Setup Subscription ↗'}
                      </button>
                    )}
                  </div>
                </div>
            </>
        )}

        {/* =========================================
            TAB 2: MEDIA ASSET DRIVE
        ========================================= */}
        {activeTab === 'media' && (
            <div className="bg-white/5 backdrop-blur-md p-12 md:p-24 rounded-[2rem] border border-white/10 shadow-2xl relative z-30 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg shadow-indigo-500/20">📸</div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Media Drive Coming Soon</h2>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                    We are currently building a secure cloud drive where you can view, download, and manage all the high-resolution photos and assets from your agency shoots. 
                </p>
                <div className="mt-8 px-6 py-2 bg-white/10 rounded-full border border-white/10 text-white text-sm font-bold tracking-widest uppercase">
                    In Development
                </div>
            </div>
        )}

      </main>

      {/* 🎫 NEW TICKET MODAL */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Request an Update</h2>
                        <p className="text-sm text-gray-500 mt-1">What would you like us to change on your website?</p>
                    </div>
                    <button onClick={() => setShowTicketModal(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition-colors font-bold">×</button>
                </div>
                <div className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Subject</label>
                        <input type="text" autoFocus placeholder="e.g., Please update the holiday hours" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">The Details</label>
                        <textarea rows={5} placeholder="Describe exactly what needs to be changed..." value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm bg-gray-50 resize-none leading-relaxed" />
                    </div>
                </div>
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setShowTicketModal(false)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-black transition">Cancel</button>
                    <button onClick={submitTicket} disabled={isSubmittingTicket} className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                        {isSubmittingTicket ? 'Sending...' : 'Send Request ↗'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}