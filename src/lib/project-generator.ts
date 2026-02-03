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
  const cardContent = contentBySection.cards || [];
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
    dependencies,
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      'eslint': '^9',
      'eslint-config-next': '15.5.4',
      'typescript': '^5',
      'tailwindcss': '^4',
      '@tailwindcss/postcss': '^4',
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
  const pageContent = generatePageComponent(heroContent, descriptionContent, cardContent, signupContent);

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
  signupContent: any
): string {
  const descriptionHtml = descriptionContent
    .map(desc => {
      if (desc.contentType === 'richText' && desc.content?.html) {
        return desc.content.html;
      } else if (desc.contentType === 'text' && desc.content?.text) {
        return `<p>${desc.content.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
      }
      return '';
    })
    .join('\n');

  const cardImageUrl = cardContent[0]?.content?.cardImageUrl || '';
  
  // Escape all user-provided strings
  const title = escape(heroContent.title || '');
  const subtitle = escape(heroContent.subtitle || '');
  const backgroundVideo = escape(heroContent.backgroundVideo || '');
  const backgroundImage = escape(heroContent.backgroundImage || '');
  const ctaText = escape(heroContent.ctaText || '');
  const ctaLink = escape(heroContent.ctaLink || '');
  const placeholder = escape(signupContent.placeholder || 'Enter your email');
  const buttonText = escape(signupContent.buttonText || 'Subscribe');

  return `export default function Home() {
  return (
    <div className="bg-black min-h-screen relative overflow-hidden">
      {/* Full-Screen Background Video */}
      ${backgroundVideo ? `
      <div className="fixed top-0 left-0 w-full h-full opacity-80 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src={${JSON.stringify(backgroundVideo)}} type="video/mp4" />
        </video>
      </div>
      ` : ''}

      {/* Full-Screen Background Image */}
      ${backgroundImage && !backgroundVideo ? `
      <div
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: \`url(${JSON.stringify(backgroundImage)})\` }}
      />
      ` : ''}

      {/* Main Content Overlay */}
      <div className="relative w-full min-h-screen flex flex-col xl:flex-row xl:h-screen p-4 xl:p-8 z-10">
        <div className="flex flex-col xl:flex-row xl:m-auto gap-8 xl:gap-20 w-full max-w-7xl mx-auto">
          {/* Card - shown first on mobile, on right on desktop */}
          ${cardImageUrl ? `
          <div className="flex justify-center xl:my-auto w-full xl:w-auto xl:max-w-sm order-1 xl:order-2 pt-4 xl:pt-0">
            <img
              src={${JSON.stringify(cardImageUrl)}}
              alt="Collectible Card"
              className="rotate-[5deg] hover:rotate-[-2.5deg] border border-[#333333] hover:border-[#00A0FF] duration-500 cursor-grab w-full max-w-[280px] xl:max-w-none transition-transform"
            />
          </div>
          ` : ''}

          {/* Text Content - shown second on mobile, on left on desktop */}
          <div className="my-auto w-full max-w-3xl order-2 xl:order-1">
            ${title ? `
            <h1 className="text-white text-4xl xl:text-6xl leading-tight mb-6 xl:mb-8 font-bold">
              {${JSON.stringify(title)}}
            </h1>
            ` : ''}
            
            ${subtitle ? `
            <p className="text-white text-sm xl:text-base mb-4 xl:mb-6 leading-relaxed">
              {${JSON.stringify(subtitle)}}
            </p>
            ` : ''}

            ${descriptionHtml ? `
            <div className="text-white text-sm xl:text-base mb-4" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(descriptionHtml)} }} />
            ` : ''}

            ${ctaText && ctaLink ? `
            <div className="mt-6 xl:mt-8">
              <a
                href={${JSON.stringify(ctaLink)}}
                className="inline-block px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
              >
                {${JSON.stringify(ctaText)}}
              </a>
            </div>
            ` : ''}

            ${signupContent.enabled ? `
            <div className="mt-8">
              <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => { e.preventDefault(); }}>
                <input
                  type="email"
                  placeholder={${JSON.stringify(placeholder)}}
                  className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF]"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
                >
                  {${JSON.stringify(buttonText)}}
                </button>
              </form>
            </div>
            ` : ''}
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
