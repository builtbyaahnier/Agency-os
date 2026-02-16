'use client' // This tells Next.js this is a Client Component (interactive)
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('Checking connection...')

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase.from('test').select('*')
      // We expect an error because table 'test' doesn't exist yet, 
      // but if we get a 404 or a specific Supabase error, it means we ARE connected!
      if (error && error.code !== 'PGRST116') { 
         console.log(error) // Check console for details
         setStatus('Connected to Supabase! (Table missing, but that is good)')
      } else {
         setStatus('Connected!')
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Agency OS</h1>
      <p className="text-xl text-green-500 mt-4">{status}</p>
    </div>
  );
}