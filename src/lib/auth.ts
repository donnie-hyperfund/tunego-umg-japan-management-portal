import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user is an admin
 * In Clerk, admins typically have the 'org:admin' role
 * Adjust this based on your Clerk organization setup
 */
export async function isAdmin(): Promise<boolean> {
  const authResult = await auth();
  
  if (!authResult.userId) {
    return false;
  }

  // Check for organization admin role
  // Clerk uses 'org:admin' for organization admins
  // orgRole can be: 'org:admin', 'org:member', 'org:basic_member', etc.
  if (authResult.orgRole === 'org:admin') {
    return true;
  }

  // If you're using Clerk's custom roles, you can check for specific role names
  // For example, if you have a custom 'admin' role:
  // if (authResult.orgRole === 'admin') {
  //   return true;
  // }

  // Check for admin permission using has() if you have custom permissions set up
  // Example: return await authResult.has({ permission: 'admin' });
  
  return false;
}

/**
 * Get the current user's auth info
 */
export async function getAuthInfo() {
  return await auth();
}
