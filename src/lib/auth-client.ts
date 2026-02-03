"use client";

import { useOrganization } from "@clerk/nextjs";

/**
 * Client-side hook to check if the current user is an admin
 * Uses Clerk's useOrganization hook to check orgRole
 * Returns false if user is not in an organization or not an admin
 */
export function useIsAdmin(): boolean {
  const { organization, membership } = useOrganization({
    skipOrganizationLoader: false,
  });

  // If no organization context, user is not an admin
  if (!organization || !membership) {
    return false;
  }

  // Check for organization admin role
  // Clerk uses 'org:admin' for organization admins
  // Other possible roles: 'org:member', 'org:basic_member', etc.
  return membership.role === 'org:admin';
}
