import { NextRequest, NextResponse } from 'next/server'
import { withAuth, rateLimit, validateInput, validators } from '@/lib/auth'
import { geminiService, type ImageGenerationParams } from '@/lib/gemini'
import { storageService } from '@/lib/storage'
import { createServerClient } from '@/lib/supabase'

// Input validation schema
interface GenerateImageRequest {
  projectId: string
  prompt: string
  style?: 'photorealistic' | '3d-render' | 'architectural' | 'artistic'
  viewAngle?: 'aerial' | 'ground-level' | 'elevated' | 'birds-eye' | 'same-as-image'
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'golden-hour'
  weatherCondition?: 'sunny' | 'cloudy' | 'overcast' | 'dramatic-sky'
  referenceImage: string // Base64 encoded image - REQUIRED
}

function isValidGenerateImageRequest(data: unknown): data is GenerateImageRequest {
  if (!data || typeof data !== 'object') return false
  
  const req = data as Record<string, unknown>
  
  return (
    validators.isValidProjectId(req.projectId) &&
    validators.isValidPrompt(req.prompt) &&
    typeof req.referenceImage === 'string' &&
    req.referenceImage.length > 0 &&
    (!req.style || validators.isValidStyle(req.style))
  )
}

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🚀 [${requestId}] Starting image generation request for user: ${userId}`)
  console.log(`🔍 [${requestId}] User ID details:`, {
    userId,
    type: typeof userId,
    length: userId.length,
    format: userId
  })
  
  try {
    // Rate limiting - 5 requests per minute per user
    console.log(`⏱️ [${requestId}] Checking rate limit for user: ${userId}`)
    if (!rateLimit(userId, 5, 60000)) {
      console.log(`🚫 [${requestId}] Rate limit exceeded for user: ${userId}`)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before generating another image.' },
        { status: 429 }
      )
    }
    console.log(`✅ [${requestId}] Rate limit check passed`)

    // Parse and validate request body
    console.log(`📝 [${requestId}] Parsing request body`)
    const body = await request.json().catch((error) => {
      console.error(`❌ [${requestId}] Failed to parse JSON:`, error)
      return null
    })
    
    console.log(`🔍 [${requestId}] Validating request data:`, { 
      hasBody: !!body, 
      bodyKeys: body ? Object.keys(body) : [] 
    })
    
    const validatedBody = validateInput(
      body,
      isValidGenerateImageRequest,
      'Invalid request data. Please check your input.'
    )

    const { projectId, prompt, style, viewAngle, season, timeOfDay, weatherCondition, referenceImage } = validatedBody
    console.log(`✅ [${requestId}] Request validated:`, { 
      projectId, 
      promptLength: prompt.length, 
      style, 
      viewAngle, 
      season, 
      timeOfDay, 
      weatherCondition,
      hasReferenceImage: !!referenceImage,
      referenceImageLength: referenceImage?.length || 0
    })

    // Prepare generation parameters with defaults
    const params: ImageGenerationParams = {
      prompt: prompt.trim(),
      style: style || 'photorealistic',
      viewAngle: viewAngle || 'same-as-image',
      season: season || 'summer',
      timeOfDay: timeOfDay || 'afternoon',
      weatherCondition: weatherCondition || 'sunny',
      referenceImage: referenceImage,
      basedOnPhoto: true
    }

    // Generate image using Gemini (server-side only)
    console.log(`🤖 [${requestId}] Calling Gemini API for image generation`)
    const startTime = Date.now()
    const generationResult = await geminiService.generateImage(params)
    const geminiDuration = Date.now() - startTime
    
    console.log(`⏱️ [${requestId}] Gemini API call completed in ${geminiDuration}ms`)
    console.log(`🤖 [${requestId}] Gemini result:`, { 
      success: generationResult.success, 
      hasImageData: !!generationResult.imageData,
      mimeType: generationResult.mimeType,
      error: generationResult.error 
    })

    if (!generationResult.success || !generationResult.imageData) {
      console.error(`❌ [${requestId}] Gemini generation failed:`, generationResult.error)
      return NextResponse.json(
        { 
          error: 'Failed to generate image. Please try again.',
          details: process.env.NODE_ENV === 'development' ? generationResult.error : undefined
        },
        { status: 500 }
      )
    }

    // Upload image to Supabase storage
    console.log(`☁️ [${requestId}] Uploading image to Supabase storage`)
    const uploadStartTime = Date.now()
    const uploadResult = await storageService.uploadImage({
      userId,
      projectId,
      imageData: generationResult.imageData,
      mimeType: generationResult.mimeType || 'image/jpeg'
    })
    const uploadDuration = Date.now() - uploadStartTime
    
    console.log(`⏱️ [${requestId}] Storage upload completed in ${uploadDuration}ms`)
    console.log(`☁️ [${requestId}] Upload result:`, { 
      success: uploadResult.success, 
      hasUrl: !!uploadResult.url,
      hasPath: !!uploadResult.path,
      error: uploadResult.error 
    })

    if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
      console.error(`❌ [${requestId}] Storage upload failed:`, uploadResult.error)
      return NextResponse.json(
        { 
          error: 'Failed to save image. Please try again.',
          details: process.env.NODE_ENV === 'development' ? uploadResult.error : undefined
        },
        { status: 500 }
      )
    }

    // Save image record to database using Supabase client
    console.log(`💾 [${requestId}] Saving image record to database`)
    const supabase = await createServerClient()
    const { data: imageRecord, error: dbError } = await supabase
      .from('design_images')
      .insert({
        project_id: projectId,
        user_id: userId,
        prompt: params.prompt,
        image_url: uploadResult.url,
        image_path: uploadResult.path,
        generation_params: params
      })
      .select()
      .single()

    if (dbError || !imageRecord) {
      console.error(`❌ [${requestId}] Database error:`, dbError)
      // Clean up uploaded image on database failure
      console.log(`🧹 [${requestId}] Cleaning up uploaded image due to database failure`)
      await storageService.deleteImage(uploadResult.path).catch((cleanupError) => {
        console.error(`❌ [${requestId}] Failed to cleanup uploaded image:`, cleanupError)
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to save image record. Please try again.',
          details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
        },
        { status: 500 }
      )
    }

    console.log(`✅ [${requestId}] Image generation completed successfully:`, {
      imageId: imageRecord.id,
      totalDuration: Date.now() - startTime + geminiDuration
    })

    // Return success response (only include safe data)
    return NextResponse.json({
      success: true,
      image: {
        id: imageRecord.id,
        prompt: imageRecord.prompt,
        image_url: imageRecord.image_url,
        is_favorite: imageRecord.is_favorite,
        created_at: imageRecord.created_at
      }
    })

  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error in generate-image API:`, error)
    console.error(`💥 [${requestId}] Error stack:`, (error as Error).stack)
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: process.env.NODE_ENV === 'development' ? requestId : undefined
      },
      { status: 500 }
    )
  }
}) 