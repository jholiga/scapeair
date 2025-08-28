interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string
        }
      }>
    }
  }>
}

interface ImageGenerationParams {
  prompt: string
  style?: 'photorealistic' | '3d-render' | 'architectural' | 'artistic'
  viewAngle?: 'aerial' | 'ground-level' | 'elevated' | 'birds-eye' | 'same-as-image'
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'golden-hour'
  weatherCondition?: 'sunny' | 'cloudy' | 'overcast' | 'dramatic-sky'
  referenceImage: string // Base64 encoded image - REQUIRED
  basedOnPhoto?: boolean
}

class GeminiImageService {
  private apiKey?: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview'

  private getApiKey(): string {
    if (typeof window !== 'undefined') {
      throw new Error('Gemini service is server-only')
    }
    
    if (!this.apiKey) {
      // Import here to avoid client-side bundling
      const { env } = require('./env')
      this.apiKey = env.GEMINI_API_KEY
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required')
      }
    }
    return this.apiKey
  }

  private buildLandscapePrompt(params: ImageGenerationParams): string {
    const {
      prompt,
      style = 'photorealistic',
      viewAngle = 'ground-level',
      season = 'summer',
      timeOfDay = 'afternoon',
      weatherCondition = 'sunny',
      basedOnPhoto = false
    } = params

    // All generations now require a reference image
    let enhancedPrompt = `Transform this landscape WITH MODIFICATIONS AS DESCRIBED by adding/modifying: ${prompt}. `
    
    // CRITICAL: Apply the exact view angle with dramatic perspective changes
    switch (viewAngle) {
      case 'same-as-image':
        enhancedPrompt += 'MAINTAIN EXACT VIEWPOINT: Keep the identical camera angle, height, and perspective as the original reference image. Do not change the viewing position at all. '
        break
      case 'ground-level':
        enhancedPrompt += 'GROUND-LEVEL VIEW: Position the camera at human eye level (5-6 feet high) looking straight across the landscape. Show the property from a person standing on the ground perspective. '
        break
      case 'elevated':
        enhancedPrompt += 'ELEVATED PERSPECTIVE: Position the camera significantly higher - as if taken from a 2-3 story building or drone at 30-50 feet height. Show a dramatic downward angle revealing the entire property layout, rooflines, and landscape design from above. '
        break
      case 'birds-eye':
        enhancedPrompt += 'BIRDS-EYE VIEW: Position the camera directly overhead at 100+ feet height looking straight down. Show a complete top-down aerial view of the entire property, like a satellite or high-altitude drone shot. The house should appear as a rooftop and the landscape as patterns and shapes from above. '
        break
      case 'aerial':
        enhancedPrompt += 'AERIAL VIEW: Position the camera at medium-high altitude (50-100 feet) at an angled perspective showing the property and surrounding area. Similar to helicopter or low-flying drone footage with a diagonal viewing angle. '
        break
    }
    
    enhancedPrompt += 'Work with the existing architecture and structure shown in the photo. Preserve the character of the building while enhancing the landscape. '

    // CRITICAL: Apply the exact style specified with dramatic visual differences
    switch (style) {
      case 'photorealistic':
        enhancedPrompt += 'PHOTOREALISTIC STYLE: Create an ultra-realistic photograph that looks like it was taken with a professional DSLR camera. Include natural imperfections, organic textures, realistic shadows, natural lighting variations, and authentic material wear. The image should be indistinguishable from a real photograph with depth of field, natural color grading, and realistic atmospheric effects. '
        break
      case '3d-render':
        enhancedPrompt += 'CAD 3D RENDER STYLE: Create a computer-generated 3D architectural rendering that looks like output from CAD software (AutoCAD, SketchUp, Revit). Use clean geometric shapes, perfectly straight lines, uniform lighting, smooth surfaces, and a slightly artificial/digital appearance. Materials should look pristine and new with no weathering. Use consistent lighting with minimal shadows, bright even illumination, and a polished computer-graphics aesthetic. The overall look should be clearly digital and architectural-software-generated, not photographic. '
        break
    }

    // CRITICAL: Environmental parameters must be dramatically visible
    enhancedPrompt += `MANDATORY ENVIRONMENTAL SETTINGS: `
    
    // Season-specific details
    switch (season) {
      case 'spring':
        enhancedPrompt += 'SPRING SEASON: Show fresh green grass, blooming flowers, budding trees with new leaves, mild temperatures. Include spring flowers like tulips, daffodils, or cherry blossoms. Grass should be vibrant green and growing. '
        break
      case 'summer':
        enhancedPrompt += 'SUMMER SEASON: Show lush, full green vegetation, mature leaves on all trees, bright sunny conditions, fully grown grass and plants. Include summer flowers in full bloom. Everything should look abundant and fully grown. '
        break
      case 'fall':
        enhancedPrompt += 'FALL/AUTUMN SEASON: Show dramatic fall colors with trees displaying orange, red, yellow, and brown leaves. Include fallen leaves on the ground, some bare branches, and autumn landscaping. Grass may be slightly less green. '
        break
      case 'winter':
        enhancedPrompt += 'WINTER SEASON: Show bare deciduous trees, evergreens with snow, dormant brown grass, winter landscaping. Include snow on surfaces if appropriate for the climate, frost effects, and winter lighting conditions. '
        break
    }
    
    // Time of day lighting
    switch (timeOfDay) {
      case 'morning':
        enhancedPrompt += 'MORNING LIGHTING: Show soft, warm golden light from the east, long shadows, dew or moisture effects, cooler color temperature gradually warming up. '
        break
      case 'afternoon':
        enhancedPrompt += 'AFTERNOON LIGHTING: Show bright, direct sunlight from overhead, shorter shadows, warm bright lighting, clear visibility of all details. '
        break
      case 'evening':
        enhancedPrompt += 'EVENING LIGHTING: Show warm golden hour light from the west, long dramatic shadows, warm orange/pink color temperature, beautiful sunset lighting effects. '
        break
    }
    
    // Weather conditions
    switch (weatherCondition) {
      case 'sunny':
        enhancedPrompt += 'SUNNY WEATHER: Show clear blue skies, bright direct sunlight, sharp shadows, excellent visibility, vibrant colors. '
        break
      case 'cloudy':
        enhancedPrompt += 'CLOUDY WEATHER: Show scattered clouds in the sky, soft diffused lighting, gentle shadows, pleasant lighting conditions. '
        break
      case 'overcast':
        enhancedPrompt += 'OVERCAST WEATHER: Show completely overcast skies with thick cloud cover, very soft diffused lighting, minimal shadows, muted colors, grey sky conditions. '
        break
      case 'dramatic-sky':
        enhancedPrompt += 'DRAMATIC SKY: Show striking, dynamic cloud formations, interesting sky patterns, dramatic lighting effects, possibly storm clouds or sunset/sunrise drama in the sky. '
        break
    }
    
    // Add landscaping-specific details
    enhancedPrompt += 'Include detailed landscaping elements: well-maintained lawn areas, carefully selected plants and trees appropriate for the climate, '
    enhancedPrompt += 'professional hardscaping with quality materials like natural stone, pavers, or concrete, proper drainage considerations, '
    enhancedPrompt += 'appropriate lighting fixtures, and clean property lines. '

    // Add spatial reasoning guidance
    enhancedPrompt += 'Pay careful attention to spatial relationships, scale, proportions, and how different elements interact with each other and the existing architecture. '
    enhancedPrompt += 'Ensure the design looks professionally planned and executable by a landscaping contractor. '

    // Add final instruction for image-only output
    enhancedPrompt += 'Output: Return ONLY the final edited image. Do not return text.'

    console.log('enhancedPrompt', enhancedPrompt)

    return enhancedPrompt
  }

  async generateImage(params: ImageGenerationParams): Promise<{
    success: boolean
    imageData?: string
    mimeType?: string
    error?: string
  }> {
    const geminiRequestId = `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🤖 [${geminiRequestId}] Starting Gemini image generation`)
    console.log(`📝 [${geminiRequestId}] Input parameters:`, {
      promptLength: params.prompt.length,
      style: params.style,
      viewAngle: params.viewAngle,
      season: params.season,
      timeOfDay: params.timeOfDay,
      weatherCondition: params.weatherCondition,
      hasReferenceImage: !!params.referenceImage,
      basedOnPhoto: params.basedOnPhoto
    })
    
    try {
      const enhancedPrompt = this.buildLandscapePrompt(params)
      console.log(`✨ [${geminiRequestId}] Enhanced prompt length: ${enhancedPrompt.length} characters`)

      // Build the request parts - reference image is now required
      const parts: any[] = []

      // Add reference image first (required for all generations)
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: params.referenceImage
        }
      })

      // Add text prompt
      parts.push({
        text: enhancedPrompt
      })

      console.log(`🌐 [${geminiRequestId}] Making API call to Gemini`)
      console.log(`🔧 [${geminiRequestId}] Request config:`, {
        url: `${this.baseUrl}:generateContent`,
        partsCount: parts.length,
        hasApiKey: !!this.getApiKey(),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
      
      const apiCallStart = Date.now()
      const response = await fetch(`${this.baseUrl}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      })
      const apiCallDuration = Date.now() - apiCallStart
      
      console.log(`⏱️ [${geminiRequestId}] API call completed in ${apiCallDuration}ms`)
      console.log(`📊 [${geminiRequestId}] Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [${geminiRequestId}] Gemini API error:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500) // Limit error text length
        })
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`
        }
      }

      console.log(`📥 [${geminiRequestId}] Parsing response JSON`)
      const data: GeminiResponse = await response.json()
      
      console.log(`🔍 [${geminiRequestId}] Response structure:`, {
        hasCandidates: !!data.candidates,
        candidatesCount: data.candidates?.length || 0,
        firstCandidateHasParts: data.candidates?.[0]?.content?.parts?.length || 0
      })

      if (!data.candidates || data.candidates.length === 0) {
        console.error(`❌ [${geminiRequestId}] No candidates in response`)
        return {
          success: false,
          error: 'No image generated by the API'
        }
      }

      const candidate = data.candidates[0]
      console.log(`🔍 [${geminiRequestId}] Searching for image data in response parts`)
      
      const imagePart = candidate.content.parts.find(part => part.inlineData)
      console.log(`🖼️ [${geminiRequestId}] Image part found:`, {
        hasImagePart: !!imagePart,
        hasInlineData: !!imagePart?.inlineData,
        mimeType: imagePart?.inlineData?.mimeType,
        dataLength: imagePart?.inlineData?.data?.length || 0
      })

      if (!imagePart || !imagePart.inlineData) {
        console.error(`❌ [${geminiRequestId}] No image data found in response`)
        console.error(`❌ [${geminiRequestId}] Available parts:`, 
          candidate.content.parts.map(part => ({
            hasText: !!part.text,
            hasInlineData: !!part.inlineData,
            textPreview: part.text?.substring(0, 100)
          }))
        )
        return {
          success: false,
          error: 'No image data found in response'
        }
      }

      console.log(`✅ [${geminiRequestId}] Successfully extracted image data`)
      return {
        success: true,
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType
      }

    } catch (error) {
      console.error(`💥 [${geminiRequestId}] Error generating image:`, error)
      console.error(`💥 [${geminiRequestId}] Error stack:`, (error as Error).stack)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }


}

export const geminiService = new GeminiImageService()
export type { ImageGenerationParams } 