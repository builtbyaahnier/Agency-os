'use client'
import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'

// ⚠️ THE VIP BOUNCER LIST
const ADMIN_EMAILS = [
  "builtbyaahnier@gmail.com",
  "jacobpro99@gmail.com",
]

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const nextUrl = searchParams.get('next')

  // 🧠 THE UNIVERSAL TRAFFIC DIRECTOR
  const routeUser = async (user: any) => {
      if (!user) return;

      const userEmail = user.email?.toLowerCase().trim() || '';

      // 1. Is it the Admin? (Checks the whole VIP Array now!)
      if (ADMIN_EMAILS.includes(userEmail)) {
          return router.replace('/dashboard')
      }

      // 2. Did they use a specific link? (e.g., their first time onboarding)
      if (nextUrl && nextUrl !== '/dashboard') {
          return router.replace(nextUrl)
      }

      // 3. UNIVERSAL LOGIN: They just went to /login. Let's find their portal!
      const { data: site } = await supabase
          .from('websites')
          .select('client_id')
          .eq('user_id', user.id)
          .single()

      if (site) {
          router.replace(`/portal/${site.client_id}`)
      } else {
          alert("We couldn't find a portal linked to this email. Please use your specific agency invite link for your first login!")
          await supabase.auth.signOut()
          setLoading(false)
      }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      routeUser(data.user)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
        alert(error.message)
        setLoading(false)
    } else {
        alert('Account created! You are now securely logged in.')
        routeUser(data.user)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-2xl border border-gray-100 relative z-10">
        <div className="text-center">
            <div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto mb-4 text-xl font-black">A</div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Agency OS</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Create an account or sign in to access your secure client portal.</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Email Address</label>
                <input
                    type="email"
                    required
                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm font-medium transition-shadow shadow-sm"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Password</label>
                <input
                    type="password"
                    required
                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm font-medium transition-shadow shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-xl bg-gray-900 px-3 py-3.5 text-sm font-bold text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/30 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                >
                    {loading ? 'Authenticating...' : 'Sign In Securely'}
                </button>
            </div>
        </form>
        
        <div className="text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500">First time here?</p>
            <button onClick={handleSignUp} className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create your Client Account &rarr;
            </button>
        </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <Suspense fallback={<div className="text-white font-bold animate-pulse tracking-widest uppercase">Loading...</div>}>
            <LoginForm />
        </Suspense>
    </div>
  )
}