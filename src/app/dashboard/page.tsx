'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Leaf, Plus, Wand2, Image as ImageIcon, Loader2, LogOut, Download, Heart, Trash2, X, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { geminiService } from '@/lib/gemini'
import type { ImageGenerationParams } from '@/lib/gemini'

import { storageService } from '@/lib/storage'

interface Project {
  id: string
  title: string
  description: string | null
  client_name: string | null
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  reference_photo_url: string | null
  reference_photo_path: string | null
  created_at: string
}

interface DesignImage {
  id: string
  project_id: string
  prompt: string
  image_url: string
  image_path: string
  is_favorite: boolean
  created_at: string
}

interface ReferenceImage {
  id: string
  project_id: string
  user_id: string
  image_url: string
  image_path: string
  filename: string
  description: string | null
  is_primary: boolean
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [images, setImages] = useState<DesignImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generationParams, setGenerationParams] = useState<Partial<ImageGenerationParams>>({
    style: 'photorealistic',
    viewAngle: 'same-as-image',
    season: 'summer',
    timeOfDay: 'afternoon',
    weatherCondition: 'sunny'
  })

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    client_name: '',
    client_email: ''
  })

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [selectedImage, setSelectedImage] = useState<DesignImage | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [selectedReferenceImage, setSelectedReferenceImage] = useState<ReferenceImage | null>(null)
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [previewReferenceImage, setPreviewReferenceImage] = useState<ReferenceImage | null>(null)

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      if (!user) {
        router.push('/auth/signin')
      }
    }
    
    getUser()
  }, [supabase, router])

  // Load real projects from API
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const { projects } = await response.json()
          setProjects(projects)
          
          // Auto-select first project if available
          if (projects.length > 0) {
            setSelectedProject(projects[0])
          }
        } else {
          console.error('Failed to load projects:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }
    
    loadProjects()
  }, [user])

  // Load images and reference images for selected project
  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject || !user) {
        setImages([])
        setReferenceImages([])
        setSelectedReferenceImage(null)
        return
      }

      try {
        const supabase = createClient()
        
        // Load design images
        const { data: projectImages, error: imagesError } = await supabase
          .from('design_images')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (imagesError) {
          console.error('Error loading project images:', imagesError)
        } else {
          setImages(projectImages || [])
        }

        // Load reference images
        const { data: refImages, error: refError } = await supabase
          .from('reference_images')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('user_id', user.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false })

        if (refError) {
          console.error('Error loading reference images:', refError)
        } else {
          setReferenceImages(refImages || [])
          // Auto-select primary reference image or first one
          const primaryImage = refImages?.find(img => img.is_primary) || refImages?.[0]
          setSelectedReferenceImage(primaryImage || null)
        }
      } catch (error) {
        console.error('Error loading project data:', error)
      }
    }

    loadProjectData()
  }, [selectedProject, user])

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return
    
    setIsCreatingProject(true)
    try {
      // First create the project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject)
      })
      
      if (!response.ok) {
        const { error } = await response.json()
        alert('Failed to create project: ' + error)
        return
      }

      const { project } = await response.json()

      setProjects(prev => [project, ...prev])
      setSelectedProject(project)
      setShowCreateProject(false)
      setNewProject({
        title: '',
        description: '',
        client_name: '',
        client_email: ''
      })
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleReferenceImageUpload = async (files: FileList) => {
    if (!selectedProject || !user || files.length === 0) return

    try {
      const supabase = createClient()
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${selectedProject.id}/reference-${Date.now()}-${index}.${fileExt}`

        // Upload directly to Supabase Storage using client credentials
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName)

        // Save to database
        const { data: referenceImage, error: dbError } = await supabase
          .from('reference_images')
          .insert({
            project_id: selectedProject.id,
            user_id: user.id,
            image_url: publicUrl,
            image_path: fileName,
            filename: file.name,
            description: null,
            is_primary: referenceImages.length === 0 && index === 0 // First image of first upload is primary
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(`Failed to save ${file.name} to database: ${dbError.message}`)
        }

        return referenceImage
      })

      const newReferenceImages = await Promise.all(uploadPromises)
      setReferenceImages(prev => [...newReferenceImages, ...prev])
      
      // Set first uploaded image as selected if none selected
      if (!selectedReferenceImage && newReferenceImages.length > 0) {
        setSelectedReferenceImage(newReferenceImages[0])
      }
    } catch (error) {
      console.error('Error uploading reference images:', error)
      alert('Failed to upload some reference images: ' + (error as Error).message)
    }
  }

  const handleDeleteReferenceImage = async (refImage: ReferenceImage) => {
    if (!confirm(`Are you sure you want to delete "${refImage.filename}"?`)) return

    try {
      const supabase = createClient()
      
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('project-images')
        .remove([refImage.image_path])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue anyway - we'll still remove from database
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('reference_images')
        .delete()
        .eq('id', refImage.id)

      if (dbError) {
        throw new Error(`Failed to delete from database: ${dbError.message}`)
      }

      // Update local state
      setReferenceImages(prev => prev.filter(img => img.id !== refImage.id))
      
      // If this was the selected image, clear selection
      if (selectedReferenceImage?.id === refImage.id) {
        const remainingImages = referenceImages.filter(img => img.id !== refImage.id)
        setSelectedReferenceImage(remainingImages.length > 0 ? remainingImages[0] : null)
      }

    } catch (error) {
      console.error('Error deleting reference image:', error)
      alert('Failed to delete reference image: ' + (error as Error).message)
    }
  }

  const handlePreviewReferenceImage = (refImage: ReferenceImage) => {
    setPreviewReferenceImage(refImage)
    setShowReferenceModal(true)
  }

  const handleImageClick = (image: DesignImage) => {
    setSelectedImage(image)
    setShowImageModal(true)
  }

  const handleDownloadImage = async (image: DesignImage) => {
    try {
      const response = await fetch(image.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scapeair-design-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image')
    }
  }

  const handleToggleFavorite = async (image: DesignImage) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('design_images')
        .update({ is_favorite: !image.is_favorite })
        .eq('id', image.id)

      if (error) {
        console.error('Error toggling favorite:', error)
        alert('Failed to update favorite status')
        return
      }

      // Update local state
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, is_favorite: !img.is_favorite } : img
      ))
      
      // Update selected image if it's the same one
      if (selectedImage?.id === image.id) {
        setSelectedImage(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorite status')
    }
  }

  const handleDeleteImage = async (image: DesignImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const supabase = createClient()
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('design_images')
        .delete()
        .eq('id', image.id)

      if (dbError) {
        console.error('Error deleting image from database:', dbError)
        alert('Failed to delete image')
        return
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-images')
        .remove([image.image_path])

      if (storageError) {
        console.error('Error deleting image from storage:', storageError)
        // Continue anyway - database record is already deleted
      }

      // Update local state
      setImages(prev => prev.filter(img => img.id !== image.id))
      setShowImageModal(false)
      setSelectedImage(null)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }



  const handleGenerateImage = async () => {
    if (!selectedProject || !prompt.trim()) return
    
    // Reference image is now required
    if (!selectedReferenceImage) {
      alert('Please upload and select a reference image first.')
      return
    }

    setIsGenerating(true)
    try {
      // Get reference image data from the selected reference image
      const imageResponse = await fetch(selectedReferenceImage.image_url)
      const blob = await imageResponse.blob()
      const referenceImageData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          // Remove data URL prefix (data:image/jpeg;base64,)
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(blob)
      })

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          prompt: prompt.trim(),
          referenceImage: referenceImageData,
          ...generationParams
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Add new image to the list
        setImages(prev => [data.image, ...prev])
        // Don't clear prompt - user might want to generate variations
      } else {
        console.error('Generation failed:', data.error)
        alert('Failed to generate image: ' + data.error)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Leaf className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-secondary-900">ScapeAir</span>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-semibold text-secondary-900">
                  Welcome back, {user?.email?.split('@')[0] || 'Designer'}!
                </h1>
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Projects */}
        <aside className="w-64 bg-white border-r border-secondary-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Projects</h2>
              <button 
                onClick={() => setShowCreateProject(true)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-secondary-500">
                  <p className="mb-2">No projects yet</p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-primary-50 border-primary-200 border'
                      : 'hover:bg-secondary-50'
                  }`}
                >
                  <div className="font-medium text-secondary-900 truncate">
                    {project.title}
                  </div>
                  <div className="text-sm text-secondary-500 truncate">
                    {project.client_name}
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'completed' ? 'bg-success-100 text-success-700' :
                      project.status === 'in_progress' ? 'bg-primary-100 text-primary-700' :
                      'bg-secondary-100 text-secondary-700'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedProject ? (
            <div className="max-w-4xl mx-auto">
              {/* Project Header */}
              <div className="mb-8">
                <div className="flex flex-col space-y-6">
                  {/* Project Info */}
                  <div>
                    <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                      {selectedProject.title}
                    </h1>
                    <p className="text-secondary-600">
                      {selectedProject.description}
                    </p>
                    {selectedProject.client_name && (
                      <p className="text-sm text-secondary-500 mt-1">
                        Client: {selectedProject.client_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Reference Images Section */}
                  <div className="bg-white border border-secondary-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-secondary-900">Reference Images</h3>
                      <label className="btn-secondary text-sm cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => e.target.files && handleReferenceImageUpload(e.target.files)}
                          className="hidden"
                        />
                        <Plus className="h-4 w-4 mr-2" />
                        Add Images
                      </label>
                    </div>
                    
                    {referenceImages.length === 0 ? (
                      <div className="text-center py-12 text-secondary-400 border-2 border-dashed border-secondary-200 rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3" />
                        <p className="text-sm font-medium">No reference images</p>
                        <p className="text-xs">Upload photos of the property to get started</p>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                          {referenceImages.map((refImage) => (
                            <div
                              key={refImage.id}
                              className={`group relative rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                                selectedReferenceImage?.id === refImage.id
                                  ? 'border-primary-500 ring-2 ring-primary-200'
                                  : 'border-secondary-200 hover:border-primary-300'
                              }`}
                            >
                              <img
                                src={refImage.image_url}
                                alt={refImage.filename}
                                className="w-full h-24 object-cover cursor-pointer"
                                onClick={() => setSelectedReferenceImage(refImage)}
                              />
                              
                              {/* Hover Controls */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePreviewReferenceImage(refImage)
                                  }}
                                  className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
                                  title="Preview image"
                                >
                                  <Eye className="h-4 w-4 text-secondary-700" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteReferenceImage(refImage)
                                  }}
                                  className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
                                  title="Delete image"
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </button>
                              </div>

                              {/* Primary Badge */}
                              {refImage.is_primary && (
                                <div className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                              
                              {/* Selected Indicator */}
                              {selectedReferenceImage?.id === refImage.id && (
                                <div className="absolute top-1 right-1">
                                  <div className="bg-primary-500 text-white rounded-full p-1 shadow-lg">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {selectedReferenceImage && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-medium text-primary-800 text-sm">Selected: {selectedReferenceImage.filename}</p>
                                <p className="text-xs text-primary-600">This image will be used for AI generation</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Generation Interface */}
              <div className="card mb-8">
                <div className="flex items-center mb-4">
                  <Wand2 className="h-5 w-5 text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Generate New Design
                  </h2>
                </div>

                {/* Reference Image Status */}
                <div className="mb-6">
                  {selectedReferenceImage ? (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedReferenceImage.image_url}
                          alt={selectedReferenceImage.filename}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-success-800">Reference Image Selected</p>
                          <p className="text-sm text-success-600">{selectedReferenceImage.filename}</p>
                          <p className="text-xs text-success-500">Ready to generate designs based on this image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium text-warning-800">No Reference Image Selected</p>
                          <p className="text-sm text-warning-600">Upload and select a reference image above to generate designs</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Describe your landscape design
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Modern outdoor kitchen with natural stone countertops, built-in grill, and surrounding garden beds..."
                    className="input-field h-24 resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* Generation Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Style
                    </label>
                    <select
                      value={generationParams.style}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, style: e.target.value as any }))}
                      className="input-field"
                      disabled={isGenerating}
                    >
                      <option value="photorealistic">Photorealistic</option>
                      <option value="3d-render">3D Render</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      View Angle
                    </label>
                    <select
                      value={generationParams.viewAngle}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, viewAngle: e.target.value as any }))}
                      className="input-field"
                      disabled={isGenerating}
                    >
                      <option value="ground-level">Ground Level</option>
                      <option value="elevated">Elevated</option>
                      <option value="aerial">Aerial</option>
                      <option value="birds-eye">Bird's Eye</option>
                      <option value="same-as-image">Same as Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Season
                    </label>
                    <select
                      value={generationParams.season}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, season: e.target.value as any }))}
                      className="input-field"
                      disabled={isGenerating}
                    >
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !prompt.trim() || !selectedReferenceImage}
                  className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!selectedReferenceImage ? "Please upload and select a reference image first" : ""}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Design
                    </>
                  )}
                </button>
                
                {!selectedReferenceImage && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Reference image required to generate designs
                  </p>
                )}
              </div>



              {/* Generated Images */}
              <div className="card">
                <div className="flex items-center mb-4">
                  <ImageIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Generated Designs
                  </h2>
                </div>
                
                {images.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                    <p className="text-secondary-500">
                      No designs generated yet. Create your first design above!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image) => (
                      <div 
                        key={image.id} 
                        className="bg-white rounded-lg border border-secondary-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleImageClick(image)}
                      >
                        <div className="relative">
                          <img
                            src={image.image_url}
                            alt={image.prompt}
                            className="w-full h-48 object-cover"
                          />
                          {image.is_favorite && (
                            <div className="absolute top-2 right-2 bg-warning-500 text-white p-1 rounded-full">
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-secondary-600 line-clamp-3">
                            {image.prompt}
                          </p>
                          <div className="mt-2 text-xs text-secondary-400">
                            {new Date(image.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Leaf className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">
                Select a project to start generating designs
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Johnson Family Backyard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Brief description of the project..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, client_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Johnson Family"
                />
              </div>
              
                              <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newProject.client_email}
                    onChange={(e) => setNewProject(prev => ({ ...prev, client_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="client@example.com"
                  />
                </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateProject(false)
                  setNewProject({
                    title: '',
                    description: '',
                    client_name: '',
                    client_email: ''
                  })
                }}
                className="px-4 py-2 text-secondary-600 hover:text-secondary-800 transition-colors"
                disabled={isCreatingProject}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.title.trim() || isCreatingProject}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isCreatingProject && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isCreatingProject ? 'Creating...' : 'Create Project'}</span>
              </button>
            </div>
                     </div>
         </div>
       )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold">Generated Design</h3>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedImage(null)
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Image */}
              <div className="flex-1 p-4">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* Details & Actions */}
              <div className="lg:w-80 p-4 border-l border-secondary-200">
                <div className="space-y-4">
                  {/* Prompt */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Prompt</h4>
                    <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                      {selectedImage.prompt}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Created</h4>
                    <p className="text-sm text-secondary-600">
                      {new Date(selectedImage.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-secondary-200">
                    {/* Download */}
                    <button
                      onClick={() => handleDownloadImage(selectedImage)}
                      className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Image</span>
                    </button>

                    {/* Favorite */}
                    <button
                      onClick={() => handleToggleFavorite(selectedImage)}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedImage.is_favorite
                          ? 'bg-warning-100 text-warning-800 hover:bg-warning-200'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${selectedImage.is_favorite ? 'fill-current' : ''}`} />
                      <span>{selectedImage.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteImage(selectedImage)}
                      className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Image</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
                     </div>
         </div>
       )}

      {/* Reference Image Preview Modal */}
      {showReferenceModal && previewReferenceImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold">Reference Image Preview</h3>
              <button
                onClick={() => {
                  setShowReferenceModal(false)
                  setPreviewReferenceImage(null)
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Image */}
              <div className="flex-1 p-4">
                <img
                  src={previewReferenceImage.image_url}
                  alt={previewReferenceImage.filename}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* Details & Actions */}
              <div className="lg:w-80 p-4 border-l border-secondary-200">
                <div className="space-y-4">
                  {/* Filename */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Filename</h4>
                    <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                      {previewReferenceImage.filename}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewReferenceImage.is_primary && (
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          Primary Image
                        </span>
                      )}
                      {selectedReferenceImage?.id === previewReferenceImage.id && (
                        <span className="bg-success-100 text-success-800 text-xs px-2 py-1 rounded-full">
                          Selected for Generation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload Date */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Uploaded</h4>
                    <p className="text-sm text-secondary-600">
                      {new Date(previewReferenceImage.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-secondary-200">
                    {/* Select for Generation */}
                    {selectedReferenceImage?.id !== previewReferenceImage.id && (
                      <button
                        onClick={() => {
                          setSelectedReferenceImage(previewReferenceImage)
                          setShowReferenceModal(false)
                          setPreviewReferenceImage(null)
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Select for Generation</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setShowReferenceModal(false)
                        setPreviewReferenceImage(null)
                        handleDeleteReferenceImage(previewReferenceImage)
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Image</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 