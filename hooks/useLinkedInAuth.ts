// Updated hooks/useLinkedInAuth.ts for App Router
import { useState, useEffect, useCallback } from 'react'

interface LinkedInProfile {
  id: string
  localizedFirstName: string
  localizedLastName: string
  profilePicture?: string
  emailAddress?: string
}

interface LinkedInAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  profile: LinkedInProfile | null
  accessToken: string | null
}

export const useLinkedInAuth = () => {
  const [authState, setAuthState] = useState<LinkedInAuthState>({
    isAuthenticated: false,
    isLoading: true,
    profile: null,
    accessToken: null
  })

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus()
    
    // Listen for auth success from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          profile: event.data.data.profile,
          accessToken: event.data.data.accessToken
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      // Check if we have stored auth data
      const storedToken = localStorage.getItem('linkedin_access_token')
      const storedProfile = localStorage.getItem('linkedin_profile')
      
      if (storedToken && storedProfile) {
        // Verify token is still valid
        const response = await fetch('/api/linkedin/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: storedToken })
        })

        if (response.ok) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            profile: JSON.parse(storedProfile),
            accessToken: storedToken
          })
          return
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('linkedin_access_token')
          localStorage.removeItem('linkedin_profile')
        }
      }

      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAuthenticated: false,
        profile: null,
        accessToken: null 
      }))
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAuthenticated: false,
        profile: null,
        accessToken: null 
      }))
    }
  }

  const authenticate = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/linkedin/callback')
    console.log("Generated redirect_uri:", decodeURIComponent(redirectUri)) // Log for debugging
    const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social')
    const state = Math.random().toString(36).substring(7)
    
    // Store state for verification
    localStorage.setItem('linkedin_oauth_state', state)
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
    
    // Open LinkedIn auth in a popup
    const popup = window.open(
      authUrl,
      'linkedin-auth',
      'width=600,height=600,scrollbars=yes,resizable=yes'
    )

    // Listen for the popup to close
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        // Check if authentication was successful
        setTimeout(() => {
          checkAuthStatus()
        }, 1000)
      }
    }, 1000)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('linkedin_access_token')
    localStorage.removeItem('linkedin_profile')
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      profile: null,
      accessToken: null
    })
  }, [])

  return {
    ...authState,
    authenticate,
    logout,
    checkAuthStatus
  }
}