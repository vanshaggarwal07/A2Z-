import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Navbar } from './components/layout/Navbar'
import { BottomNav } from './components/layout/BottomNav'
import { Home } from './pages/Home'
import { Neighborhood } from './pages/Neighborhood'
import { VocalForLocal } from './pages/VocalForLocal'
import { ListItem } from './pages/ListItem'
import { ListingDetail } from './pages/ListingDetail'
import { ProductDetail } from './pages/ProductDetail'
import { Checkout } from './pages/Checkout'
import { GreenWalletPage } from './pages/GreenWalletPage'
import { SellerDashboard } from './pages/SellerDashboard'
import { AccountPage } from './pages/AccountPage'
import { CartPage } from './pages/CartPage'
import { CartCheckout } from './pages/CartCheckout'
import { SellerCentral } from './pages/SellerCentral'
import { WishlistPage } from './pages/WishlistPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProfilePage } from './pages/ProfilePage'
import { AddressesPage } from './pages/AddressesPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { LoginPage } from './pages/LoginPage'
import { useLocation as useLocationHook } from './hooks/useLocation'
import 'leaflet/dist/leaflet.css'

function AppLayout() {
  const { area } = useLocationHook()
  const { pathname } = useLocation()

  const isLoginPage = pathname === '/login'

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {!isLoginPage && <Navbar locationArea={area} />}
      <Routes>
        {/* ── Public routes (browsing without login) ── */}
        <Route path="/"                          element={<Home />} />
        <Route path="/login"                     element={<LoginPage />} />
        <Route path="/neighborhood"              element={<Neighborhood />} />
        <Route path="/neighborhood/listing/:id"  element={<ListingDetail />} />
        <Route path="/product/:id"               element={<ProductDetail />} />
        <Route path="/vocal-for-local"            element={<VocalForLocal />} />
        <Route path="/seller-central"             element={<SellerCentral />} />

        {/* ── Protected routes (require login) ── */}
        <Route path="/neighborhood/list"         element={<ProtectedRoute><ListItem /></ProtectedRoute>} />
        <Route path="/neighborhood/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/cart"                      element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/cart/checkout"              element={<ProtectedRoute><CartCheckout /></ProtectedRoute>} />
        <Route path="/account/wishlist"          element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/orders"                    element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/account/green-credits"     element={<ProtectedRoute><GreenWalletPage /></ProtectedRoute>} />
        <Route path="/account/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/account/addresses"         element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
        <Route path="/account/payments"          element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/account"                   element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/seller/returns"            element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />

        <Route path="*" element={
          <div className="flex flex-col items-center justify-center py-24">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
            <a href="/" className="text-[#007185] hover:underline">Go to Home</a>
          </div>
        }/>
      </Routes>
      {!isLoginPage && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <LanguageProvider>
            <AppLayout />
          </LanguageProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
