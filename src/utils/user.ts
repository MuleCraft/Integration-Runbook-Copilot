/**
 * User utility functions to get user information from the browser
 */

export interface UserInfo {
    name: string;
    email: string;
    initials: string;
}

/**
 * Get user initials from a full name
 */
export function getInitials(name: string): string {
    if (!name) return '??';
    
    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 1) {
        // Single word - take first 2 characters
        return parts[0].substring(0, 2).toUpperCase();
    }
    
    // Multiple words - take first letter of first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Extract name from email address
 */
export function getNameFromEmail(email: string): string {
    if (!email) return 'User';
    
    // Extract the part before @
    const username = email.split('@')[0];
    
    // Replace dots, underscores, hyphens with spaces
    const name = username.replace(/[._-]/g, ' ');
    
    // Capitalize each word
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Get user information from browser
 * Tries multiple sources: localStorage, Microsoft Graph API, browser profile, etc.
 */
export async function getUserInfo(): Promise<UserInfo> {
    // 1. Check localStorage first (fastest)
    const cached = localStorage.getItem('userInfo');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.name && parsed.email) {
                return {
                    ...parsed,
                    initials: getInitials(parsed.name)
                };
            }
        } catch (e) {
            console.warn('Failed to parse cached user info');
        }
    }

    // 2. Try to get from Microsoft Graph API (if Outlook is linked)
    try {
        const graphUser = await getUserFromMicrosoftGraph();
        if (graphUser) {
            const userInfo: UserInfo = {
                name: graphUser.displayName || graphUser.mail || 'User',
                email: graphUser.mail || graphUser.userPrincipalName || '',
                initials: getInitials(graphUser.displayName || graphUser.mail || 'User')
            };
            
            // Cache it
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        }
    } catch (e) {
        console.log('Microsoft Graph API not available');
    }

    // 3. Try to get from browser's credential management
    try {
        if ('credentials' in navigator) {
            // @ts-ignore - Credential Management API
            const cred = await navigator.credentials.get({ password: true });
            if (cred && 'id' in cred) {
                const email = (cred as any).id;
                const name = (cred as any).name || getNameFromEmail(email);
                const userInfo: UserInfo = {
                    name,
                    email,
                    initials: getInitials(name)
                };
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                return userInfo;
            }
        }
    } catch (e) {
        console.log('Credential Management API not available');
    }

    // 4. Try to extract from platform-specific APIs
    try {
        const platformUser = await getPlatformUser();
        if (platformUser) {
            const userInfo: UserInfo = {
                name: platformUser.name || getNameFromEmail(platformUser.email),
                email: platformUser.email,
                initials: getInitials(platformUser.name || platformUser.email)
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        }
    } catch (e) {
        console.log('Platform user API not available');
    }

    // 5. Fallback: Use system username if available
    const systemName = navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || '';
    
    // 6. Last resort: return default
    return {
        name: systemName || 'User',
        email: '',
        initials: getInitials(systemName || 'US')
    };
}

/**
 * Try to get user from Microsoft Graph API
 */
async function getUserFromMicrosoftGraph(): Promise<any> {
    // Check if we have an access token in localStorage
    const token = localStorage.getItem('msalAccessToken') || 
                  localStorage.getItem('outlookAccessToken') ||
                  localStorage.getItem('accessToken');
    
    if (!token) return null;

    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.log('Microsoft Graph API call failed');
    }

    return null;
}

/**
 * Get user from platform-specific APIs (Google, etc.)
 */
async function getPlatformUser(): Promise<{ name: string; email: string } | null> {
    // Check if Google Sign-In is available
    if (typeof window !== 'undefined' && (window as any).google) {
        try {
            // Google Sign-In would need to be initialized first
            // const auth = (window as any).google.accounts.id;
            // Future: Implement Google Sign-In user extraction
        } catch (e) {
            console.log('Google Sign-In not available');
        }
    }

    return null;
}

/**
 * Set user information manually (e.g., after login)
 */
export function setUserInfo(name: string, email: string): void {
    const userInfo: UserInfo = {
        name,
        email,
        initials: getInitials(name)
    };
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

/**
 * Clear user information
 */
export function clearUserInfo(): void {
    localStorage.removeItem('userInfo');
}

/**
 * Hook to use user info in React components
 */
export function useUserInfo(): UserInfo {
    const [userInfo, setUserInfoState] = useState<UserInfo>({
        name: 'User',
        email: '',
        initials: 'US'
    });

    useEffect(() => {
        getUserInfo().then(setUserInfoState);
    }, []);

    return userInfo;
}

// Required React imports for the hook
import { useState, useEffect } from 'react';
