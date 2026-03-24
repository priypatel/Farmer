import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import useAuthStore from '../../store/authStore'
import { loginWithEmailApi, loginWithGoogleApi, requestSetPasswordApi } from './api'

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
})

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [sendingLink, setSendingLink] = useState(false)

  const navigateByRole = (role) => {
    if (role === 'farmer') navigate('/demand')
    else navigate('/dashboard')
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await loginWithEmailApi(values.email, values.password)
      const { user } = res.data.data
      setAuth(user)
      toast.success('Login successful')
      navigateByRole(user.role)
    } catch (err) {
      if (err.response?.data?.code === 'PASSWORD_NOT_SET') {
        setNeedsPassword(true)
        setPendingEmail(values.email)
        toast.error(err.response.data.message)
      } else {
        const msg = err.response?.data?.message || 'Login failed'
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetPassword = async () => {
    setSendingLink(true)
    try {
      await requestSetPasswordApi(pendingEmail)
      toast.success('Password set link sent to your email!')
      setNeedsPassword(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send link'
      toast.error(msg)
    } finally {
      setSendingLink(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await loginWithGoogleApi(credentialResponse.credential)
      const { user } = res.data.data
      setAuth(user)
      toast.success('Signed in with Google')
      navigateByRole(user.role)
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed'
      toast.error(msg)
    }
  }

  return (
    <AuthLayout image="/login.png">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

      {needsPassword && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 mb-2">
            You signed up with Google. Set a password to use email login.
          </p>
          <button
            onClick={handleSetPassword}
            disabled={sendingLink}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {sendingLink ? 'Sending...' : 'Send Set Password Link'}
          </button>
        </div>
      )}

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <Field name="email" type="email" placeholder="Email" className={inputClass} />
              {errors.email && touched.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </Form>
        )}
      </Formik>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">Or continue with</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Google */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google sign-in failed')}
          type="standard"
          shape="rectangular"
          theme="outline"
          text="signin_with"
        />
      </div>
    </AuthLayout>
  )
}
