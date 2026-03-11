import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  // Grab the domain the user typed into their browser (e.g., luigispizza.com)
  const hostname = req.headers.get('host') || ''

  // Define our own agency domains (we don't want to redirect ourselves!)
  const isBaseDomain = hostname.includes('localhost:3000') || hostname.includes('your-agency-name.com')

  // If the visitor is coming from a CUSTOM DOMAIN
  if (!isBaseDomain) {
    // We secretly rewrite their URL to a hidden folder in our app,
    // passing their domain name so we can look it up in the database.
    // The user's URL bar will NOT change!
    return NextResponse.rewrite(new URL(`/domain/${hostname}`, req.url))
  }

  return NextResponse.next()
}

// This tells Next.js to run this cop on every page EXCEPT the static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}