"use client";

import React from 'react';

interface SiteContent {
  id: string;
  section: string;
  contentType: string;
  content: any;
  order: number;
  isVisible: boolean;
}

export function renderTemplate(templateId: string, content: SiteContent[], assets: any[] = []): React.ReactElement {
  // Get content organized by section
  const contentBySection = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SiteContent[]>);

  // Sort each section by order
  Object.keys(contentBySection).forEach(section => {
    contentBySection[section].sort((a, b) => a.order - b.order);
  });

  // Render based on template
  switch (templateId) {
    case 'collectible-campaign':
      return renderCollectibleCampaign(contentBySection, assets);
    default:
      return React.createElement('div', { className: 'p-4 text-white' }, `Template not found: ${templateId}`);
  }
}

function renderCollectibleCampaign(
  contentBySection: Record<string, SiteContent[]>,
  assets: any[]
): React.ReactElement {
  // Get hero content - handle both text content type (with title/subtitle) and hero content type
  let heroContent: any = {};
  const heroSection = contentBySection.hero?.[0];
  if (heroSection) {
    if (heroSection.contentType === 'text' && heroSection.content) {
      // If it's text type, use the content directly
      heroContent = heroSection.content;
    } else {
      // Otherwise use content as-is
      heroContent = heroSection.content || {};
    }
  }

  const descriptionContent = contentBySection.description || [];
  const cardContent = contentBySection.cards || [];
  const signupContent = contentBySection.signup?.[0]?.content || {};

  return (
    <div className="bg-black min-h-screen">
      {/* Video Background */}
      {heroContent.backgroundVideo && (
        <div className="fixed top-0 left-0 w-full min-h-screen opacity-80">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="video-bg w-full h-full object-cover"
          >
            <source src={heroContent.backgroundVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Background Image Overlay */}
      {heroContent.backgroundImage && !heroContent.backgroundVideo && (
        <div
          className="fixed top-0 left-0 w-full min-h-screen bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroContent.backgroundImage})` }}
        />
      )}

      {/* Main Content */}
      <div className="relative w-full min-h-screen flex flex-col xl:flex-row xl:h-screen p-4 xl:p-8">
        <div className="flex flex-col xl:flex-row xl:m-auto gap-8 xl:gap-20 w-full max-w-7xl mx-auto">
          {/* Card - shown first on mobile, on right on desktop */}
          {cardContent.length > 0 && (
            <div className="flex justify-center xl:my-auto w-full xl:w-auto xl:max-w-sm order-1 xl:order-2 pt-4 xl:pt-0">
              {cardContent[0]?.content?.cardImageUrl ? (
                <img
                  src={cardContent[0].content.cardImageUrl}
                  alt="Collectible Card"
                  className="rotate-[5deg] hover:rotate-[-2.5deg] border border-[#333333] hover:border-[#00A0FF] duration-500 cursor-grab w-full max-w-[280px] xl:max-w-none"
                />
              ) : (
                <div className="w-full max-w-[280px] xl:max-w-none h-[400px] bg-[#1A1A1A] border border-[#333333] rounded-lg flex items-center justify-center text-[#8A8A8A]">
                  Card Preview
                </div>
              )}
            </div>
          )}

          {/* Text Content - shown third on mobile, on left on desktop */}
          <div className="my-auto w-full max-w-3xl order-3 xl:order-1">
            {heroContent.title && (
              <h1 className="text-white text-4xl xl:text-6xl leading-tight mb-6 xl:mb-8 font-bold">
                {heroContent.title}
              </h1>
            )}
            
            {descriptionContent.map((desc) => {
              if (desc.contentType === 'richText' && desc.content?.html) {
                return (
                  <div
                    key={desc.id}
                    className="text-white text-sm xl:text-base mb-4"
                    dangerouslySetInnerHTML={{ __html: desc.content.html }}
                  />
                );
              } else if (desc.contentType === 'text' && desc.content?.text) {
                return (
                  <p key={desc.id} className="text-white text-sm xl:text-base mb-4">
                    {desc.content.text}
                  </p>
                );
              }
              return null;
            })}

            {/* CTA Button */}
            {heroContent.ctaText && heroContent.ctaLink && (
              <div className="mt-6 xl:mt-8">
                <a
                  href={heroContent.ctaLink}
                  className="inline-block px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
                >
                  {heroContent.ctaText}
                </a>
              </div>
            )}

            {/* Email Signup Form */}
            {signupContent.enabled && (
              <div className="mt-8">
                <form className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder={signupContent.placeholder || "Enter your email"}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
                  >
                    {signupContent.buttonText || "Subscribe"}
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
