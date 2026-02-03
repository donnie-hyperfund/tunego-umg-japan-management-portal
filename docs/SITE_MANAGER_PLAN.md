# Site Manager Implementation Plan

## Overview

This document outlines the plan for adding a Site Manager to the TuneGO Management Portal. The Site Manager will allow non-technical users to create and deploy artist campaign sites (like the King & Prince, Yorushika, and People1 examples) to Vercel with minimal coding knowledge.

## Current State Analysis

### Reference Sites Pattern
Based on the example sites at:
- `https://design.tunego.com/umj/king-and-prince-prototype/index.html`
- `https://design.tunego.com/yorushika/index.html`
- `https://design.tunego.com/people1/index.html`

**Common Elements:**
1. **Hero Section**: Artist/band name, campaign title, and description
2. **Rich Content**: Text descriptions, images, videos
3. **Email Signup**: Universal Music newsletter subscription form
4. **3D Collectible Cards**: Optional card claiming functionality (from reference Next.js project)
5. **Responsive Design**: Mobile-first approach

### Reference Next.js Project
Located at `~/code/tunego/tunego-live-events-nextjs`, this project demonstrates:
- Next.js 15 with App Router
- Clerk authentication
- 3D card rendering with LaxxView
- Card manifest system (JSON-based configuration)
- Geofence-based claiming
- Database schema for cards and user cards

## Architecture Proposal

### 1. Database Schema Extensions

Add the following tables to support campaign sites:

```typescript
// Campaign Sites
campaignSites {
  id: uuid (PK)
  name: string (unique) // e.g., "king-and-prince-2025"
  displayName: string // e.g., "King & Prince と打ち上げ花火 2025"
  slug: string (unique) // URL-friendly identifier
  status: enum ['draft', 'published', 'archived']
  templateId: uuid (FK -> siteTemplates)
  vercelProjectId: string // Vercel project ID after deployment
  vercelDeploymentUrl: string // Live URL
  createdBy: uuid (FK -> users)
  createdAt: timestamp
  updatedAt: timestamp
}

// Site Templates (predefined templates)
siteTemplates {
  id: uuid (PK)
  name: string // e.g., "collectible-campaign"
  description: string
  templatePath: string // Path to template files
  isActive: boolean
}

// Campaign Site Content (CMS content)
campaignSiteContent {
  id: uuid (PK)
  siteId: uuid (FK -> campaignSites)
  section: string // 'hero', 'description', 'cards', 'signup'
  contentType: enum ['text', 'richText', 'image', 'video', 'cardManifest']
  content: jsonb // Flexible content storage
  order: integer
  isVisible: boolean
}

// Campaign Assets (images, videos, etc.)
campaignAssets {
  id: uuid (PK)
  siteId: uuid (FK -> campaignSites)
  type: enum ['image', 'video', 'audio', 'document']
  url: string // CDN URL or storage path
  filename: string
  mimeType: string
  size: integer
  uploadedBy: uuid (FK -> users)
  uploadedAt: timestamp
}

// Card Manifests (for 3D collectible cards)
cardManifests {
  id: uuid (PK)
  siteId: uuid (FK -> campaignSites)
  name: string
  manifest: jsonb // Card manifest JSON structure
  cardImageUrl: string // Preview image
  isActive: boolean
}
```

### 2. CMS Recommendation: Payload CMS

**Why Payload:**
- ✅ You've used it before (familiarity)
- ✅ Self-hosted (full control)
- ✅ TypeScript-first (matches your stack)
- ✅ Flexible content modeling
- ✅ File upload handling built-in
- ✅ REST and GraphQL APIs
- ✅ Admin UI out of the box
- ✅ Can be embedded in Next.js app

**Alternative Consideration:**
- **Sanity**: Excellent for content, but external service
- **Strapi**: Good alternative, but more complex setup
- **Direct Database + Custom UI**: More control, but more development time

**Payload Integration Approach:**
- Embed Payload admin in `/admin` route of the portal
- Use Payload collections for:
  - Campaign Sites
  - Site Content
  - Assets (with S3/Vercel Blob storage)
  - Card Manifests
- Portal UI can consume Payload API or directly query database

### 3. Site Builder UI Components

Create a visual site builder in the portal with:

**Main Components:**
1. **Site List View** (`/sites`)
   - Table/grid of all campaign sites
   - Status indicators (draft/published)
   - Quick actions (edit, preview, deploy, archive)
   - Filter by status, template, date

2. **Site Editor** (`/sites/[id]/edit`)
   - Tabbed interface:
     - **General**: Name, slug, template selection
     - **Content**: Visual editor for each section
     - **Assets**: Upload and manage media
     - **Cards**: Manage 3D card manifests
     - **Settings**: Vercel deployment config
   - Live preview pane (iframe or component preview)
   - Save as draft / Publish buttons

3. **Content Section Editors**:
   - **Hero Editor**: Title, subtitle, background image/video
   - **Rich Text Editor**: WYSIWYG for descriptions
   - **Media Gallery**: Image/video picker
   - **Card Manifest Editor**: JSON editor with validation + visual preview
   - **Signup Form Editor**: Email form configuration

4. **Template Selector**:
   - Show available templates
   - Preview template
   - Template-specific configuration options

### 4. Template System

**Template Structure:**
```
templates/
  collectible-campaign/
    template.json          # Template metadata
    page.tsx              # Main page component
    components/           # Reusable components
    styles/              # Template-specific styles
    assets/              # Default assets
```

