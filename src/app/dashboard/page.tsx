'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Leaf, Plus, Wand2, Image as ImageIcon, Loader2, LogOut, Download, Heart, Trash2, X, Eye, Menu, MoreVertical } from 'lucide-react'
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
    client_email: '',
    status: 'draft' as 'draft' | 'in_progress' | 'completed' | 'archived'
  })

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [selectedImage, setSelectedImage] = useState<DesignImage | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [selectedReferenceImage, setSelectedReferenceImage] = useState<ReferenceImage | null>(null)
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [previewReferenceImage, setPreviewReferenceImage] = useState<ReferenceImage | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hoveredReferenceImage, setHoveredReferenceImage] = useState<string | null>(null)
  const [activeReferenceImage, setActiveReferenceImage] = useState<string | null>(null) // For mobile two-step interaction

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

  // Handle body scroll locking for mobile sidebar
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isSidebarOpen])

  // Reset active reference image when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-reference-image]')) {
        setActiveReferenceImage(null)
        setHoveredReferenceImage(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Handle body scroll locking for modals
  useEffect(() => {
    if (showImageModal || showReferenceModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showImageModal, showReferenceModal])

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
        client_email: '',
        status: 'draft'
      })
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
        if (selectedProject?.id === projectId) {
          setSelectedProject(null)
        }
        setIsSidebarOpen(false) // Close sidebar on mobile after deletion
      } else {
        console.error('Failed to delete project:', response.statusText)
        alert('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project')
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
    <div className="min-h-screen bg-dark-950">
      {/* Mobile-First Header */}
      <header className="bg-dark-900/95 backdrop-blur border-b border-dark-700 sticky top-0 z-40">
        <div className="mobile-container py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-light-300 hover:text-light-100 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/" className="flex items-center space-x-2">
                <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
                <span className="text-lg sm:text-xl font-bold text-light-100">ScapeAir</span>
              </Link>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-light-300 hover:text-light-100 hover:bg-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Mobile-First Collapsible Sidebar - Projects */}
        <aside className={`
          fixed lg:relative top-0 lg:top-0 left-0 h-screen lg:h-auto
          w-80 lg:w-80 bg-dark-900 lg:bg-dark-900/50 backdrop-blur 
          border-r border-dark-700 overflow-y-auto z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-3 sm:p-4 pt-6 lg:pt-3 sm:lg:pt-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-light-100">Projects</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    setShowCreateProject(true)
                    setIsSidebarOpen(false) // Close sidebar on mobile when opening modal
                  }}
                  className="p-2 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 text-light-300 hover:text-light-100 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-light-400">
                  <p className="mb-2">No projects yet</p>
                  <button
                    onClick={() => {
                      setShowCreateProject(true)
                      setIsSidebarOpen(false) // Close sidebar on mobile when opening modal
                    }}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                <>
                  {/* Active Projects (In Progress & Draft) */}
                  {projects.filter(p => p.status === 'in_progress' || p.status === 'draft').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-light-300 uppercase tracking-wider mb-2">
                        Current Projects
                      </h3>
                      <div className="space-y-1">
                        {projects
                          .filter(p => p.status === 'in_progress' || p.status === 'draft')
                          .sort((a, b) => a.status === 'in_progress' ? -1 : 1) // In progress first
                          .map((project) => (
                          <div
                            key={project.id}
                            className={`relative group rounded-lg transition-colors ${
                              selectedProject?.id === project.id
                                ? 'bg-primary-500/20 border-primary-400/50 border'
                                : 'hover:bg-dark-700/50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedProject(project)
                                setIsSidebarOpen(false) // Close sidebar on mobile when project is selected
                              }}
                              className="w-full text-left p-3"
                            >
                              <div className="font-medium text-light-100 truncate pr-8">
                                {project.title}
                              </div>
                              <div className="text-sm text-light-400 truncate">
                                {project.client_name}
                              </div>
                              <div className="flex items-center mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  project.status === 'in_progress' ? 'bg-primary-500/20 text-primary-400' :
                                  'bg-dark-600 text-light-300'
                                }`}>
                                  {project.status.replace('_', ' ')}
                                </span>
                              </div>
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                              className="absolute top-2 right-2 p-1 text-light-400 hover:text-error-400 hover:bg-error-500/20 rounded transition-all lg:opacity-0 lg:group-hover:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Completed Projects */}
                  {projects.filter(p => p.status === 'completed').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-light-300 uppercase tracking-wider mb-2">
                        Completed
                      </h3>
                      <div className="space-y-1">
                        {projects
                          .filter(p => p.status === 'completed')
                          .map((project) => (
                          <div
                            key={project.id}
                            className={`relative group rounded-lg transition-colors ${
                              selectedProject?.id === project.id
                                ? 'bg-primary-500/20 border-primary-400/50 border'
                                : 'hover:bg-dark-700/50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedProject(project)
                                setIsSidebarOpen(false) // Close sidebar on mobile when project is selected
                              }}
                              className="w-full text-left p-3"
                            >
                              <div className="font-medium text-light-100 truncate pr-8">
                                {project.title}
                              </div>
                              <div className="text-sm text-light-400 truncate">
                                {project.client_name}
                              </div>
                              <div className="flex items-center mt-2">
                                <span className="px-2 py-1 text-xs rounded-full bg-success-500/20 text-success-400">
                                  completed
                                </span>
                              </div>
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                              className="absolute top-2 right-2 p-1 text-light-400 hover:text-error-400 hover:bg-error-500/20 rounded transition-all lg:opacity-0 lg:group-hover:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Archived Projects */}
                  {projects.filter(p => p.status === 'archived').length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-light-300 uppercase tracking-wider mb-2">
                        Archived
                      </h3>
                      <div className="space-y-1">
                        {projects
                          .filter(p => p.status === 'archived')
                          .map((project) => (
                          <div
                            key={project.id}
                            className={`relative group rounded-lg transition-colors opacity-75 ${
                              selectedProject?.id === project.id
                                ? 'bg-primary-500/20 border-primary-400/50 border'
                                : 'hover:bg-dark-700/50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedProject(project)
                                setIsSidebarOpen(false) // Close sidebar on mobile when project is selected
                              }}
                              className="w-full text-left p-3"
                            >
                              <div className="font-medium text-light-100 truncate pr-8">
                                {project.title}
                              </div>
                              <div className="text-sm text-light-400 truncate">
                                {project.client_name}
                              </div>
                              <div className="flex items-center mt-2">
                                <span className="px-2 py-1 text-xs rounded-full bg-dark-600 text-light-300">
                                  archived
                                </span>
                              </div>
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                              className="absolute top-2 right-2 p-1 text-light-400 hover:text-error-400 hover:bg-error-500/20 rounded transition-all lg:opacity-0 lg:group-hover:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:ml-0">
          {selectedProject ? (
            <div className="max-w-4xl mx-auto">
              {/* Project Header */}
              <div className="mb-8">
                <div className="flex flex-col space-y-6">
                  {/* Project Info */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-light-100">
                        {selectedProject.title}
                      </h1>
                      <select
                        value={selectedProject.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as any
                          try {
                            const response = await fetch(`/api/projects?id=${selectedProject.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            })
                            if (response.ok) {
                              setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null)
                              setProjects(prev => prev.map(p => 
                                p.id === selectedProject.id ? { ...p, status: newStatus } : p
                              ))
                            }
                          } catch (error) {
                            console.error('Failed to update status:', error)
                          }
                        }}
                        className={`mt-2 sm:mt-0 px-3 py-1 text-sm rounded-lg border transition-colors ${
                          selectedProject.status === 'completed' ? 'bg-success-500/20 text-success-400 border-success-500/30' :
                          selectedProject.status === 'in_progress' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' :
                          selectedProject.status === 'archived' ? 'bg-dark-600 text-light-300 border-dark-500' :
                          'bg-dark-700 text-light-300 border-dark-600'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <p className="text-light-300">
                      {selectedProject.description}
                    </p>
                    {selectedProject.client_name && (
                      <p className="text-sm text-light-400 mt-1">
                        Client: {selectedProject.client_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Reference Images Section */}
                  <div className="bg-dark-800/50 backdrop-blur border border-dark-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-light-100">Reference Images</h3>
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
                      <div className="text-center py-12 text-light-400 border-2 border-dashed border-dark-600 rounded-lg">
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
                              data-reference-image
                              className={`group relative rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                                selectedReferenceImage?.id === refImage.id
                                  ? 'border-primary-500 ring-2 ring-primary-200'
                                  : 'border-dark-600 hover:border-primary-300'
                              }`}
                              onMouseEnter={() => {
                                setHoveredReferenceImage(refImage.id)
                                setActiveReferenceImage(refImage.id) // Desktop: immediately active on hover
                              }}
                              onMouseLeave={() => {
                                setHoveredReferenceImage(null)
                                // Don't reset active on mouse leave for mobile compatibility
                              }}
                            >
                              <img
                                src={refImage.image_url}
                                alt={refImage.filename}
                                className="w-full h-24 object-cover cursor-pointer"
                                onClick={(e) => {
                                  if (hoveredReferenceImage !== refImage.id) {
                                    // First tap: show buttons (but they're not active yet)
                                    setHoveredReferenceImage(refImage.id)
                                  } else if (activeReferenceImage !== refImage.id) {
                                    // Second tap: make buttons active
                                    setActiveReferenceImage(refImage.id)
                                  } else {
                                    // Third tap or desktop: select the image
                                    setSelectedReferenceImage(refImage)
                                  }
                                }}
                              />
                              
                              {/* Hover/Touch Controls */}
                              <div className={`absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center space-x-2 ${
                                hoveredReferenceImage === refImage.id 
                                  ? activeReferenceImage === refImage.id 
                                    ? 'bg-opacity-50 opacity-100' // More overlay when active
                                    : 'bg-opacity-30 opacity-100' // Less overlay when just showing buttons
                                  : 'bg-opacity-0 opacity-0'
                              }`}>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (activeReferenceImage === refImage.id) {
                                      handlePreviewReferenceImage(refImage)
                                    }
                                  }}
                                  className={`rounded-full p-2 transition-all ${
                                    activeReferenceImage === refImage.id
                                      ? 'bg-light-100 bg-opacity-90 hover:bg-opacity-100 cursor-pointer'
                                      : 'bg-light-100 bg-opacity-60 cursor-default'
                                  }`}
                                  title={activeReferenceImage === refImage.id ? "Preview image" : "Tap image again to activate"}
                                >
                                  <Eye className="h-4 w-4 text-dark-700" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (activeReferenceImage === refImage.id) {
                                      handleDeleteReferenceImage(refImage)
                                    }
                                  }}
                                  className={`rounded-full p-2 transition-all ${
                                    activeReferenceImage === refImage.id
                                      ? 'bg-red-500 bg-opacity-90 hover:bg-opacity-100 cursor-pointer'
                                      : 'bg-red-500 bg-opacity-60 cursor-default'
                                  }`}
                                  title={activeReferenceImage === refImage.id ? "Delete image" : "Tap image again to activate"}
                                >
                                  <Trash2 className="h-4 w-4 text-dark-900" />
                                </button>
                              </div>

                              {/* Primary Badge */}
                              {refImage.is_primary && (
                                <div className="absolute top-1 left-1 bg-primary-500 text-dark-900 text-xs px-2 py-1 rounded font-medium">
                                  Primary
                                </div>
                              )}
                              
                              {/* Selected Indicator */}
                              {selectedReferenceImage?.id === refImage.id && (
                                <div className="absolute top-1 right-1">
                                  <div className="bg-primary-500 text-dark-900 rounded-full p-1 shadow-lg">
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
                  <h2 className="text-xl font-semibold text-light-100">
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
                    <div className="border-2 border-dashed border-primary-500/30 rounded-lg p-6 text-center bg-primary-500/5">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-light-200">Select a Reference Image</p>
                          <p className="text-sm text-light-400 mt-1">Choose from your uploaded images above to start generating</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-light-200 mb-2">
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
                        className="bg-dark-800/50 backdrop-blur rounded-lg border border-dark-700 overflow-hidden cursor-pointer hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all"
                        onClick={() => handleImageClick(image)}
                      >
                        <div className="relative">
                          <img
                            src={image.image_url}
                            alt={image.prompt}
                            className="w-full h-48 object-cover"
                          />
                          {image.is_favorite && (
                            <div className="absolute top-2 right-2 bg-warning-500 text-dark-900 p-1 rounded-full">
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-light-300 line-clamp-3">
                            {image.prompt}
                          </p>
                          <div className="mt-2 text-xs text-light-400">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-light-100">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-light-200 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Johnson Family Backyard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-200 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Brief description of the project..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-200 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, client_name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Johnson Family"
                />
              </div>
              
                              <div>
                  <label className="block text-sm font-medium text-light-200 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newProject.client_email}
                    onChange={(e) => setNewProject(prev => ({ ...prev, client_email: e.target.value }))}
                    className="input-field"
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-light-200 mb-1">
                    Project Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
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
                    client_email: '',
                    status: 'draft'
                  })
                }}
                className="px-4 py-2 text-light-300 hover:text-light-100 transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-4xl w-full">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-light-100">Generated Design</h3>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedImage(null)
                  }}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-light-300 hover:text-light-100"
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
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>

                {/* Details & Actions */}
                <div className="lg:w-80 p-4 border-t lg:border-t-0 lg:border-l border-dark-700">
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
        </div>
      )}

      {/* Reference Image Preview Modal */}
      {showReferenceModal && previewReferenceImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-4xl w-full">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-light-100">Reference Image Preview</h3>
                <button
                  onClick={() => {
                    setShowReferenceModal(false)
                    setPreviewReferenceImage(null)
                  }}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-light-300 hover:text-light-100"
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
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>

                {/* Details & Actions */}
                <div className="lg:w-80 p-4 border-t lg:border-t-0 lg:border-l border-dark-700">
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
        </div>
      )}
    </div>
  )
} 