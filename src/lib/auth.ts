import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Type for authenticated request handler
export type AuthenticatedHandler = (
  request: NextRequest,
  context: { userId: string; user: any; params?: any }
) => Promise<NextResponse> | NextResponse

// Higher-order function to protect API routes
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context?: { params?: any }) => {
    try {
      const supabase = await createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        )
      }

      // Pass the authenticated user to the handler
      return await handler(request, { userId: user.id, user, params: context?.params })
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

// Utility to get current user (throws if not authenticated)
export async function requireAuth() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Authentication required')
  }
  
  return user
}

// Rate limiting (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(userId: string, maxRequests = 10, windowMs = 60000) {
  const now = Date.now()
  const userKey = userId
  const current = requestCounts.get(userKey)

  if (!current || now > current.resetTime) {
    requestCounts.set(userKey, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// Input validation helper
export function validateInput<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage = 'Invalid input'
): T {
  if (!validator(data)) {
    throw new Error(errorMessage)
  }
  return data
}

// Common validation functions
export const validators = {
  isString: (value: unknown): value is string => 
    typeof value === 'string' && value.trim().length > 0,
    
  isValidPrompt: (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length >= 10 && value.trim().length <= 2000,
    
  isValidProjectId: (value: unknown): value is string =>
    typeof value === 'string' && /^[a-zA-Z0-9-_]+$/.test(value),
    
  isValidStyle: (value: unknown): value is 'photorealistic' | '3d-render' | 'architectural' | 'artistic' =>
    typeof value === 'string' && ['photorealistic', '3d-render', 'architectural', 'artistic'].includes(value)
} 