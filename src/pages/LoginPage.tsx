import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { getLogoUrl } from '../lib/assets'
import { useAuth } from '../contexts/AuthContext'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { useTranslation } from '../lib/i18n'
import { Eye, EyeOff, X } from 'lucide-react'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { signIn, signInWithGoogle, signUp, sendPasswordResetEmail } = useAuth()
  const { languageCode } = useUserPreferences()
  const { t } = useTranslation(languageCode)
  const [isLogin, setIsLogin] = useState(!(location.state?.isSignUp === true))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)

  // Check if there's a redirect URL in query params
  const redirectUrl = searchParams.get('redirect')
  const fromAdmin = searchParams.get('fromAdmin') === 'true'

  // Check if this is an admin login request
  const isAdminLogin = location.state?.fromAdmin === true || fromAdmin || (redirectUrl && redirectUrl.includes('admin.'))

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message || (languageCode === 'tr' ? 'Google ile giriş başarısız' : 'Google sign-in failed'))
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate display name if signing up
    if (!isLogin) {
      if (!displayName.trim()) {
        setError(languageCode === 'tr' ? 'Görünen ad gereklidir' : 'Display name is required')
        setLoading(false)
        return
      }
      
      if (displayName.length < 3) {
        setError(languageCode === 'tr' ? 'Görünen ad en az 3 karakter olmalıdır' : 'Display name must be at least 3 characters')
        setLoading(false)
        return
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(displayName)) {
        setError(languageCode === 'tr' 
          ? 'Görünen ad sadece harf, rakam, alt çizgi ve tire içerebilir' 
          : 'Display name can only contain letters, numbers, underscores, and hyphens')
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName)
      }

      console.log('✅ Login successful, handling redirect...')
      console.log('Redirect URL:', redirectUrl)
      console.log('Is Admin Login:', isAdminLogin)

      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to the redirect URL if provided
      if (redirectUrl) {
        const decodedUrl = decodeURIComponent(redirectUrl)
        console.log('🔄 Redirecting to:', decodedUrl)
        // Force a full page reload to ensure session is picked up
        window.location.replace(decodedUrl)
        return
      }

      // Default redirects
      if (isAdminLogin) {
        const adminUrl = window.location.hostname.includes('localhost')
          ? `${window.location.protocol}//admin.localhost:${window.location.port}`
          : 'https://admin.tvshowup.com'
        console.log('🔄 Redirecting to admin panel:', adminUrl)
        window.location.replace(adminUrl)
      } else {
        const redirectPath = location.state?.redirectPath || `/${languageCode}`
        console.log('🔄 Navigating to:', redirectPath)
        navigate(redirectPath)
      }
    } catch (error: any) {
      setError(error.message || (languageCode === 'tr' ? 'Bir hata oluştu' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError(languageCode === 'tr' ? 'Lütfen e-posta adresinizi girin' : 'Please enter your email address')
      return
    }

    setResetLoading(true)
    setError('')

    try {
      await sendPasswordResetEmail(email, languageCode)
      setResetEmailSent(true)
    } catch (error: any) {
      setError(error.message || (languageCode === 'tr' ? 'Şifre sıfırlama e-postası gönderilemedi' : 'Failed to send password reset email'))
    } finally {
      setResetLoading(false)
    }
  }

  // Show reset form instead of login form
  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label={languageCode === 'tr' ? 'Kapat' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div>
            <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
              <img 
                src={getLogoUrl()} 
                alt="TVSHOWup"
                className="h-11"
              />
            </Link>
            <h2 className="text-center text-3xl font-extrabold text-white">
              {languageCode === 'tr' ? 'Şifre Sıfırlama' : 'Reset Password'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              {languageCode === 'tr' 
                ? 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim'
                : 'Enter your email address and we\'ll send you a password reset link'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handlePasswordReset(); }}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300">
                {languageCode === 'tr' ? 'E-posta Adresi' : 'Email Address'}
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={languageCode === 'tr' ? 'E-posta adresinizi girin' : 'Enter your email address'}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {resetEmailSent && (
              <div className="text-green-400 text-sm text-center">
                {languageCode === 'tr' 
                  ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-posta kutunuzu kontrol edin.'
                  : 'Password reset link has been sent to your email address. Please check your inbox.'}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                {languageCode === 'tr' ? 'Geri' : 'Back'}
              </button>
              
              <button
                type="submit"
                disabled={resetLoading || !email}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {languageCode === 'tr' ? 'Gönderiliyor...' : 'Sending...'}
                  </div>
                ) : (
                  languageCode === 'tr' ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate(`/${languageCode}`)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label={languageCode === 'tr' ? 'Ana sayfaya dön' : 'Return to home'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <img 
              src={getLogoUrl()} 
              alt="TVSHOWup"
              className="h-11"
            />
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-white">
            {isAdminLogin 
              ? (languageCode === 'tr' ? 'Admin Paneline Giriş' : 'Admin Panel Login')
              : (isLogin ? t.signInToAccount : t.createAccount)
            }
          </h2>
          {isAdminLogin && (
            <p className="mt-2 text-center text-sm text-yellow-400">
              {languageCode === 'tr' 
                ? 'Admin kimlik bilgilerinizle giriş yapın' 
                : 'Please sign in with your admin credentials'}
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-400">
            {!isAdminLogin && (
              <>
                {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-primary-500 hover:text-primary-400"
                >
                  {isLogin ? t.signUp : t.signIn}
                </button>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && !isAdminLogin && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                  {t.displayName}
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={languageCode === 'tr' ? 'Görünen adınızı girin' : 'Enter your display name'}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                {t.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={languageCode === 'tr' ? '@kullaniciadi gibi bir kullanıcı adı girin' : 'Enter a username like @username'}
              />
              <p className="mt-1 text-xs text-gray-400">
                {languageCode === 'tr' 
                  ? 'Bu ad, diğer kullanıcılar tarafından görülecek ve @' + displayName + ' şeklinde etiketlenebileceksiniz' 
                  : 'This name will be visible to other users and you can be tagged as @' + displayName}
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                {t.password}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={languageCode === 'tr' ? 'Şifrenizi girin' : 'Enter your password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {resetEmailSent && (
            <div className="text-green-400 text-sm text-center">
              {languageCode === 'tr' 
                ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' 
                : 'Password reset link has been sent to your email address'}
            </div>
          )}

          {isLogin && !isAdminLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50"
              >
                {languageCode === 'tr' ? 'Şifremi Unuttum?' : 'Forgot Password?'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? t.signingIn : t.creatingAccount}
                </div>
              ) : (
                isLogin ? t.signInButton : t.signUpButton
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">
                  {languageCode === 'tr' ? 'veya' : 'or'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-700 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {languageCode === 'tr' ? 'Google ile Giriş Yap' : 'Sign in with Google'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage