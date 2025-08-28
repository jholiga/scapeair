'use client'

import { useState, useRef } from 'react'
import { Upload, X, Camera, FileImage } from 'lucide-react'
import Image from 'next/image'

interface PhotoUploadProps {
  onPhotoUploaded: (file: File, previewUrl: string) => void
  onPhotoRemoved: () => void
  existingPhotoUrl?: string
  isUploading?: boolean
  className?: string
}

export default function PhotoUpload({
  onPhotoUploaded,
  onPhotoRemoved,
  existingPhotoUrl,
  isUploading = false,
  className = ''
}: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Call the parent callback
    onPhotoUploaded(file, url)
  }

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    onPhotoRemoved()
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
          Reference Photo <span className="text-red-500">*</span>
        </label>
      <p className="text-xs text-secondary-500 mb-3">
                            Upload a photo of the house/property (required) - AI will generate designs based on the existing structure
      </p>

      {previewUrl ? (
        // Preview mode
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-secondary-100">
            <Image
              src={previewUrl}
              alt="Reference photo preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Upload area
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!isUploading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={isUploading}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-2">
            {dragActive ? (
              <FileImage className="h-10 w-10 text-primary-500" />
            ) : (
              <Camera className="h-10 w-10 text-secondary-400" />
            )}
            
            <div className="text-sm">
              <span className="font-medium text-secondary-900">
                Click to upload
              </span>
              <span className="text-secondary-500"> or drag and drop</span>
            </div>
            
            <p className="text-xs text-secondary-500">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <Upload className="h-6 w-6 text-primary-500 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 