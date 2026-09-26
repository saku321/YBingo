import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import RequireAuth from './components/RequireAuth'
import SetupNotice from './components/SetupNotice'
import { isSupabaseConfigured } from './lib/supabase'
import Home from './pages/Home'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import ResetPassword from './pages/ResetPassword'
import Editor from './pages/Editor'
import BoardPage from './pages/BoardPage'
import MyCards from './pages/MyCards'
import ProfilePage from './pages/ProfilePage'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Privacy from './pages/legal/Privacy'
import Terms from './pages/legal/Terms'
import Cookies from './pages/legal/Cookies'
import { PageLoader } from './components/ui'

// PayPal's SDK is heavy; only load the premium page when someone opens it.
const Premium = lazy(() => import('./pages/Premium'))

function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="app">
      <Header />
      {isSupabaseConfigured ? <Outlet /> : <SetupNotice />}
      <Footer />
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/new', element: <RequireAuth><Editor /></RequireAuth> },
      { path: '/card/:id', element: <BoardPage /> },
      { path: '/card/:id/edit', element: <RequireAuth><Editor /></RequireAuth> },
      { path: '/me', element: <RequireAuth><MyCards /></RequireAuth> },
      { path: '/u/:username', element: <ProfilePage /> },
      { path: '/settings', element: <RequireAuth><Settings /></RequireAuth> },
      { path: '/premium', element: <Suspense fallback={<PageLoader />}><Premium /></Suspense> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/cookies', element: <Cookies /> },
      // Old routes from the previous version of the app.
      { path: '/bingoCreate', element: <Navigate to="/new" replace /> },
      { path: '/yourCards', element: <Navigate to="/me" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
