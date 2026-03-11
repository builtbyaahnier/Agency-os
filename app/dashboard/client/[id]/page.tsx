'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// 📊 MOCK ANALYTICS DATA (To make it look like Vercel instantly)
const mockAnalytics = [
  { name: '1st', visitors: 120 }, { name: '5th', visitors: 300 },
  { name: '10th', visitors: 250 }, { name: '15th', visitors: 450 },
  { name: '20th', visitors: 380 }, { name: '25th', visitors: 600 },
  { name: '30th', visitors: 850 }
]

export default function ClientOverview() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [site, setSite] = useState<any>(null)
  const [ticketCount, setTicketCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Editable fields for the Admin
  const [planTier, setPlanTier] = useState('Starter')
  const [contractUrl, setContractUrl] = useState('')
  const [packageDetails, setPackageDetails] = useState('')

  useEffect(() => {
    const fetchClientData = async () => {
      // Fetch Website
      const { data: siteData } = await supabase
        .from('websites')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (siteData) {
          setSite(siteData)
          setPlanTier(siteData.plan_tier || 'Starter')
          setContractUrl(siteData.contract_url || '')
          setPackageDetails(siteData.package_details || '')
      }

      // Fetch Tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('client_id', clientId)
        .neq('status', 'resolved')
      
      if (tickets) setTicketCount(tickets.length)
      
      setLoading(false)
    }

    fetchClientData()
  }, [clientId])

  const saveClientDetails = async () => {
      setIsSaving(true)
      const { error } = await supabase
        .from('websites')
        .update({ 
            plan_tier: planTier, 
            contract_url: contractUrl, 
            package_details: packageDetails 
        })
        .eq('client_id', clientId)
      
      if (error) alert("Error saving details: " + error.message)
      else alert("✅ Client details updated successfully!")
      
      setIsSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-bold uppercase tracking-widest animate-pulse">Loading Client Data...</div>
  if (!site) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Client Not Found</div>

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 🧭 NAVIGATION HEADER */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition font-bold">←</button>
              <div>
                  <h1 className="text-xl font-black tracking-tight">{site.slug}</h1>
                  <a href={`http://${site.custom_domain || site.slug + '.agency'}`} target="_blank" className="text-xs text-indigo-500 font-medium hover:underline">
                      {site.custom_domain || `${site.slug}.agency`} ↗
                  </a>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${site.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {site.is_active ? '🟢 Online' : '🔴 Suspended'}
              </span>
              <button onClick={() => router.push(`/admin/builder/${site.client_id}`)} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-black transition">
                  Open Builder
              </button>
          </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
          
          {/* 📊 ANALYTICS GRAPH (Vercel Style) */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-end mb-8">
                  <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Traffic Overview</h2>
                      <p className="text-sm text-gray-500">Unique visitors over the last 30 days.</p>
                  </div>
                  <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600">3,300</p>
                      <p className="text-xs font-bold text-green-500 uppercase tracking-widest">+12% this month</p>
                  </div>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Line type="monotone" dataKey="visitors" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 📋 CLIENT CRM DETAILS */}
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Client CRM Profile</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Subscription Tier</label>
                          <select value={planTier} onChange={e => setPlanTier(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50">
                              <option value="Starter">Starter Plan</option>
                              <option value="Professional">Professional Plan</option>
                              <option value="Enterprise">Enterprise Plan</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Signed Contract URL</label>
                          <input type="text" placeholder="https://docs.google.com/..." value={contractUrl} onChange={e => setContractUrl(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" />
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Package Details & Deliverables</label>
                      <textarea rows={4} placeholder="e.g., 5-page website, monthly photoshoot, SEO optimization..." value={packageDetails} onChange={e => setPackageDetails(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 resize-none leading-relaxed" />
                  </div>

                  <div className="flex justify-end pt-2">
                      <button onClick={saveClientDetails} disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50">
                          {isSaving ? 'Saving...' : '💾 Save Profile'}
                      </button>
                  </div>
              </div>

              {/* ⚡ QUICK ACTIONS & GALLERY */}
              <div className="space-y-6">
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 transition group cursor-pointer" onClick={() => router.push(`/dashboard?tab=tickets&client=${clientId}`)}>
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition">🎫</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Support Tickets</h3>
                      <p className="text-sm text-gray-500 mb-4">View this client's edit requests.</p>
                      {ticketCount > 0 ? (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{ticketCount} Active Requests</span>
                      ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Inbox Zero</span>
                      )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group cursor-pointer" onClick={() => alert('Gallery module coming soon!')}>
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-[40px] opacity-50 z-0"></div>
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition">📸</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Gallery</h3>
                          <p className="text-sm text-gray-500 mb-4">Manage client photoshoots, logos, and media assets.</p>
                          <span className="text-indigo-600 text-sm font-bold group-hover:underline">Open Media Drive →</span>
                      </div>
                  </div>

              </div>
          </div>
      </main>
    </div>
  )
}