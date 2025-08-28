import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Leaf, Zap, Camera, Users } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 to-dark-900">
      {/* Navigation */}
      <nav className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
            <span className="text-lg sm:text-xl font-bold text-light-100">ScapeAir</span>
          </div>
          <div>
            {!user ? (
              <Link href="/auth/signin" className="btn-primary text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                Get Started
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-light-100 leading-tight">
            AI-Powered{' '}
            <span className="text-primary-400">Landscape Design</span>{' '}
            <span className="block sm:inline">Visualization</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-light-300 text-balance px-2">
            Create stunning 3D landscape and hardscape designs with AI. 
            Generate professional visualizations for client presentations in seconds, 
            not hours.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            {!user ? (
              <Link href="/auth/signin" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3">
                Start Designing
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3">
                Go to Dashboard
              </Link>
            )}
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-light-200 hover:text-primary-400 transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mx-auto mt-16 sm:mt-32 max-w-7xl">
          <div className="mx-auto max-w-2xl text-center px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light-100">
              Everything you need to impress clients
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-light-300">
              Professional landscaping visualization tools powered by cutting-edge AI technology.
            </p>
          </div>
          
          <div className="mx-auto mt-12 sm:mt-16 lg:mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3 px-4">
            {/* Feature 1 */}
            <div className="bg-dark-800/50 backdrop-blur border border-dark-700 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-500/20">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-light-100">
                Lightning Fast Generation
              </h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-light-300 leading-relaxed">
                Generate professional landscape designs in seconds using advanced AI. 
                No more waiting hours for renderings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-dark-800/50 backdrop-blur border border-dark-700 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-success-500/20">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-success-400" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-light-100">
                3D Spatial Reasoning
              </h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-light-300 leading-relaxed">
                AI understands spatial relationships, proportions, and realistic 
                landscaping constraints for accurate visualizations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-dark-800/50 backdrop-blur border border-dark-700 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-warning-500/20">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-warning-400" />
              </div>
              <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-light-100">
                Client-Ready Presentations
              </h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-light-300 leading-relaxed">
                Organize designs by project and client. Share professional 
                visualizations that close more deals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-16 sm:mt-32 max-w-2xl text-center px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-light-100">
            Ready to transform your design process?
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-light-300">
            Join landscapers and hardscapers who are already using AI to create 
            stunning client presentations.
          </p>
          <div className="mt-8 sm:mt-10">
            {!user ? (
              <Link href="/auth/signin" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3">
                Get Started Free
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3">
                Create Your First Design
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-32 border-t border-dark-700 py-8 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
            <span className="text-base sm:text-lg font-semibold text-light-100">ScapeAir</span>
          </div>
          <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-light-400">
            © 2024 ScapeAir. AI-powered landscape design visualization.
          </p>
        </div>
      </footer>
    </div>
  )
} 