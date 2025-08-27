"use client"
import { useState, useEffect } from "react"
import { AuthState } from "../types"

export const useLinkedInAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    profile: null,
    accessToken: null
  })

  const authenticate = () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID'
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/linkedin/callback')
    const scope = encodeURIComponent('profile openid email w_member_social')
    const state = Math.random().toString(36).substring(7)
    
    localStorage.setItem('linkedin_oauth_state', state)
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
    
    const popup = window.open(authUrl, 'linkedin-auth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }, 1000)
    
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        clearInterval(checkClosed)
        popup?.close()
        window.removeEventListener('message', messageListener)
        
        exchangeCodeForToken(event.data.code, state)
      } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
        clearInterval(checkClosed)
        popup?.close()
        window.removeEventListener('message', messageListener)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        console.error('LinkedIn authentication error:', event.data.error)
      }
    }
    
    window.addEventListener('message', messageListener)
  }
  
  const exchangeCodeForToken = async (code: string, state: string) => {
    try {
      const storedState = localStorage.getItem('linkedin_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter')
      }
      localStorage.removeItem('linkedin_oauth_state')
      
      const response = await fetch('/api/auth/linkedin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to exchange code for token')
      }
      
      const data = await response.json()
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        profile: data.profile || {
          firstName: 'User',
          lastName: 'Name',
        },
        accessToken: null,
      })
      
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }
  
  useEffect(() => {
    fetch('/api/linkedin/status')
      .then(response => response.json())
      .then(data => {
        if (data.isAuthenticated) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            profile: data.profile || { firstName: 'User', lastName: 'Name' },
            accessToken: null,
          })
        }
      })
      .catch(error => {
        console.log('Not authenticated or error checking status:', error)
      })
  }, [])

  return { ...authState, authenticate }
}