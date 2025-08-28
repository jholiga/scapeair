// Simple environment variable access without build-time validation
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue
}

// Validate environment variable at runtime
const requireEnvVar = (key: string, context = 'runtime'): string => {
  const value = process.env[key]
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Missing ${context} environment variable: ${key}`)
      throw new Error(`${key} is required but not set`)
    } else {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
  return value
}

// Type-safe environment access
export const env = {
  // Server-only - validated at runtime when accessed
  get GEMINI_API_KEY() {
    if (typeof window !== 'undefined') {
      throw new Error('GEMINI_API_KEY is server-only')
    }
    return requireEnvVar('GEMINI_API_KEY', 'server')
  },

  // Client-safe - no validation needed as they're public
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  },
  
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  
  get NEXT_PUBLIC_APP_URL() {
    return getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
  },
} 