'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ViewType } from '@supabase/auth-ui-shared'
import { Leaf, Sparkles, Shield, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      {/* Header */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <Leaf className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-secondary-900">ScapeAir</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-12">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Marketing content */}
            <div className="hidden lg:block space-y-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-secondary-900 lg:text-5xl">
                  Welcome to <span className="text-primary-600">ScapeAir</span>
                </h1>
                <p className="mt-4 text-xl text-secondary-600">
                  Transform your landscape designs with AI-powered 3D visualization. 
                  Create stunning presentations that win more clients.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <Zap className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">Lightning Fast</h3>
                    <p className="text-secondary-600">Generate professional designs in seconds, not hours.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100">
                      <Sparkles className="h-6 w-6 text-success-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">AI-Powered</h3>
                    <p className="text-secondary-600">Advanced spatial reasoning for realistic 3D landscapes.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100">
                      <Shield className="h-6 w-6 text-warning-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">Client Ready</h3>
                    <p className="text-secondary-600">Professional presentations that close more deals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 relative">
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-secondary-600">Signing you in...</p>
                    </div>
                  </div>
                )}
                
                <div className="px-8 py-10">
                  <div className="text-center mb-8">
                    <div className="lg:hidden mb-6">
                      <h2 className="text-2xl font-bold text-secondary-900">Welcome to ScapeAir</h2>
                      <p className="mt-2 text-secondary-600">AI-powered landscape design</p>
                    </div>
                    <div className="hidden lg:block">
                      <h2 className="text-2xl font-bold text-secondary-900">
                        {currentView === 'sign_in' && 'Welcome Back'}
                        {currentView === 'sign_up' && 'Create Account'}
                        {currentView === 'forgotten_password' && 'Reset Password'}
                        {currentView === 'magic_link' && 'Magic Link'}
                      </h2>
                      <p className="mt-2 text-secondary-600">
                        {currentView === 'sign_in' && 'Sign in to your account'}
                        {currentView === 'sign_up' && 'Create your ScapeAir account'}
                        {currentView === 'forgotten_password' && 'Enter your email to reset your password'}
                        {currentView === 'magic_link' && 'Sign in with a magic link'}
                      </p>
                    </div>
                  </div>

                  <Auth
                    supabaseClient={supabase}
                    appearance={{ 
                      theme: ThemeSupa,
                      variables: {
                        default: {
                          colors: {
                            brand: '#0ea5e9',
                            brandAccent: '#0284c7',
                            brandButtonText: 'white',
                            defaultButtonBackground: 'white',
                            defaultButtonBackgroundHover: '#f8fafc',
                            defaultButtonBorder: '#e2e8f0',
                            defaultButtonText: '#1e293b',
                            dividerBackground: '#e2e8f0',
                            inputBackground: 'white',
                            inputBorder: '#e2e8f0',
                            inputBorderHover: '#cbd5e1',
                            inputBorderFocus: '#0ea5e9',
                            inputText: '#1e293b',
                            inputLabelText: '#475569',
                            inputPlaceholder: '#94a3b8',
                            messageText: '#dc2626',
                            messageTextDanger: '#dc2626',
                            anchorTextColor: '#0ea5e9',
                            anchorTextHoverColor: '#0284c7',
                          },
                          space: {
                            spaceSmall: '4px',
                            spaceMedium: '8px',
                            spaceLarge: '16px',
                            labelBottomMargin: '8px',
                            anchorBottomMargin: '4px',
                            emailInputSpacing: '4px',
                            socialAuthSpacing: '4px',
                            buttonPadding: '10px 15px',
                            inputPadding: '10px 15px',
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
                        button: 'transition-all duration-200 font-medium shadow-sm hover:shadow-md',
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
                  />
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors"
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