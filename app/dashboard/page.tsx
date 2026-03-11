'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type ClientSite = {
  client_id: string;
  slug: string;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
  plan_tier?: string;
  contract_url?: string;
  package_details?: string;
}

type SupportTicket = {
  id: string;
  user_id: string;
  client_id: string; 
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter()
  
  // 🛑 THE VIP BOUNCER LIST
  const ADMIN_EMAIL = "builtbyaahnier@gmail.com" 

  const [sites, setSites] = useState<ClientSite[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([]) 
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('') // 👈 Added search state!
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'billing' | 'settings'>('dashboard')
  const [selectedTicketClient, setSelectedTicketClient] = useState<string | null>(null)

  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const bootDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || session.user.email !== ADMIN_EMAIL) {
          window.location.replace('/login')
          return;
      }

      fetchSites()
      fetchTickets() 
    }

    bootDashboard()
    // 3. Check if we were sent here from a specific client page!
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'tickets') {
          setActiveTab('tickets')
          if (params.get('client')) setSelectedTicketClient(params.get('client'))
      }
  }, [])

  const fetchSites = async () => {
    const { data, error } = await supabase
        .from('websites')
        .select('client_id, slug, custom_domain, is_active, created_at, plan_tier, contract_url, package_details')
        .order('created_at', { ascending: false })
    
    if (data) setSites(data)
    setLoading(false)
  }

  const fetchTickets = async () => {
    const { data, error } = await supabase
        .from('tickets') 
        .select('*')
        .order('created_at', { ascending: false })
    
    if (data) setTickets(data)
  }

  const resolveTicket = async (ticketId: string) => {
    const { error } = await supabase
        .from('tickets') 
        .update({ status: 'resolved' })
        .eq('id', ticketId)
    
    if (!error) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t))
    } else {
        alert("Error resolving ticket: " + error.message)
    }
  }

  const createNewClient = async () => {
    if (!newClientName) return alert("Please enter a client/business name")
    setIsCreating(true)
    
    const generatedSlug = newClientName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000)
    const generatedClientId = crypto.randomUUID() 
    const defaultPages = { '/': { name: 'Home', path: '/', blocks: [] } }

    const { data, error } = await supabase.from('websites').insert([{ 
      client_id: generatedClientId, 
      slug: generatedSlug, 
      is_active: true,
      page_blocks: [], 
      pages: defaultPages,
      plan_tier: 'Starter', // 👈 Added default tier
      created_at: new Date().toISOString()
    }]).select() 

    if (error) {
      alert("Database Error: " + error.message)
    } else {
      setShowModal(false)
      setNewClientName('')
      await fetchSites()
    }
    setIsCreating(false)
  }

  const toggleStatus = async (clientId: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus 
        ? "Suspend this site? It will immediately show a 404 error to the public." 
        : "Reactivate this site? It will go live immediately."
    
    if (!confirm(confirmMsg)) return

    const { error } = await supabase.from('websites').update({ is_active: !currentStatus }).eq('client_id', clientId)
    if (!error) fetchSites()
  }

  const copyPortalLink = (clientId: string) => {
    const portalUrl = `${window.location.origin}/portal/${clientId}`
    navigator.clipboard.writeText(portalUrl)
    alert("🔗 Client Portal Link copied to clipboard!\n\n" + portalUrl)
  }

  const handleLogout = async () => {
      await supabase.auth.signOut()
      window.location.replace('/login')
  }

  const activeCount = sites.filter(s => s.is_active).length
  const offlineCount = sites.length - activeCount
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status !== 'resolved').length

  const clientsWithTickets = sites.map(site => {
    const clientTickets = tickets.filter(t => t.client_id === site.client_id)
    const openTickets = clientTickets.filter(t => t.status === 'open' || t.status !== 'resolved').length
    return { ...site, clientTickets, openTickets }
  }).filter(site => site.clientTickets.length > 0)
    .sort((a, b) => b.openTickets - a.openTickets) 

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-bold tracking-widest uppercase animate-pulse">Securing Dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* 🌑 SLEEK SIDEBAR */}
      <div className="w-64 bg-gray-950 text-white flex flex-col shrink-0 shadow-2xl z-10">
        <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">A</span>
                Agency OS
            </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => { setActiveTab('dashboard'); setSelectedTicketClient(null); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}>📊 Dashboard</button>
            
            <button onClick={() => { setActiveTab('tickets'); setSelectedTicketClient(null); }} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl font-bold transition ${activeTab === 'tickets' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}>
                <span>🎫 Support Desk</span>
                {openTicketsCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{openTicketsCount}</span>}
            </button>
            
            <button onClick={() => { setActiveTab('billing'); setSelectedTicketClient(null); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'billing' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}>💳 Agency Billing</button>
            <button onClick={() => { setActiveTab('settings'); setSelectedTicketClient(null); }} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}>⚙️ Settings</button>
        </nav>
        <div className="p-4 border-t border-gray-800">
            <button onClick={handleLogout} className="w-full text-left text-gray-500 hover:text-red-400 px-4 py-2 font-medium transition">Log Out</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* ==============================================
            TAB 1: THE DASHBOARD (UPGRADED)
        ============================================== */}
        {activeTab === 'dashboard' && (
            <>
                <header className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-20">
                    <div>
                        <h2 className="text-2xl font-bold">Welcome back, Admin.</h2>
                        <p className="text-sm text-gray-500 mt-1">Here is the overview of your client portfolio.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-3">
                        {/* 🔍 SEARCH BAR */}
                        <div className="relative w-full md:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search clients..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0">
                            + New Client
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">👥</div>
                            <div><p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Clients</p><p className="text-3xl font-black">{sites.length}</p></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl">🟢</div>
                            <div><p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Live Sites</p><p className="text-3xl font-black">{activeCount}</p></div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl">🔴</div>
                            <div><p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Suspended</p><p className="text-3xl font-black">{offlineCount}</p></div>
                        </div>
                    </div>

                    {(() => {
                        const filteredSites = sites.filter(site => 
                            site.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (site.custom_domain && site.custom_domain.toLowerCase().includes(searchQuery.toLowerCase()))
                        );

                        if (sites.length === 0) return (
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center">
                                <div className="text-4xl mb-4">🚀</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No clients yet!</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">Click the "New Client" button above to spin up your very first website infrastructure.</p>
                                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">Create First Client</button>
                            </div>
                        )

                        if (filteredSites.length === 0) return (
                            <div className="text-center py-12 text-gray-500 font-medium">No clients match your search.</div>
                        )

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredSites.map(site => (
                                    <div key={site.client_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col group">
                                        {/* 🔗 Clickable Card Body */}
                                        <div className="p-6 flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/client/${site.client_id}`)}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="truncate pr-4">
                                                    <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition truncate" title={site.client_id}>{site.slug}</h3>
                                                    <p className="text-xs text-indigo-500 font-medium flex items-center gap-1 mt-1 truncate">
                                                        🌍 {site.custom_domain || `${site.slug}.agency`}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleStatus(site.client_id, site.is_active); }} 
                                                    className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm transition-colors border ${site.is_active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`} 
                                                    title="Click to toggle Site Status"
                                                >
                                                    {site.is_active ? '🟢 Online' : '🔴 Suspended'}
                                                </button>
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6">
                                                Created: {site.created_at ? new Date(site.created_at).toLocaleDateString() : 'Just now'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 border-t border-gray-100 flex gap-2">
                                            <a href={`/admin/builder/${site.client_id}`} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-sm text-center">⚙️ Open Builder</a>
                                            <button onClick={() => copyPortalLink(site.client_id)} className="bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 hover:text-black transition-colors" title="Copy Secret Portal Link">🔗 Portal</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </main>
            </>
        )}

        {/* ==============================================
            TAB 2: SUPPORT DESK (ORGANIZED)
        ============================================== */}
        {activeTab === 'tickets' && (
            <>
                <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            {selectedTicketClient ? (
                                <button onClick={() => setSelectedTicketClient(null)} className="text-gray-400 hover:text-gray-900 transition">
                                    ← Inbox History
                                </button>
                            ) : '🎫 Support Desk'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedTicketClient ? 'Viewing full ticket history for this client.' : 'Manage client edit requests and support tickets.'}
                        </p>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {!selectedTicketClient ? (
                        clientsWithTickets.length === 0 ? (
                             <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center max-w-2xl mx-auto mt-10">
                                <div className="text-4xl mb-4">📭</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Inbox Zero!</h3>
                                <p className="text-gray-500 max-w-md mx-auto">No edit requests from any clients. Enjoy the peace and quiet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clientsWithTickets.map(client => (
                                    <div 
                                        key={client.client_id} 
                                        onClick={() => setSelectedTicketClient(client.client_id)}
                                        className="cursor-pointer bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition truncate pr-4">{client.slug}</h3>
                                            {client.openTickets > 0 ? (
                                                <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm shrink-0">
                                                    {client.openTickets} Open
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                                                    Resolved
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium text-gray-500 relative z-10">
                                            <span>Total Requests: {client.clientTickets.length}</span>
                                            <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">View Inbox →</span>
                                        </div>
                                        
                                        {client.openTickets > 0 && (
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-100 rounded-full blur-[40px] opacity-50 z-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {(() => {
                            const client = sites.find(s => s.client_id === selectedTicketClient);
                            const clientTickets = tickets.filter(t => t.client_id === selectedTicketClient); 
                            
                            return (
                                <>
                                    <div className="mb-8 border-b pb-4">
                                        <h3 className="text-3xl font-black text-gray-900">{client?.slug}</h3>
                                        <p className="text-gray-500 font-medium">Viewing {clientTickets.length} total requests.</p>
                                    </div>
                                    
                                    {clientTickets.map(ticket => {
                                        const isOpen = ticket.status === 'open' || ticket.status !== 'resolved';

                                        return (
                                            <div key={ticket.id} className={`p-6 rounded-2xl border ${isOpen ? 'bg-white border-indigo-100 shadow-md' : 'bg-gray-100 border-gray-200 opacity-75'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                                                                {isOpen ? '🟢 Open Request' : '✅ Resolved'}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-bold">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {isOpen && (
                                                        <button onClick={() => resolveTicket(ticket.id)} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-100 hover:text-green-800 transition shadow-sm">
                                                            ✓ Mark as Resolved
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{ticket.title}</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{ticket.description}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )
                        })()}
                    </div>
                    )}
                </main>
            </>
        )}

        {/* ==============================================
            TAB 3 & 4: PLACEHOLDERS
        ============================================== */}
        {activeTab === 'billing' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-6">💳</div>
                <h2 className="text-3xl font-black mb-2">Agency Billing</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">This will securely redirect you to your Stripe Dashboard to view revenue, payouts, and active subscriptions.</p>
                <button onClick={() => alert("This will ping an API to generate a Stripe Login Link!")} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition">Open Stripe Dashboard ↗</button>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-6">⚙️</div>
                <h2 className="text-3xl font-black mb-2">Agency Settings</h2>
                <p className="text-gray-500 max-w-md mx-auto">Global configurations, API keys, and notification emails will go here.</p>
            </div>
        )}

      </div>

      {/* 🚀 1-CLICK ONBOARDING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black">Onboard New Client</h2>
                    <p className="text-xs text-gray-500 mt-1">This will generate a private database row, routing path, and fresh builder canvas.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Business Name</label>
                        <input type="text" autoFocus placeholder="e.g. Luigi's Pizza" value={newClientName} onChange={e => setNewClientName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createNewClient()} className="w-full border border-gray-300 p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm" />
                    </div>
                </div>
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-black transition">Cancel</button>
                    <button onClick={createNewClient} disabled={isCreating} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                        {isCreating ? 'Spinning up server...' : '🚀 Create Infrastructure'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}