import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserPreferences } from '../contexts/UserPreferencesContext'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { languageCode } = useUserPreferences()

  useEffect(() => {
    const handleCallback = async () => {
      if (user) {
        console.log('OAuth callback: User authenticated, redirecting...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        navigate(`/${languageCode}`)
      }
    }

    handleCallback()
  }, [user, navigate, languageCode])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-white text-lg">
          {languageCode === 'tr' ? 'Giriş yapılıyor...' : 'Signing in...'}
        </p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
