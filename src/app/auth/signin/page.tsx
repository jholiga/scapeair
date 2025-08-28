'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ViewType } from '@supabase/auth-ui-shared'
import { Leaf, Sparkles, Shield, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'

function SignInPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const [origin, setOrigin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('sign_in')

  useEffect(() => {
    // Set origin on client side to avoid SSR issues
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true)
        router.push(redirectTo)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, redirectTo])

  // Listen for view changes in the Auth component
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Look for specific text content to determine the current view
      const authContainer = document.querySelector('[data-supabase-auth-ui]')
      if (authContainer) {
        const text = authContainer.textContent || ''
        if (text.includes('Create Account') || text.includes('Sign up')) {
          setCurrentView('sign_up')
        } else if (text.includes('Reset') || text.includes('Forgot')) {
          setCurrentView('forgotten_password')
        } else if (text.includes('Magic Link')) {
          setCurrentView('magic_link')
        } else {
          setCurrentView('sign_in')
        }
      }
    })

    // Start observing after a short delay to let the Auth component render
    const timeoutId = setTimeout(() => {
      const authContainer = document.querySelector('[data-supabase-auth-ui]') || document.body
      observer.observe(authContainer, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900/95 backdrop-blur border-b border-dark-700">
        <div className="mobile-container py-4 sm:py-6">
          <Link href="/" className="flex items-center space-x-2 w-fit">
            <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
            <span className="text-lg sm:text-xl font-bold text-light-100">ScapeAir</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left side - Marketing content */}
            <div className="hidden lg:block space-y-8">
              <div>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-light-100">
                  Welcome to <span className="text-primary-400">ScapeAir</span>
                </h1>
                <p className="mt-4 text-lg xl:text-xl text-light-300">
                  Transform your landscape designs with AI-powered 3D visualization. 
                  Create stunning presentations that win more clients.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/20 border border-primary-500/30">
                      <Zap className="h-6 w-6 text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-light-100">Lightning Fast</h3>
                    <p className="text-light-300">Generate professional designs in seconds, not hours.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/20 border border-primary-500/30">
                      <Sparkles className="h-6 w-6 text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-light-100">AI-Powered</h3>
                    <p className="text-light-300">Advanced spatial reasoning for realistic 3D landscapes.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/20 border border-primary-500/30">
                      <Shield className="h-6 w-6 text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-light-100">Client Ready</h3>
                    <p className="text-light-300">Professional presentations that close more deals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              {/* Mobile Header */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-light-100">
                  Welcome to <span className="text-primary-400">ScapeAir</span>
                </h1>
                <p className="mt-2 text-light-300">AI-powered landscape design</p>
              </div>

              <div className="bg-dark-800/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-dark-700 relative">
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-dark-800/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-primary-400 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-light-300">Signing you in...</p>
                    </div>
                  </div>
                )}
                
                <div className="px-6 sm:px-8 py-8 sm:py-10">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-light-100">
                      {currentView === 'sign_in' && 'Sign In'}
                      {currentView === 'sign_up' && 'Create Account'}
                      {currentView === 'forgotten_password' && 'Reset Password'}
                      {currentView === 'magic_link' && 'Magic Link'}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-light-300">
                      {currentView === 'sign_in' && 'Welcome back! Sign in to your account'}
                      {currentView === 'sign_up' && 'Create your ScapeAir account to get started'}
                      {currentView === 'forgotten_password' && 'Enter your email to reset your password'}
                      {currentView === 'magic_link' && 'Sign in with a magic link sent to your email'}
                    </p>
                  </div>

                  <Auth
                    supabaseClient={supabase}
                    appearance={{ 
                      theme: ThemeSupa,
                      variables: {
                        default: {
                          colors: {
                            brand: '#84cc16', // Primary lime green
                            brandAccent: '#65a30d', // Darker lime green
                            brandButtonText: '#0f172a', // Dark text on lime button
                            defaultButtonBackground: '#374151', // Dark gray
                            defaultButtonBackgroundHover: '#4b5563',
                            defaultButtonBorder: '#6b7280',
                            defaultButtonText: '#f9fafb',
                            dividerBackground: '#4b5563',
                            inputBackground: '#1f2937', // Dark input background
                            inputBorder: '#4b5563',
                            inputBorderHover: '#6b7280',
                            inputBorderFocus: '#84cc16', // Lime focus
                            inputText: '#f9fafb', // Light text
                            inputLabelText: '#d1d5db', // Light gray labels
                            inputPlaceholder: '#9ca3af',
                            messageText: '#ef4444', // Red for errors
                            messageTextDanger: '#ef4444',
                            anchorTextColor: '#84cc16', // Lime links
                            anchorTextHoverColor: '#65a30d',
                          },
                          space: {
                            spaceSmall: '4px',
                            spaceMedium: '8px',
                            spaceLarge: '16px',
                            labelBottomMargin: '8px',
                            anchorBottomMargin: '4px',
                            emailInputSpacing: '4px',
                            socialAuthSpacing: '4px',
                            buttonPadding: '12px 16px',
                            inputPadding: '12px 16px',
                          },
                          fontSizes: {
                            baseBodySize: '14px',
                            baseInputSize: '14px',
                            baseLabelSize: '14px',
                            baseButtonSize: '14px',
                          },
                          fonts: {
                            bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                            buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                            inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                            labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                          },
                          radii: {
                            borderRadiusButton: '8px',
                            buttonBorderRadius: '8px',
                            inputBorderRadius: '8px',
                          },
                        },
                      },
                      className: {
                        container: 'space-y-4',
                        button: 'transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95',
                        input: 'transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
                        label: 'font-medium',
                        message: 'text-sm',
                      },
                    }}
                    providers={[]}
                    redirectTo={origin ? `${origin}/auth/callback` : '/auth/callback'}
                    view="sign_in"
                    showLinks={true}
                    onlyThirdPartyProviders={false}
                    magicLink={false}
                    key={currentView} // Force re-render when view changes
                  />
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-light-400 hover:text-primary-400 transition-colors"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-light-300">Loading...</p>
        </div>
      </div>
    }>
      <SignInPageContent />
    </Suspense>
  )
} 