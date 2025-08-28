# ScapeAir - AI-Powered Landscape Design Visualization

ScapeAir is a modern web application that enables landscapers and hardscapers to create stunning 3D design visualizations using Google's Gemini AI. Generate professional-quality landscape designs in seconds, not hours.

## Features

- 🤖 **AI-Powered Generation**: Leverage Google's Gemini 2.0 Flash for intelligent 3D landscape design
- 🎨 **Professional Visualizations**: Generate photorealistic, 3D rendered, or architectural style images
- 📱 **Mobile-First Design**: Fully responsive interface optimized for mobile devices
- 🔐 **Secure Authentication**: Clerk-powered user management and authentication
- 💾 **Cloud Storage**: Supabase integration for database and file storage
- 🏗️ **Project Management**: Organize designs by client projects
- ⚡ **Fast Deployment**: Ready for Vercel deployment with optimized performance

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: Google Gemini 2.0 Flash API
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom design system

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Accounts for:
  - [Clerk](https://clerk.com) (authentication)
  - [Supabase](https://supabase.com) (database & storage)
  - [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini API key)

### 1. Clone and Install

```bash
git clone <repository-url>
cd scapeair
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase (only need these two with SSR pattern)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Google Gemini API
GEMINI_API_KEY=AIza...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies as defined in the schema

### 4. Authentication Setup

1. Create a Clerk application
2. Configure OAuth providers (optional)
3. Set up webhooks for user synchronization (optional)

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment

### Vercel Deployment

1. **Connect Repository**: Import your project to Vercel
2. **Environment Variables**: Add all environment variables from `.env.local`
3. **Build Settings**: Vercel will auto-detect Next.js settings
4. **Deploy**: Click deploy!

### Environment Variables for Production

Set these in your Vercel dashboard:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Architecture

### Project Structure

```
scapeair/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── sign-in/        # Authentication pages
│   │   └── sign-up/
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility libraries
│   │   ├── gemini.ts      # AI service
│   │   ├── supabase.ts    # Database client
│   │   └── storage.ts     # File storage
│   └── types/             # TypeScript type definitions
├── supabase/              # Database schema
└── public/                # Static assets
```

### Key Services

- **Gemini Service** (`src/lib/gemini.ts`): Handles AI image generation with landscape-specific prompts
- **Storage Service** (`src/lib/storage.ts`): Manages image uploads to Supabase Storage
- **Supabase SSR** (`src/utils/supabase/`): Modern SSR-compatible database operations with automatic session handling

## Usage Guide

### For Landscapers

1. **Sign Up**: Create an account using email or OAuth
2. **Create Project**: Start a new project for a client
3. **Generate Designs**: Use natural language to describe your vision
4. **Customize Parameters**: Adjust style, season, view angle, and weather
5. **Save & Share**: All designs are automatically saved to your project

### Prompt Engineering Tips

- Be specific about materials: "natural stone", "composite decking", "drought-resistant plants"
- Include spatial relationships: "curved pathway leading to", "tiered garden beds surrounding"
- Specify style preferences: "modern minimalist", "traditional English garden", "Mediterranean style"
- Mention practical elements: "proper drainage", "maintenance access", "irrigation considerations"

## API Reference

### Generate Image

```typescript
POST /api/generate-image
{
  "projectId": "string",
  "prompt": "string",
  "style": "photorealistic" | "3d-render" | "architectural" | "artistic",
  "viewAngle": "aerial" | "ground-level" | "elevated" | "birds-eye",
  "season": "spring" | "summer" | "fall" | "winter",
  "timeOfDay": "morning" | "afternoon" | "evening" | "golden-hour",
  "weatherCondition": "sunny" | "cloudy" | "overcast" | "dramatic-sky"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@scapeair.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced editing tools
- [ ] Client collaboration features
- [ ] Integration with design software (AutoCAD, SketchUp)
- [ ] Cost estimation features
- [ ] Plant identification and suggestions
- [ ] Weather-based design recommendations 