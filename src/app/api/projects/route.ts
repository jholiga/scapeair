import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface CreateProjectRequest {
  title: string
  description?: string
  client_name?: string
  client_email?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateProjectRequest = await request.json()
    
    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      )
    }

    // Insert new project
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        client_name: body.client_name?.trim() || null,
        client_email: body.client_email?.trim() || null,
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error creating project:', insertError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ project })

  } catch (error) {
    console.error('API error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's projects
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Database error fetching projects:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({ projects })

  } catch (error) {
    console.error('API error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 