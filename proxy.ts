import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🚨 Changed from middleware() to proxy() to fix the Next.js warning!
export function proxy(req: NextRequest) {
  const url = req.nextUrl
  // Grab the domain the user typed into their browser
  const hostname = req.headers.get('host') || ''

  // 🚦 THE FIX: Added Vercel domains to the safe list!
  const isBaseDomain = 
    hostname.includes('localhost:3000') || 
    hostname.includes('vercel.app') || // 👈 Lets your Vercel URL through!
    hostname.includes('your-agency-name.com')

  // If the visitor is coming from a CUSTOM DOMAIN
  if (!isBaseDomain) {
    // We secretly rewrite their URL to a hidden folder in our app,
    // passing their domain name so we can look it up in the database.
    return NextResponse.rewrite(new URL(`/domain/${hostname}`, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}