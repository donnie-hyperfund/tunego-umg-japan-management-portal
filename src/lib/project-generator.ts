import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { campaignSites, campaignSiteContent, campaignAssets, cardManifests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface GeneratedProject {
  files: Record<string, string | Buffer>;
  packageJson: any;
  vercelJson: any;
}

export async function generateProject(siteId: string): Promise<GeneratedProject> {
  // Fetch site data
  const [site] = await db
    .select()
    .from(campaignSites)
    .where(eq(campaignSites.id, siteId))
    .limit(1);

  if (!site) {
    throw new Error('Site not found');
  }

  // Fetch template
  const templateId = site.templateId;
  if (!templateId) {
    throw new Error('Site has no template assigned');
  }

  // Fetch content
  const content = await db
    .select()
    .from(campaignSiteContent)
    .where(eq(campaignSiteContent.siteId, siteId))
    .orderBy(campaignSiteContent.order);

  // Fetch assets
  const assets = await db
    .select()
    .from(campaignAssets)
    .where(eq(campaignAssets.siteId, siteId));

  // Fetch card manifests
  const cards = await db
    .select()
    .from(cardManifests)
    .where(eq(cardManifests.siteId, siteId));

  // Get template name
  const { siteTemplates } = await import('@/lib/db/schema');
  const [template] = await db
    .select()
    .from(siteTemplates)
    .where(eq(siteTemplates.id, templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  const templateName = template.name;

  // Generate project files based on template
  return generateCollectibleCampaignProject(site, content, assets, cards, templateName);
}

async function generateCollectibleCampaignProject(
  site: any,
  content: any[],
  assets: any[],
  cards: any[],
  templateName: string
): Promise<GeneratedProject> {
  // Organize content by section
  const contentBySection = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort each section by order
  Object.keys(contentBySection).forEach(section => {
    contentBySection[section].sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  });

  // Get hero content - handle both hero content type and legacy text content type
  let heroContent: any = {};
  const heroSection = contentBySection.hero?.[0];
  if (heroSection) {
    if (heroSection.contentType === 'hero' || heroSection.contentType === 'text') {
      heroContent = heroSection.content || {};
    } else {
      heroContent = heroSection.content || {};
    }
  }
  
  const descriptionContent = contentBySection.description || [];
  // Use cardManifests from database, not contentBySection.cards
  // Filter to only active cards and get the first one
  const activeCards = cards.filter((card: any) => card.isActive);
  const cardContent = activeCards.length > 0 ? (() => {
    const activeCard = activeCards[0];
    // Derive media types from URLs
    const frontMediaType = activeCard.frontImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image";
    const backMediaType = activeCard.backImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image";
    
    return [{
      id: activeCard.id,
      content: {
        cardImageUrl: activeCard.cardImageUrl || activeCard.frontImageUrl,
        frontImageUrl: activeCard.frontImageUrl,
        backImageUrl: activeCard.backImageUrl,
        frontMediaType: frontMediaType,
        backMediaType: backMediaType,
        flipEnabled: activeCard.manifest?.interactions?.flipEnabled !== false,
      }
    }];
  })() : [];
  const signupContent = contentBySection.signup?.[0]?.content || {};

  // Generate package.json (conditionally include Clerk dependencies)
  const dependencies: Record<string, string> = {
    'next': '^15.5.4',
    'react': '19.1.4',
    'react-dom': '19.1.4',
  };

  // Only include Clerk if user management is enabled
  if (site.enableUserManagement) {
    dependencies['@clerk/nextjs'] = '^6.32.0';
    dependencies['@clerk/themes'] = '^2.4.30';
  }

  const packageJson = {
    name: site.name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      ...dependencies,
      // Tailwind v4 needs these in dependencies for PostCSS processing
      'tailwindcss': '^4',
      '@tailwindcss/postcss': '^4',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      'eslint': '^9',
      'eslint-config-next': '15.5.4',
      'typescript': '^5',
    },
  };

  // Generate next.config.ts
  const nextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: [],
    unoptimized: true,
  },
};

export default nextConfig;
`;

  // Generate vercel.json
  const vercelJson = {
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    installCommand: 'npm install',
    framework: 'nextjs',
  };

  // Generate page.tsx
  const backgroundColor = site.backgroundColor || '#000000';
  const textColor = site.textColor || '#FFFFFF';
  const pageContent = generatePageComponent(heroContent, descriptionContent, cardContent, signupContent, backgroundColor, textColor);

  // Generate layout.tsx (conditionally include Clerk based on enableUserManagement)
  const clerkProvider = site.enableUserManagement 
    ? `import { ClerkProvider } from "@clerk/nextjs";`
    : '';
  
  const clerkWrapper = site.enableUserManagement
    ? `<ClerkProvider>
      {children}
    </ClerkProvider>`
    : '{children}';

  const layoutContent = `import type { Metadata } from "next";
${clerkProvider}
import "./globals.css";

export const metadata: Metadata = {
  title: "${site.displayName}",
  description: "Campaign site for ${site.displayName}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        ${clerkWrapper}
      </body>
    </html>
  );
}
`;

  // Generate globals.css
  const globalsCss = `@import "tailwindcss";

