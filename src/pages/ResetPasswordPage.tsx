import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X, Check } from 'lucide-react'
import { getLogoUrl } from '../lib/assets'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { useTranslation } from '../lib/i18n'
import { Link } from 'react-router-dom'
import { buildLanguagePath } from '../lib/utils'

const isDev = import.meta.env.MODE === 'development'

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { languageCode } = useUserPreferences()
  const { t } = useTranslation(languageCode || 'en')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isDev) return
    try {
      console.log('ResetPasswordPage mount — typeof t:', typeof t)
      console.log('session:', session)
      console.log('supabase.auth exists:', !!(supabase && (supabase as any).auth))
      if (supabase && (supabase as any).auth) {
        console.log('supabase.auth.updateUser type:', typeof (supabase as any).auth.updateUser)
        console.log('supabase.auth.update type:', typeof (supabase as any).auth.update)
      }
    } catch (err) {
      console.error('Debug log error:', err)
    }
  }, [t, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'))
      return
    }

    if (password.length < 6) {
      setError(t('password_min_length'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const authObj: any = (supabase as any)?.auth ?? null
      if (!authObj) {
        throw new Error('Authentication client not available')
      }

      // Use the standard supabase v2 API: prefer updateUser, fall back to update if necessary
      let res: any
      if (typeof authObj.updateUser === 'function') {
        res = await authObj.updateUser({ password })
        if (isDev) console.log('Called supabase.auth.updateUser result:', res)
      } else {
        // Most v2 clients expose updateUser, but some wrappers might use update
        res = await authObj.update({ password })
        if (isDev) console.log('Called supabase.auth.update result:', res)
      }

      const possibleError = res?.error ?? null
      if (possibleError) {
        const message = possibleError?.message ?? JSON.stringify(possibleError)
        throw new Error(message)
      }

      setSuccess(true)

      setTimeout(() => {
        const loginPath = buildLanguagePath('/login', languageCode || 'en')
        navigate(loginPath, {
          state: {
            message: typeof t === 'function' ? t('password_updated_success') : 'Password updated successfully'
          }
        })
      }, 3000)
    } catch (err: any) {
      if (isDev) console.error('Reset password error (raw):', err)
      setError(err?.message || (typeof t === 'function' ? t('error_updating_password') : 'Error updating password'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link to={buildLanguagePath('/', languageCode || 'en')} className="flex items-center justify-center space-x-2 mb-8">
              <img src={getLogoUrl()} alt="TVSHOWup" className="h-11" />
            </Link>
            <h2 className="text-center text-3xl font-extrabold text-white">
              {typeof t === 'function' ? t('password_updated_title') : 'Password updated'}
            </h2>
          </div>

          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-400">
              {typeof t === 'function' ? t('password_updated_redirecting') : 'Redirecting...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-white">
            {languageCode === 'tr' ? 'Sıfırlama bağlantısı kontrol ediliyor...' : 'Checking reset link...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label={typeof t === 'function' ? t('close') : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <Link to={buildLanguagePath('/', languageCode || 'en')} className="flex items-center justify-center space-x-2 mb-8">
            <img src={getLogoUrl()} alt="TVSHOWup" className="h-11" />
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-white">
            {typeof t === 'function' ? t('set_new_password') : 'Set new password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {typeof t === 'function' ? t('set_new_password_description') : 'Set a new password for your account.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                {typeof t === 'function' ? t('new_password') : 'New password'}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={typeof t === 'function' ? t('enter_new_password') : 'Enter new password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                {typeof t === 'function' ? t('confirm_new_password') : 'Confirm new password'}
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={typeof t === 'function' ? t('confirm_new_password_placeholder') : 'Confirm new password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {typeof t === 'function' ? t('updating') : 'Updating'}
                </div>
              ) : (
                (typeof t === 'function' ? t('update_password') : 'Update password')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
