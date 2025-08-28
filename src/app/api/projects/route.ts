import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface CreateProjectRequest {
  title: string
  description?: string
  client_name?: string
  client_email?: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
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
        status: body.status || 'draft'
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

export async function DELETE(request: NextRequest) {
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

    // Get project ID from URL
    const url = new URL(request.url)
    const projectId = url.searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Delete the project (only if user owns it)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user can only delete their own projects

    if (deleteError) {
      console.error('Database error deleting project:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    // Get project ID from URL
    const url = new URL(request.url)
    const projectId = url.searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Update the project (only if user owns it)
    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update(body)
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user can only update their own projects
      .select()
      .single()

    if (updateError) {
      console.error('Database error updating project:', updateError)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ project })

  } catch (error) {
    console.error('API error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 