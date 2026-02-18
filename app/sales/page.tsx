'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SalesPage() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedTier, setSelectedTier] = useState('Starter')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // --- PRICING CONFIGURATION ---
  const tiers = {
    Starter: 199,
    Growth: 499,
    Enterprise: 999,
  }

  const addonsList = [
    { name: 'Weekly Menu Updates', price: 50 },
    { name: 'Monthly Photoshoot', price: 200 },
    { name: 'Instagram Management', price: 300 },
    { name: 'SEO Booster', price: 100 },
  ]

  // Calculate Total
  const basePrice = tiers[selectedTier as keyof typeof tiers]
  const addonPrice = selectedAddons.reduce((acc, addonName) => {
    const addon = addonsList.find((a) => a.name === addonName)
    return acc + (addon ? addon.price : 0)
  }, 0)
  const totalPrice = basePrice + addonPrice

  const toggleAddon = (name: string) => {
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((item) => item !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  // --- THE NEW PAYMENT LOGIC ---
  const handleSaveContract = async () => {
    setLoading(true)
    
    // 1. Check Login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert('You must be logged in to save a contract.')
        router.push('/login')
        return
    }

    // 2. Save Contract to Database
    const { error } = await supabase.from('contracts').insert({
        client_name: clientName,
        client_email: clientEmail,
        plan_tier: selectedTier,
        monthly_price: totalPrice,
        addons: selectedAddons, // Supabase stores arrays automatically as JSON
        status: 'draft',
        user_id: user.id
    })

    if (error) {
        alert('Error saving contract: ' + error.message)
        setLoading(false)
        return
    }

    // 3. Generate Stripe Payment Link
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planName: selectedTier,
                price: totalPrice,
                clientName: clientName,
                clientEmail: clientEmail,
            }),
        })

        const data = await response.json()

        if (data.url) {
            // Success! Ask the user what to do.
            const shouldOpen = confirm("Contract Saved! \n\nDo you want to open the Payment Link now?")
            if (shouldOpen) {
                window.location.href = data.url // Go to Stripe
            } else {
                // Reset form for next client
                setClientName('')
                setClientEmail('')
                setSelectedAddons([])
                alert("Saved to dashboard.")
            }
        } else {
            console.error("Stripe Error:", data.error)
            alert("Contract saved, but could not generate payment link.")
        }

    } catch (err) {
        console.error("API Error:", err)
        alert("System error connecting to payments.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-600">New Client Contract</h1>
          <p className="mt-2 text-lg text-gray-600">Configure the package for your client.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* LEFT COLUMN: Client Details & Tiers */}
          <div className="space-y-8">
            {/* 1. Client Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Luigi's Pizza"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                  />
                </div>
              </div>
            </div>

            {/* 2. Select Tier */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Select Base Plan</h3>
              <div className="space-y-3">
                {Object.entries(tiers).map(([tier, price]) => (
                  <div 
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`cursor-pointer border rounded-lg p-4 flex justify-between items-center ${selectedTier === tier ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <span className="font-semibold">{tier}</span>
                    <span className="text-gray-600">${price}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Add-ons & Summary */}
          <div className="space-y-8">
            
            {/* 3. Add-ons */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Power-Ups & Add-ons</h3>
              <div className="space-y-3">
                {addonsList.map((addon) => (
                  <div key={addon.name} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedAddons.includes(addon.name)}
                      onChange={() => toggleAddon(addon.name)}
                    />
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">{addon.name}</label>
                      <p className="text-gray-500">+${addon.price}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Total & Save */}
            <div className="bg-indigo-900 p-6 rounded-lg shadow text-white">
              <h3 className="text-lg font-medium mb-4">Estimated Monthly Total</h3>
              <div className="text-5xl font-bold mb-2">${totalPrice}</div>
              <p className="text-indigo-200 text-sm mb-6">
                Includes {selectedTier} Plan + {selectedAddons.length} Add-ons
              </p>
              
              <button
                onClick={handleSaveContract}
                disabled={loading}
                className="w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {loading ? 'Processing...' : 'Save & Create Payment Link'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}