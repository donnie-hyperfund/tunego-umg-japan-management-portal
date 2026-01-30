"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Don't show header on sign-in/sign-up pages
  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0F0F0F] border-b border-[#1A1A1A] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo-full.png"
              alt="TuneGO"
              width={1550}
              height={250}
              className="h-8 w-auto"
              priority
              unoptimized
            />
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/points"
              className={`text-sm font-medium transition-colors ${
                pathname === "/points"
                  ? "text-[#00A0FF]"
                  : "text-[#8A8A8A] hover:text-[#00A0FF]"
              }`}
            >
              Points
            </Link>
            <Link
              href="/events"
              className={`text-sm font-medium transition-colors ${
                pathname === "/events"
                  ? "text-[#00A0FF]"
                  : "text-[#8A8A8A] hover:text-[#00A0FF]"
              }`}
            >
              Events
            </Link>
            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonPopoverCard: "bg-[#0F0F0F] border border-[#1A1A1A]",
                    userButtonPopoverActionButton: "text-[#CCCCCC] hover:bg-[#1A1A1A] hover:text-[#00A0FF]",
                    userButtonPopoverActionButtonText: "text-[#CCCCCC]",
                    userButtonPopoverActionButtonIcon: "text-[#8A8A8A]",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
