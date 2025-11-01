import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { AuthPromptProvider } from './contexts/AuthPromptContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { isAdminRoute, getLanguageFromPath, isRTLLanguage, detectBrowserLanguage } from './lib/utils';
import { loadGoogleAdScripts } from './lib/adScriptLoader';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ContentDetailPage from './pages/ContentDetailPage';
import WatchlistPage from './pages/WatchlistPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ShareListPage from './pages/ShareListPage';
import PublicWatchlistPage from './pages/PublicWatchlistPage';
import StaticPage from './pages/StaticPage';
import PersonDetailPage from './pages/PersonDetailPage';
import MyListsPage from './pages/MyListsPage';
import UserPublicShareListsPage from './pages/UserPublicShareListsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminRoute from './components/AdminRoute';
import DiscoverListsPage from './pages/DiscoverListsPage';
import ScrollToTop from './components/ScrollToTop';
import AuthPromptModal from './components/AuthPromptModal';
import CookieConsentBanner from './components/CookieConsentBanner';
import LanguageRouter from './components/LanguageRouter';
import SEOWrapper from './components/SEOWrapper';
import AdminSidebar from './components/AdminSidebar';
import Dashboard from './pages/admin/Dashboard';
import StaticPages from './pages/admin/StaticPages';
import AdminLogin from './pages/admin/AdminLogin';
import UserManagement from './pages/admin/UserManagement';
import AdManagement from './pages/admin/AdManagement';

function RootRedirect() {
  const [targetLang, setTargetLang] = React.useState<string | null>(null);

  React.useEffect(() => {
    const detectLanguage = async () => {
      console.log('🏠 Root access without language code - detecting location...');

      // Clear any existing preferences to force fresh detection
      Cookies.remove('user_language', { path: '/' });
      Cookies.remove('user_country', { path: '/' });

      // Detect user's actual location via IP
      try {
        const services = [
          { url: 'https://ipapi.co/json/', field: 'country_code' },
          { url: 'https://ip-api.com/json/', field: 'countryCode' }
        ];

        for (const service of services) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(service.url, {
              signal: controller.signal,
              cache: 'no-cache'
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const countryCode = data[service.field];

              if (countryCode && typeof countryCode === 'string') {
                const upperCode = countryCode.toUpperCase();
                console.log(`✅ Detected country: ${upperCode}`);

                // Map country to language
                const countryToLanguageMap: Record<string, string> = {
                  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
                  'TR': 'tr',
                  'DE': 'de', 'AT': 'de', 'CH': 'de',
                  'FR': 'fr', 'BE': 'fr',
                  'ES': 'es', 'MX': 'es', 'AR': 'es',
                  'IT': 'it',
                  'PT': 'pt', 'BR': 'pt',
                  'NL': 'nl',
                  'RU': 'ru',
                  'PL': 'pl',
                  'GR': 'el',
                  'JP': 'ja',
                  'KR': 'ko',
                  'CN': 'zh',
                  'IN': 'hi',
                  'SA': 'ar', 'AE': 'ar', 'EG': 'ar',
                  'SE': 'sv',
                  'NO': 'no',
                  'DK': 'da',
                  'FI': 'fi'
                };

                const detectedLang = countryToLanguageMap[upperCode] || detectBrowserLanguage();
                console.log(`🌐 Redirecting to language: ${detectedLang}`);
                setTargetLang(detectedLang);
                return;
              }
            }
          } catch (error) {
            console.warn(`⚠️ Service ${service.url} failed, trying next...`);
            continue;
          }
        }
      } catch (error) {
        console.error('❌ Location detection failed:', error);
      }

      // Fallback to browser language
      const fallbackLang = detectBrowserLanguage();
      console.log(`⚠️ Using fallback language: ${fallbackLang}`);
      setTargetLang(fallbackLang);
    };

    detectLanguage();
  }, []);

  if (!targetLang) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return <Navigate to={`/${targetLang}`} replace />;
}

