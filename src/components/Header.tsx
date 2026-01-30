"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show header on sign-in/sign-up pages
  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0F0F0F] border-b border-[#1A1A1A] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
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
              className="h-7 sm:h-8 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-[#0F0F0F] border border-[#1A1A1A]",
                  userButtonPopoverActionButton: "text-[#CCCCCC] hover:bg-[#1A1A1A] hover:text-[#00A0FF]",
                  userButtonPopoverActionButtonText: "text-[#CCCCCC]",
                  userButtonPopoverActionButtonIcon: "text-[#8A8A8A]",
                  userButtonPopoverFooter: "hidden",
                },
              }}
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#8A8A8A] hover:text-[#00A0FF] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-[#1A1A1A] py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/points"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors py-2 ${
                  pathname === "/points"
                    ? "text-[#00A0FF]"
                    : "text-[#8A8A8A] hover:text-[#00A0FF]"
                }`}
              >
                Points
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors py-2 ${
                  pathname === "/events"
                    ? "text-[#00A0FF]"
                    : "text-[#8A8A8A] hover:text-[#00A0FF]"
                }`}
              >
                Events
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