**Template Features:**
- Parameterized components (content injected from CMS)
- Configurable sections (enable/disable sections)
- Theme customization (colors, fonts)
- Responsive layouts

**Initial Templates:**
1. **collectible-campaign** (based on King & Prince reference)
   - Hero with video/image background
   - Rich text description
   - 3D card showcase
   - Email signup form
   
2. **simple-landing** (based on Yorushika/People1 pattern)
   - Hero section
   - Rich text content
   - Email signup form
   - No cards

### 5. Vercel Deployment Automation

**Deployment Flow:**
1. User clicks "Deploy to Vercel" in portal
2. Portal generates Next.js project structure:
   - Copies template files
   - Injects CMS content
   - Generates dynamic routes
   - Creates `vercel.json` config
3. Portal uses Vercel API to:
   - Create new Vercel project (or update existing)
   - Upload project files
   - Trigger deployment
   - Store deployment URL
4. Portal displays deployment status and URL

**Vercel API Integration:**
- Use `@vercel/node` SDK or REST API
- Store Vercel API token in environment variables
- Handle deployment webhooks for status updates
- Support preview deployments for drafts

**Project Structure Generation:**
```typescript
// Pseudo-code for deployment generation
async function generateSiteProject(siteId: string) {
  const site = await getCampaignSite(siteId);
  const template = await getTemplate(site.templateId);
  const content = await getSiteContent(siteId);
  
  // Generate Next.js app structure
  const projectFiles = {
    'package.json': generatePackageJson(site, template),
    'next.config.js': generateNextConfig(site),
    'src/app/page.tsx': generatePageComponent(site, template, content),
    'src/app/layout.tsx': generateLayout(site),
    'public/': copyAssets(site.assets),
    // ... other template files
  };
  
  return projectFiles;
}
```

**Deployment Options:**
- **Option A**: Generate and deploy as separate Vercel projects
  - Each site = separate Vercel project
  - Pros: Isolation, independent scaling
  - Cons: More projects to manage
  
- **Option B**: Monorepo with dynamic routes
  - Single Vercel project with `/campaigns/[slug]` routes
  - Pros: Easier management, shared resources
  - Cons: All sites deploy together

**Recommendation**: Start with Option A (separate projects) for flexibility, can migrate to Option B later if needed.

### 6. Asset Management

**Storage Options:**
1. **Vercel Blob Storage** (Recommended)
   - Integrated with Vercel
   - Easy to use
   - Good for images/videos
   
2. **AWS S3 / Cloudflare R2**
   - More control
   - Better for large files
   - Requires additional setup

3. **Public Folder** (for small sites)
   - Simple but limited
   - Files committed to repo

**Asset Upload Flow:**
- Portal provides upload UI
- Files uploaded to storage
- URLs stored in database
- Assets referenced in site content
- Assets copied to generated project during deployment

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Add database schema for campaign sites
- [ ] Set up Payload CMS (or decide on alternative)
- [ ] Create basic site list and detail pages
- [ ] Implement CRUD operations for sites

### Phase 2: Content Management (Week 3-4)
- [ ] Build content editor UI
- [ ] Implement section-based editing
- [ ] Add rich text editor
- [ ] Create asset upload functionality
- [ ] Build card manifest editor

### Phase 3: Template System (Week 5-6)
- [ ] Create template structure
- [ ] Build template selector
- [ ] Implement template rendering engine
- [ ] Create first template (collectible-campaign)
- [ ] Add template customization options

### Phase 4: Deployment (Week 7-8)
- [ ] Integrate Vercel API
- [ ] Build project generator
- [ ] Implement deployment flow
- [ ] Add deployment status tracking
- [ ] Create deployment webhook handler

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Add preview functionality
- [ ] Implement versioning/draft system
- [ ] Add error handling and validation
- [ ] Create user documentation
- [ ] Testing and bug fixes

## Technical Considerations

### Security
- Authentication: Use Clerk (already integrated)
- Authorization: Role-based access (admin vs. editor)
- API rate limiting for Vercel deployments
- Secure storage of Vercel API tokens

### Performance
- Cache generated project files
- Optimize asset loading
- Lazy load preview iframes
- Use CDN for assets

### Scalability
- Consider queue system for deployments (if many concurrent)
- Database indexing on frequently queried fields
- Asset storage optimization

### User Experience
- Auto-save drafts
- Undo/redo in editor
- Keyboard shortcuts
- Mobile-responsive admin UI
- Clear error messages

## Dependencies to Add

```json
{
  "payload": "^3.0.0", // If using Payload CMS
  "@vercel/node": "^3.0.0", // Vercel API client
  "react-quill": "^2.0.0", // Rich text editor
  "react-dropzone": "^14.0.0", // File uploads
  "zod": "^3.22.0", // Schema validation
  "react-json-view": "^2.0.0" // JSON editor for card manifests
}
```

## Questions to Resolve

1. **CMS Choice**: Confirm Payload CMS or prefer alternative?
2. **Deployment Strategy**: Separate projects (Option A) or monorepo (Option B)?
3. **Asset Storage**: Vercel Blob, S3, or other?
4. **Template Customization**: How much customization should non-technical users have?
5. **Card Functionality**: Should all sites support cards, or only specific templates?
6. **Domain Management**: Should users be able to set custom domains per site?

## Next Steps

1. Review and approve this plan
2. Resolve questions above
3. Set up development environment
4. Begin Phase 1 implementation