function LegacyRouteRedirect() {
  const location = useLocation();
  const [targetLang, setTargetLang] = React.useState<string | null>(null);

  React.useEffect(() => {
    const detectLanguage = async () => {
      console.log('🔄 Legacy route without language code - detecting location...');

      // Clear any existing preferences to force fresh detection
      Cookies.remove('user_language', { path: '/' });
      Cookies.remove('user_country', { path: '/' });

      // Detect user's actual location via IP
      try {
        const services = [
          { url: 'https://ipapi.co/json/', field: 'country_code' },
          { url: 'https://ip-api.com/json/', field: 'countryCode' }
        ];

        for (const service of services) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(service.url, {
              signal: controller.signal,
              cache: 'no-cache'
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const countryCode = data[service.field];

              if (countryCode && typeof countryCode === 'string') {
                const upperCode = countryCode.toUpperCase();
                console.log(`✅ Detected country: ${upperCode}`);

                // Map country to language
                const countryToLanguageMap: Record<string, string> = {
                  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
                  'TR': 'tr',
                  'DE': 'de', 'AT': 'de', 'CH': 'de',
                  'FR': 'fr', 'BE': 'fr',
                  'ES': 'es', 'MX': 'es', 'AR': 'es',
                  'IT': 'it',
                  'PT': 'pt', 'BR': 'pt',
                  'NL': 'nl',
                  'RU': 'ru',
                  'PL': 'pl',
                  'GR': 'el',
                  'JP': 'ja',
                  'KR': 'ko',
                  'CN': 'zh',
                  'IN': 'hi',
                  'SA': 'ar', 'AE': 'ar', 'EG': 'ar',
                  'SE': 'sv',
                  'NO': 'no',
                  'DK': 'da',
                  'FI': 'fi'
                };

                const detectedLang = countryToLanguageMap[upperCode] || detectBrowserLanguage();
                console.log(`🌐 Redirecting to language: ${detectedLang}`);
                setTargetLang(detectedLang);
                return;
              }
            }
          } catch (error) {
            console.warn(`⚠️ Service ${service.url} failed, trying next...`);
            continue;
          }
        }
      } catch (error) {
        console.error('❌ Location detection failed:', error);
      }

      // Fallback to browser language
      const fallbackLang = detectBrowserLanguage();
      console.log(`⚠️ Using fallback language: ${fallbackLang}`);
      setTargetLang(fallbackLang);
    };

    detectLanguage();
  }, []);

  if (!targetLang) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  const newPath = `/${targetLang}${location.pathname}${location.search}${location.hash}`;
  console.log(`🔄 Legacy route redirect: ${location.pathname} -> ${newPath}`);
  return <Navigate to={newPath} replace />;
}


function RTLWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const lang = getLanguageFromPath(location.pathname);
    const isRTL = lang && isRTLLanguage(lang);

    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang || 'en');
  }, [location.pathname]);

  useEffect(() => {
    loadGoogleAdScripts();
  }, []);

  return <>{children}</>;
}

