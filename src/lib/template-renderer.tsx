"use client";

import React, { useState } from 'react';

interface SiteContent {
  id: string;
  section: string;
  contentType: string;
  content: any;
  order: number;
  isVisible: boolean;
}

export function renderTemplate(
  templateId: string, 
  content: SiteContent[], 
  assets: any[] = [], 
  isPreview: boolean = false,
  backgroundColor: string = '#000000',
  textColor: string = '#FFFFFF'
): React.ReactElement {
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
      return renderCollectibleCampaign(contentBySection, assets, isPreview, backgroundColor, textColor);
    default:
      return React.createElement('div', { className: 'p-4', style: { color: textColor } }, `Template not found: ${templateId}`);
  }
}

function renderCollectibleCampaign(
  contentBySection: Record<string, SiteContent[]>,
  assets: any[],
  isPreview: boolean = false,
  backgroundColor: string = '#000000',
  textColor: string = '#FFFFFF'
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

  const positionClass = isPreview ? "absolute" : "fixed";
  const heightClass = isPreview ? "h-full" : "min-h-screen";

  return (
    <div className={isPreview ? "h-full" : "min-h-screen"} style={{ backgroundColor }}>
      {/* Video Background */}
      {heroContent.backgroundVideo && (
        <div className={`${positionClass} top-0 left-0 w-full ${heightClass} opacity-80`}>
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
          className={`${positionClass} top-0 left-0 w-full ${heightClass} bg-cover bg-center bg-no-repeat`}
          style={{ backgroundImage: `url(${heroContent.backgroundImage})` }}
        />
      )}

      {/* Main Content */}
      <div className={`relative w-full ${isPreview ? "h-full" : "min-h-screen"} flex flex-col xl:flex-row ${isPreview ? "" : "xl:h-screen"} p-4 xl:p-8`}>
        <div className="flex flex-col xl:flex-row xl:m-auto gap-8 xl:gap-20 w-full max-w-7xl mx-auto">
          {/* Card - shown first on mobile, on right on desktop */}
          {cardContent.length > 0 && (() => {
            const cardData = cardContent[0]?.content || {};
            const cardImageUrl = cardData.cardImageUrl || cardData.frontImageUrl;
            const backImageUrl = cardData.backImageUrl;
            const frontMediaType = cardData.frontMediaType || (cardImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");
            const backMediaType = cardData.backMediaType || (backImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");
            const hasFlip = cardData.backImageUrl && cardData.flipEnabled !== false;
            
            return (
              <CardComponent
                cardImageUrl={cardImageUrl}
                backImageUrl={backImageUrl}
                frontMediaType={frontMediaType}
                backMediaType={backMediaType}
                hasFlip={hasFlip}
              />
            );
          })()}

          {/* Text Content - shown third on mobile, on left on desktop */}
          <div className="my-auto w-full max-w-3xl order-3 xl:order-1">
            {heroContent.title && (
              <h1 className="text-4xl xl:text-6xl leading-tight mb-6 xl:mb-8 font-bold" style={{ color: textColor }}>
                {heroContent.title}
              </h1>
            )}
            
            {descriptionContent.map((desc) => {
              if (desc.contentType === 'richText' && desc.content?.html) {
                return (
                  <div
                    key={desc.id}
                    className="text-sm xl:text-base mb-4"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: desc.content.html }}
                  />
                );
              } else if (desc.contentType === 'text' && desc.content?.text) {
                return (
                  <p key={desc.id} className="text-sm xl:text-base mb-4" style={{ color: textColor }}>
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
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transform: `rotateX(${tiltAngle * 0.1}deg) rotateZ(${tiltAngle * 0.05}deg)`,
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
              {frontMediaType === "video" ? (
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
                />
              ) : (
                <img
                  src={cardImageUrl}
                  alt="Collectible Card Front"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Back Face */}
            {backImageUrl && (
              <div
                className="absolute inset-0 w-full h-full rounded-lg border-2 border-[#333333] overflow-hidden shadow-lg transition-colors duration-300"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderColor: isHovered ? "#00A0FF" : "#333333",
                }}
              >
                {backMediaType === "video" ? (
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
                  />
                ) : (
                  <img
                    src={backImageUrl}
                    alt="Collectible Card Back"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
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
          transform: `rotateX(${tiltAngleSimple * 0.1}deg) rotateZ(${tiltAngleSimple * 0.05}deg)`,
        }}
        onMouseEnter={() => setIsHoveredSimple(true)}
        onMouseLeave={() => setIsHoveredSimple(false)}
      >
        {frontMediaType === "video" ? (
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
          />
        ) : (
          <img
            src={cardImageUrl}
            alt="Collectible Card"
            className="border border-[#333333] duration-300 w-full max-w-[280px] xl:max-w-none transition-colors"
            style={{
              borderColor: isHoveredSimple ? "#00A0FF" : "#333333",
            }}
          />
        )}
      </div>
    </div>
  );
}
