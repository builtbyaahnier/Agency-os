import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="text-xl font-bold tracking-tight text-indigo-600">AGENCY OS</span>
            </a>
          </div>
          <div className="flex flex-1 justify-end">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
              Client Login <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Websites that fill seats.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We build high-performance digital experiences for local restaurants. 
              From online menus to automated marketing, we handle the tech so you can handle the food.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Get Started
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div id="features" className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-400">Deploy Faster</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything a restaurant needs to grow.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                    ⚡
                  </div>
                  Lightning Fast Menus
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-400">
                  QR code ready, mobile-optimized digital menus that load instantly. Update prices in seconds.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                    📸
                  </div>
                  Professional Photography
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-400">
                  Monthly photoshoots to keep your Instagram feed fresh and your customers hungry.
                </dd>
              </div>

               <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                    🎫
                  </div>
                  24/7 Support
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-400">
                  Need a change? Submit a ticket through our Client Portal and we handle it same-day.
                </dd>
              </div>

               <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                    📈
                  </div>
                  Growth Analytics
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-400">
                  Track menu views, reservation clicks, and social media growth from one dashboard.
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}