function AppRoutes() {
  const isAdmin = isAdminRoute();

  console.log('🔍 Admin route check:', {
    isAdmin,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
  });

  return (
    <>
      <ScrollToTop />
      <SEOWrapper />

      {/* ADMIN ROUTES */}
      {isAdmin ? (
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="*" element={
            <div className="flex min-h-screen bg-gray-900">
              <AdminSidebar />
              <main className="flex-1">
                <Routes>
                  <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                  <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
                  <Route path="/admin/pages" element={<AdminRoute><StaticPages /></AdminRoute>} />
                  <Route path="/pages" element={<AdminRoute><StaticPages /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/admin/ads" element={<AdminRoute><AdManagement /></AdminRoute>} />
                  <Route path="/ads" element={<AdminRoute><AdManagement /></AdminRoute>} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      ) : (
        <div className="min-h-screen bg-gray-900">
          <Routes>
            {/* Special routes WITHOUT language prefix and WITHOUT LanguageRouter */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* All other routes go through LanguageRouter */}
            <Route path="*" element={
              <LanguageRouter>
                <Header />
                <main className="relative pt-[120px] md:pt-16">
                  <Routes>
                    {/* Block /admin routes on main domain - redirect to admin subdomain */}
                    <Route path="/admin/*" element={<Navigate to="https://admin.tvshowup.com" replace />} />

                    {/* Language-aware Public Routes */}
                    <Route path="/:lang" element={<HomePage />} />
                    <Route path="/:lang/search" element={<SearchPage />} />
                    <Route path="/:lang/movie/:id" element={<ContentDetailPage contentType="movie" />} />
                    <Route path="/:lang/tv_show/:id" element={<ContentDetailPage contentType="tv_show" />} />
                    <Route path="/:lang/movie/:id/:slug" element={<ContentDetailPage contentType="movie" />} />
                    <Route path="/:lang/tv_show/:id/:slug" element={<ContentDetailPage contentType="tv_show" />} />
                    <Route path="/:lang/watchlist" element={<WatchlistPage />} />
                    <Route path="/:lang/login" element={<LoginPage />} />
                    <Route path="/:lang/settings" element={<SettingsPage />} />
                    <Route path="/:lang/person/:id" element={<PersonDetailPage />} />
                    <Route path="/:lang/person/:id/:slug" element={<PersonDetailPage />} />
                    <Route path="/:lang/share/:listId" element={<ShareListPage />} />
                    <Route path="/:lang/public-watchlist/:listId" element={<PublicWatchlistPage />} />
                    <Route path="/:lang/my-lists" element={<MyListsPage />} />
                    <Route path="/:lang/pages/:slug" element={<StaticPage />} />
                    <Route path="/:lang/discover-lists" element={<DiscoverListsPage />} />
                    <Route path="/:lang/u/:username/mylist" element={<PublicWatchlistPage />} />
                    <Route path="/:lang/u/:username/my-suggestion-lists" element={<UserPublicShareListsPage />} />

                    {/* Legacy routes without language prefix - redirect to user's browser language */}
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/search" element={<LegacyRouteRedirect />} />
                    <Route path="/movie/:id" element={<LegacyRouteRedirect />} />
                    <Route path="/tv_show/:id" element={<LegacyRouteRedirect />} />
                    <Route path="/movie/:id/:slug" element={<LegacyRouteRedirect />} />
                    <Route path="/tv_show/:id/:slug" element={<LegacyRouteRedirect />} />
                    <Route path="/watchlist" element={<LegacyRouteRedirect />} />
                    <Route path="/login" element={<LegacyRouteRedirect />} />
                    <Route path="/settings" element={<LegacyRouteRedirect />} />
                    <Route path="/person/:id" element={<LegacyRouteRedirect />} />
                    <Route path="/person/:id/:slug" element={<LegacyRouteRedirect />} />
                    <Route path="/share/:listId" element={<LegacyRouteRedirect />} />
                    <Route path="/public-watchlist/:listId" element={<LegacyRouteRedirect />} />
                    <Route path="/my-lists" element={<LegacyRouteRedirect />} />
                    <Route path="/pages/:slug" element={<LegacyRouteRedirect />} />
                    <Route path="/discover-lists" element={<LegacyRouteRedirect />} />
                    <Route path="/u/:username/mylist" element={<LegacyRouteRedirect />} />
                    <Route path="/u/:username/my-suggestion-lists" element={<LegacyRouteRedirect />} />
                  </Routes>
                </main>
                <Footer />
              </LanguageRouter>
            } />
          </Routes>
          <AuthPromptModal />
          <CookieConsentBanner />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Router>
          <UserPreferencesProvider>
            <AuthPromptProvider>
              <RTLWrapper>
                <AppRoutes />
              </RTLWrapper>
            </AuthPromptProvider>
          </UserPreferencesProvider>
        </Router>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;