:root {
  --tunego-primary: #00A0FF;
  --tunego-primary-hover: #0088DD;
  --tunego-neutral-95: #060606;
  --tunego-neutral-90: #0F0F0F;
  --tunego-neutral-80: #1A1A1A;
  --tunego-neutral-10: #CCCCCC;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: "Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--tunego-neutral-95);
  color: var(--tunego-neutral-10);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

  // Generate tsconfig.json
  const tsconfigJson = {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  // Generate postcss.config.mjs
  // Using object format for plugins to ensure compatibility with Next.js 15
  const postcssConfig = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;

  // Generate .gitignore
  const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

  // Generate README.md with developer instructions
  const readme = generateDeveloperReadme(site);

  // Generate .env.example file (only include Clerk if user management is enabled)
  const envExample = site.enableUserManagement
    ? `# Clerk Authentication (REQUIRED)
# Get your keys from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Note: For Vercel deployments, set these in:
# Vercel Dashboard → Project Settings → Environment Variables
`
    : `# No environment variables required for this site.
# This is a marketing-only campaign without user management.
`;

  const files: Record<string, string> = {
    'package.json': JSON.stringify(packageJson, null, 2),
    'next.config.ts': nextConfig,
    'postcss.config.mjs': postcssConfig,
    'vercel.json': JSON.stringify(vercelJson, null, 2),
    'tsconfig.json': JSON.stringify(tsconfigJson, null, 2),
    '.gitignore': gitignore,
    '.env.example': envExample,
    'README.md': readme,
    'src/app/page.tsx': pageContent,
    'src/app/layout.tsx': layoutContent,
    'src/app/globals.css': globalsCss,
  };

  return {
    files,
    packageJson,
    vercelJson,
  };
}

function generatePageComponent(
  heroContent: any,
  descriptionContent: any[],
  cardContent: any[],
  signupContent: any,
  backgroundColor: string = '#000000',
  textColor: string = '#FFFFFF'
): string {
  // Helper function to safely stringify values for JSX
  const jsxValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    return JSON.stringify(value);
  };

  // Generate description content rendering
  const descriptionRendering = descriptionContent
    .map((desc, index) => {
      const key = desc.id || `desc-${index}`;
      if (desc.contentType === 'richText' && desc.content?.html) {
        return `            <div
              key={${jsxValue(key)}}
              className="text-sm xl:text-base mb-4"
              style={{ color: ${jsxValue(textColor)} }}
              dangerouslySetInnerHTML={{ __html: ${jsxValue(desc.content.html)} }}
            />`;
      } else if (desc.contentType === 'text' && desc.content?.text) {
        return `            <p key={${jsxValue(key)}} className="text-sm xl:text-base mb-4" style={{ color: ${jsxValue(textColor)} }}>
              {${jsxValue(desc.content.text)}}
            </p>`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  const cardData = cardContent[0]?.content || {};
  const cardImageUrl = cardData.cardImageUrl || cardData.frontImageUrl;
  const backImageUrl = cardData.backImageUrl;
  const frontMediaType = cardData.frontMediaType || (cardImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");
  const backMediaType = cardData.backMediaType || (backImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");
  const hasCard = cardContent.length > 0;
  const hasFlip = backImageUrl && cardData.flipEnabled !== false;

  return `"use client";

import { useState } from 'react';

// Card component that handles aspect ratio detection for videos
function CardComponent({
  cardImageUrl,
  backImageUrl,
  frontMediaType,
  backMediaType,
  hasFlip,
}: {
  cardImageUrl?: string;
  backImageUrl?: string;
  frontMediaType: string;
  backMediaType: string;
  hasFlip: boolean;
}) {
  const [frontAspectRatio, setFrontAspectRatio] = useState<number | null>(null);
  const [backAspectRatio, setBackAspectRatio] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Default to portrait aspect ratio if not detected
  const frontAR = frontAspectRatio || 1.4; // Default 700/500 = 1.4 (portrait)
  const backAR = backAspectRatio || frontAR; // Use front as fallback for back

  // Calculate base dimensions for front side
  const maxWidth = 280;
  const frontIsLandscape = frontAR < 1;
  const frontWidth = frontIsLandscape ? maxWidth * (1 / frontAR) : maxWidth;
  const frontHeight = maxWidth * frontAR;
  const frontArea = frontWidth * frontHeight;

  // Calculate dimensions for back side that maintain the same area
  // Given: area = width * height, and AR = height/width
  // So: area = width * (AR * width) = AR * width^2
  // Therefore: width = sqrt(area / AR), height = AR * width
  const backWidth = Math.sqrt(frontArea / backAR);
  const backHeight = backAR * backWidth;

  // Use dimensions based on which side is showing, maintaining the same area
  const cardWidth = isFlipped ? backWidth : frontWidth;
  const cardHeight = isFlipped ? backHeight : frontHeight;

  if (!cardImageUrl) {
    return (
      <div className="flex justify-center xl:my-auto w-full xl:w-auto xl:max-w-sm order-1 xl:order-2 pt-4 xl:pt-0">
        <div className="w-full max-w-[280px] xl:max-w-none h-[400px] bg-[#1A1A1A] border border-[#333333] rounded-lg flex items-center justify-center text-[#8A8A8A]">
          Card Preview
        </div>
      </div>
    );
  }

  if (hasFlip) {
    // Calculate tilt angle based on hover state
    const tiltAngle = isHovered ? 15 : 0;
    
    return (
      <div className="flex justify-center xl:my-auto w-full xl:w-auto xl:max-w-sm order-1 xl:order-2 pt-4 xl:pt-0">
        <div
          className="relative transition-all duration-500 cursor-pointer"
          style={{
            perspective: "1000px",
            width: \`\${cardWidth}px\`,
            height: \`\${cardHeight}px\`,
            transform: \`rotateX(\${tiltAngle * 0.1}deg) rotateZ(\${tiltAngle * 0.05}deg)\`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front Face */}
            <div
              className="absolute inset-0 w-full h-full rounded-lg border-2 border-[#333333] overflow-hidden shadow-lg transition-colors duration-300"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
                borderColor: isHovered ? "#00A0FF" : "#333333",
              }}
            >
              ${frontMediaType === "video" ? `
              <video
                src={cardImageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  if (video.videoWidth && video.videoHeight) {
                    setFrontAspectRatio(video.videoHeight / video.videoWidth);
                  }
                }}
              />` : `
              <img
                src={cardImageUrl}
                alt="Collectible Card Front"
                className="w-full h-full object-cover"
              />`}
            </div>
            ${backImageUrl ? `/* Back Face */
            <div
              className="absolute inset-0 w-full h-full rounded-lg border-2 border-[#333333] overflow-hidden shadow-lg transition-colors duration-300"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderColor: isHovered ? "#00A0FF" : "#333333",
              }}
            >
              ${backMediaType === "video" ? `
              <video
                src={backImageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  if (video.videoWidth && video.videoHeight) {
                    setBackAspectRatio(video.videoHeight / video.videoWidth);
                  }
                }}
              />` : `
              <img
                src={backImageUrl}
                alt="Collectible Card Back"
                className="w-full h-full object-cover"
              />`}
            </div>` : ''}
          </div>
        </div>
      </div>
    );
  }

  // Simple card without flip
  const [isHoveredSimple, setIsHoveredSimple] = useState(false);
  const tiltAngleSimple = isHoveredSimple ? 15 : 0;
  
  return (
    <div className="flex justify-center xl:my-auto w-full xl:w-auto xl:max-w-sm order-1 xl:order-2 pt-4 xl:pt-0">
      <div
        className="relative transition-all duration-500 cursor-grab"
        style={{
          transform: \`rotateX(\${tiltAngleSimple * 0.1}deg) rotateZ(\${tiltAngleSimple * 0.05}deg)\`,
        }}
        onMouseEnter={() => setIsHoveredSimple(true)}
        onMouseLeave={() => setIsHoveredSimple(false)}
      >
        ${frontMediaType === "video" ? `
        <video
          src={cardImageUrl}
          autoPlay
          loop
          muted
          playsInline
          className="border border-[#333333] duration-300 w-full max-w-[280px] xl:max-w-none rounded-lg transition-colors"
          style={{
            borderColor: isHoveredSimple ? "#00A0FF" : "#333333",
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            if (video.videoWidth && video.videoHeight) {
              setFrontAspectRatio(video.videoHeight / video.videoWidth);
            }
          }}
        />` : `
        <img
          src={cardImageUrl}
          alt="Collectible Card"
          className="border border-[#333333] duration-300 w-full max-w-[280px] xl:max-w-none transition-colors"
          style={{
            borderColor: isHoveredSimple ? "#00A0FF" : "#333333",
          }}
        />`}
      </div>
    </div>
  );
}

export default function Home() {
  // Hero content
  const heroContent = {
    title: ${jsxValue(heroContent.title)},
    backgroundVideo: ${jsxValue(heroContent.backgroundVideo)},
    backgroundImage: ${jsxValue(heroContent.backgroundImage)},
    ctaText: ${jsxValue(heroContent.ctaText)},
    ctaLink: ${jsxValue(heroContent.ctaLink)},
  };

  // Signup content
  const signupContent = {
    enabled: ${signupContent.enabled ? 'true' : 'false'},
    placeholder: ${jsxValue(signupContent.placeholder || 'Enter your email')},
    buttonText: ${jsxValue(signupContent.buttonText || 'Subscribe')},
  };

  const backgroundColorValue = ${jsxValue(backgroundColor)};
  const textColorValue = ${jsxValue(textColor)};

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: backgroundColorValue }}>
      {/* Video Background */}
      {heroContent.backgroundVideo && (
        <div 
          className="fixed top-0 left-0 w-full min-h-screen opacity-80 z-0"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100vh',
            minHeight: '100vh', 
            opacity: 0.8, 
            zIndex: 0,
            pointerEvents: 'none'
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={heroContent.backgroundVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Background Image Overlay */}
      {heroContent.backgroundImage && !heroContent.backgroundVideo && (
        <div
          className="fixed top-0 left-0 w-full min-h-screen bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: 'url(' + heroContent.backgroundImage + ')' }}
        />
      )}

      {/* Main Content */}
      <div 
        className="relative w-full min-h-screen flex flex-col xl:flex-row xl:h-screen p-4 xl:p-8 z-10"
        style={{ 
          position: 'relative', 
          zIndex: 10
        }}
      >
        <div className="flex flex-col xl:flex-row xl:m-auto gap-8 xl:gap-20 w-full max-w-7xl mx-auto">
          {/* Card - shown first on mobile, on right on desktop */}
          ${hasCard ? `
          <CardComponent
            cardImageUrl={${jsxValue(cardImageUrl)}}
            backImageUrl={${jsxValue(backImageUrl)}}
            frontMediaType={${jsxValue(frontMediaType)}}
            backMediaType={${jsxValue(backMediaType)}}
            hasFlip={${hasFlip ? 'true' : 'false'}}
          />
          ` : ''}

          {/* Text Content - shown third on mobile, on left on desktop */}
          <div className="my-auto w-full max-w-3xl order-3 xl:order-1">
            {heroContent.title && (
              <h1 className="text-4xl xl:text-6xl leading-tight mb-6 xl:mb-8 font-bold" style={{ color: textColorValue }}>
                {heroContent.title}
              </h1>
            )}
            
${descriptionRendering || ''}

            {/* CTA Button */}
            {heroContent.ctaText && heroContent.ctaLink && (
              <div className="mt-6 xl:mt-8" style={{ marginTop: '1.5rem' }}>
                <a
                  href={heroContent.ctaLink}
                  className="inline-block px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#00A0FF',
                    color: '#ffffff',
                    fontWeight: '500',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {heroContent.ctaText}
                </a>
              </div>
            )}

            {/* Email Signup Form */}
            {signupContent.enabled && (
              <div className="mt-8">
                <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => { e.preventDefault(); }}>
                  <input
                    type="email"
                    placeholder={signupContent.placeholder}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
                  >
                    {signupContent.buttonText}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

function generateDeveloperReadme(site: any): string {
  return `# ${site.displayName}

This project was generated by the TuneGO Management Portal.

## Developer Instructions

### Getting Started

1. **Clone this repository** (if you haven't already):
   \`\`\`bash
   git clone <repository-url>
   cd ${site.name}
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**${site.enableUserManagement ? ' (REQUIRED)' : ' (OPTIONAL)'}:
   
   ${site.enableUserManagement ? `**For local development:**
   Create a \`.env.local\` file (copy from \`.env.example\`):
   \`\`\`
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   \`\`\`
   
   **For Vercel deployment (CRITICAL):**
   ⚠️ **You MUST set these environment variables in Vercel before deployment:**
   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   2. Add:
      - \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\` = Your Clerk publishable key
      - \`CLERK_SECRET_KEY\` = Your Clerk secret key
   3. **Without these, the build will fail!**` : `**Note:** This site does not include user management. No Clerk environment variables are required.`}

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

### Important Rules for Maintaining CMS Functionality

⚠️ **CRITICAL**: This site is managed by the TuneGO Management Portal. To maintain CMS functionality, follow these rules:

1. **DO NOT modify these files directly**:
   - \`src/app/page.tsx\` - This is generated from CMS content
   - \`src/app/layout.tsx\` - Core layout structure
   - \`package.json\` - Dependencies are managed by the portal

2. **SAFE to modify**:
   - \`src/app/globals.css\` - Custom styles (but be aware they may be overwritten on redeploy)
   - Create new components in \`src/components/\`
   - Add new pages/routes in \`src/app/\`
   - Modify \`next.config.ts\` for build configuration

3. **Content Management**:
   - Content is managed through the TuneGO Management Portal
   - Changes made in the portal will be reflected on the next deployment
   - If you need to update content, use the portal instead of editing files directly

4. **Redeployment**:
   - After making code changes, you can redeploy through:
     - Vercel Dashboard (if you have access)
     - Or request a redeployment through the TuneGO Management Portal
   - Content changes should be made in the portal and will trigger automatic redeployment

5. **Custom Components**:
   - You can create custom React components in \`src/components/\`
   - Import and use them in your custom pages
   - The main \`page.tsx\` is generated, but you can create additional routes

### Deployment

This site is configured for Vercel deployment. To deploy:

1. **Via Vercel Dashboard**:
   - Push your changes to the connected Git repository
   - Vercel will automatically deploy

2. **Via Vercel CLI**:
   \`\`\`bash
   vercel
   \`\`\`

### Need Help?

- For content changes: Use the TuneGO Management Portal
- For code changes: Follow the rules above and deploy through Vercel
- For issues: Contact the development team

---

**Generated**: ${new Date().toISOString()}
**Site ID**: ${site.id}
**Template**: ${site.templateId || 'N/A'}
`;
}
