'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('loading')
  const router = useRouter()
  
  // Data State
  const [clients, setClients] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  
  // UI State
  const [activeTab, setActiveTab] = useState('tickets') // 'tickets', 'clients', 'contracts'
  
  // Client Form State
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setRole(profile.role)
        if (profile.role === 'admin') {
            fetchAdminData()
        } else {
            fetchMyTickets(user.id)
        }
      }
    }
    getUser()
  }, [router])

  const fetchAdminData = async () => {
      // 1. Get Clients
      const { data: clientsData } = await supabase.from('profiles').select('*').eq('role', 'client')
      if (clientsData) setClients(clientsData)

      // 2. Get Tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*, profiles(restaurant_name, email)')
        .order('created_at', { ascending: false })
      if (ticketsData) setTickets(ticketsData)

      // 3. Get Contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })
      if (contractsData) setContracts(contractsData)
  }

  const markTicketComplete = async (ticketId: number) => {
      await supabase.from('tickets').update({ status: 'closed' }).eq('id', ticketId)
      fetchAdminData() 
  }

  const fetchMyTickets = async (userId: string) => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (data) setTickets(data)
  }

  const submitTicket = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      const { error } = await supabase.from('tickets').insert({
          title: ticketTitle,
          description: ticketDesc,
          user_id: user.id,
          status: 'open'
      })
      if (!error) {
          setTicketTitle(''); setTicketDesc(''); 
          fetchMyTickets(user.id)
          alert('Request received!')
      }
      setIsSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Calculate Revenue
  const totalRevenue = contracts.reduce((acc, curr) => acc + curr.monthly_price, 0)

  if (role === 'loading') return <div className="flex h-screen items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <span className="text-xl font-bold text-indigo-600">Agency OS</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500 capitalize">{role} View</span>
              <button onClick={handleLogout} className="text-sm font-semibold text-red-600">Log Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* --- ADMIN DASHBOARD --- */}
          {role === 'admin' && (
            <div>
                {/* Stats Bar */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Monthly Revenue</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">${totalRevenue}</dd>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Tickets</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {tickets.filter(t => t.status === 'open').length}
                        </dd>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Contracts</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {contracts.filter(c => c.status === 'draft').length}
                        </dd>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {['tickets', 'clients', 'contracts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${
                                    activeTab === tab
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'tickets' && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {tickets.map((ticket) => (
                                <li key={ticket.id} className="p-6 hover:bg-gray-50 flex justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium">{ticket.title}</h3>
                                        <p className="text-sm text-gray-500">{ticket.description}</p>
                                        <p className="text-xs text-indigo-600 mt-1">From: {ticket.profiles?.restaurant_name}</p>
                                    </div>
                                    {ticket.status === 'open' ? (
                                        <button onClick={() => markTicketComplete(ticket.id)} className="text-indigo-600 text-sm font-medium">Mark Done</button>
                                    ) : (
                                        <span className="text-green-600 text-sm">Completed</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 flex justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Sales Pipeline</h3>
                            <button onClick={() => router.push('/sales')} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">Create New Contract</button>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {contracts.map((contract) => (
                                <li key={contract.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{contract.client_name}</p>
                                            <p className="text-sm text-gray-500">{contract.plan_tier} Plan (${contract.monthly_price}/mo)</p>
                                            <div className="flex gap-2 mt-2">
                                                {contract.addons?.map((addon: string) => (
                                                    <span key={addon} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                        {addon}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                {contract.status}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {activeTab === 'clients' && (
                     <div className="bg-white shadow sm:rounded-lg p-6">
                        <p className="text-gray-500">Active Clients List (From Database)</p>
                        <ul className="mt-4 space-y-4">
                             {clients.map(c => (
                                 <li key={c.id} className="font-medium">{c.restaurant_name} ({c.email})</li>
                             ))}
                        </ul>
                     </div>
                )}
            </div>
          )}

          {/* --- CLIENT DASHBOARD (UNCHANGED) --- */}
          {role === 'client' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">Request Update</h2>
                    <form onSubmit={submitTicket} className="space-y-4">
                        <input type="text" className="w-full border p-2 rounded" placeholder="Title" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} />
                        <textarea className="w-full border p-2 rounded" placeholder="Details" value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} />
                        <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white p-2 rounded">Submit</button>
                    </form>
                </div>
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">History</h2>
                    {tickets.map(t => (
                        <div key={t.id} className="border-b py-2"><p className="font-bold">{t.title}</p><p className="text-sm">{t.status}</p></div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}