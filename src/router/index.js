import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/auth'

// Lazy load components
const Login = () => import('../pages/Login.vue')
const Signup = () => import('../pages/Signup.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const Assessment = () => import('../pages/Assessment.vue')
const TemplateLibrary = () => import('../pages/TemplateLibrary.vue')
const Upgrade = () => import('../pages/Upgrade.vue')
const Settings = () => import('../pages/Settings.vue')
const AdminDashboard = () => import('../pages/AdminDashboard.vue')
const ForgotPassword = () => import('../pages/ForgotPassword.vue')
const ResetPassword = () => import('../pages/ResetPassword.vue')
const NotFound = () => import('../pages/NotFound.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup,
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/assessment/:id',
    name: 'Assessment',
    component: Assessment,
    meta: { requiresAuth: true },
  },
  {
    path: '/templates',
    name: 'TemplateLibrary',
    component: TemplateLibrary,
    meta: { requiresAuth: true },
  },
  {
    path: '/upgrade',
    name: 'Upgrade',
    component: Upgrade,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Check auth state before each route
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin

  const user = await authService.getCurrentUser()

  if (requiresAuth && !user) {
    // Redirect to login if auth required
    next('/login')
  } else if (requiresAdmin && user) {
    // Check if user is admin
    if (!user.profile?.is_admin) {
      next('/dashboard')
    } else {
      next()
    }
  } else if (!requiresAuth && user && (to.name === 'Login' || to.name === 'Signup')) {
    // Redirect to dashboard if already logged in
    next('/dashboard')
  } else {
    next()
  }
})

export default router
