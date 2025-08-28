import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { Leaf, Zap, Camera, Users } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-success-50">
      {/* Navigation */}
      <nav className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-secondary-900">ScapeAir</span>
          </div>
          <div>
            {!user ? (
              <Link href="/auth/signin" className="btn-primary">
                Get Started
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-secondary-900 sm:text-6xl">
            AI-Powered{' '}
            <span className="text-primary-600">Landscape Design</span>{' '}
            Visualization
          </h1>
          <p className="mt-6 text-lg leading-8 text-secondary-600 text-balance">
            Create stunning 3D landscape and hardscape designs with AI. 
            Generate professional visualizations for client presentations in seconds, 
            not hours.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {!user ? (
              <Link href="/auth/signin" className="btn-primary text-lg px-8 py-3">
                Start Designing
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Go to Dashboard
              </Link>
            )}
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-secondary-900 hover:text-primary-600 transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mx-auto mt-32 max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
              Everything you need to impress clients
            </h2>
            <p className="mt-6 text-lg leading-8 text-secondary-600">
              Professional landscaping visualization tools powered by cutting-edge AI technology.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-secondary-900">
                Lightning Fast Generation
              </h3>
              <p className="mt-4 text-secondary-600">
                Generate professional landscape designs in seconds using advanced AI. 
                No more waiting hours for renderings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                <Camera className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-secondary-900">
                3D Spatial Reasoning
              </h3>
              <p className="mt-4 text-secondary-600">
                AI understands spatial relationships, proportions, and realistic 
                landscaping constraints for accurate visualizations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                <Users className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-secondary-900">
                Client-Ready Presentations
              </h3>
              <p className="mt-4 text-secondary-600">
                Organize designs by project and client. Share professional 
                visualizations that close more deals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-32 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
            Ready to transform your design process?
          </h2>
          <p className="mt-6 text-lg leading-8 text-secondary-600">
            Join landscapers and hardscapers who are already using AI to create 
            stunning client presentations.
          </p>
          <div className="mt-10">
            {!user ? (
              <Link href="/auth/signin" className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Create Your First Design
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-secondary-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <Leaf className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-semibold text-secondary-900">ScapeAir</span>
          </div>
          <p className="mt-4 text-center text-sm text-secondary-500">
            © 2024 ScapeAir. AI-powered landscape design visualization.
          </p>
        </div>
      </footer>
    </div>
  )
} 