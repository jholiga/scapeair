import { createClient, createServerClient } from '@/lib/supabase'

// Create Supabase client for storage operations
async function getSupabaseClient() {
  // Detect if we're running on the server side
  if (typeof window === 'undefined') {
    // Server-side: use server client with cookies
    return await createServerClient()
  } else {
    // Client-side: use browser client
    return createClient()
  }
}

interface UploadImageParams {
  userId: string
  projectId: string
  imageData: string
  mimeType: string
  fileName?: string
}

interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

class StorageService {
  private bucketName = 'project-images' // Updated to match new schema

  // Convert base64 to blob
  private base64ToBlob(base64Data: string, mimeType: string): Blob {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Generate a unique file name
  private generateFileName(userId: string, projectId: string, mimeType: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = mimeType.split('/')[1] || 'jpg'
    return `${userId}/${projectId}/${timestamp}.${extension}`
  }

  async uploadImage(params: UploadImageParams): Promise<UploadResult> {
    const storageRequestId = `storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`☁️ [${storageRequestId}] Starting image upload to Supabase Storage`)
    console.log(`📊 [${storageRequestId}] Upload parameters:`, {
      userId: params.userId,
      projectId: params.projectId,
      mimeType: params.mimeType,
      dataLength: params.imageData.length,
      hasFileName: !!params.fileName,
      bucketName: this.bucketName
    })
    
    try {
      const { userId, projectId, imageData, mimeType, fileName } = params

      // Generate file path
      console.log(`📁 [${storageRequestId}] Generating file path`)
      const filePath = fileName || this.generateFileName(userId, projectId, mimeType)
      console.log(`📁 [${storageRequestId}] Generated file path: ${filePath}`)
      console.log(`🔍 [${storageRequestId}] User ID for path: "${userId}" (type: ${typeof userId}, length: ${userId.length})`)

      // Convert base64 to blob
      console.log(`🔄 [${storageRequestId}] Converting base64 to blob`)
      const blob = this.base64ToBlob(imageData, mimeType)
      console.log(`📦 [${storageRequestId}] Blob created:`, {
        size: blob.size,
        type: blob.type
      })

      // Upload to Supabase storage
      console.log(`⬆️ [${storageRequestId}] Uploading to Supabase storage bucket: ${this.bucketName}`)
      const supabase = await getSupabaseClient()
      const uploadStart = Date.now()
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false
        })
      const uploadDuration = Date.now() - uploadStart
      
      console.log(`⏱️ [${storageRequestId}] Upload completed in ${uploadDuration}ms`)

      if (error) {
        console.error(`❌ [${storageRequestId}] Storage upload error:`, {
          message: error.message,
          name: error.name,
          details: error
        })
        console.error(`❌ [${storageRequestId}] Upload context:`, {
          bucketName: this.bucketName,
          filePath,
          blobSize: blob.size,
          contentType: mimeType
        })
        return {
          success: false,
          error: error.message
        }
      }

      console.log(`✅ [${storageRequestId}] Upload successful:`, {
        path: data?.path,
        id: data?.id
      })

      // Get public URL
      console.log(`🔗 [${storageRequestId}] Getting public URL`)
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      console.log(`✅ [${storageRequestId}] Storage operation completed successfully:`, {
        publicUrl: urlData.publicUrl,
        filePath
      })

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      }

    } catch (error) {
      console.error(`💥 [${storageRequestId}] Unexpected error uploading image:`, error)
      console.error(`💥 [${storageRequestId}] Error stack:`, (error as Error).stack)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

        async deleteImage(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Storage delete error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error deleting image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async listImages(userId: string, projectId?: string): Promise<{
    success: boolean
    files?: Array<{ name: string; url: string }>
    error?: string
  }> {
    try {
      const prefix = projectId ? `${userId}/${projectId}` : userId
      const supabase = await getSupabaseClient()

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(prefix, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Storage list error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const files = data?.map((file: any) => {
        const filePath = `${prefix}/${file.name}`
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath)

        return {
          name: file.name,
          url: urlData.publicUrl
        }
      }) || []

      return {
        success: true,
        files
      }

    } catch (error) {
      console.error('Error listing images:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Get signed URL for private access (if needed)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{
    success: boolean
    url?: string
    error?: string
  }> {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Storage signed URL error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        url: data.signedUrl
      }

    } catch (error) {
      console.error('Error creating signed URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

export const storageService = new StorageService()
export type { UploadImageParams, UploadResult } 