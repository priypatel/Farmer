import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import useAuthStore from '../../store/authStore'
import { registerWithEmailApi, loginWithGoogleApi } from './api'

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  phone: Yup.string().trim(),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().oneOf(['admin', 'farmer'], 'Select a role').required('Role is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
})

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const navigateByRole = (role) => {
    if (role === 'farmer') navigate('/demand')
    else navigate('/dashboard')
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await registerWithEmailApi(
        values.firstName, values.phone, values.email,
        values.role, values.password, values.confirmPassword
      )
      const { user } = res.data.data
      setAuth(user)
      toast.success('Account created successfully')
      navigateByRole(user.role)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally {
      setSubmitting(false)
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
    <AuthLayout label="SIGN UP">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Account</h2>

      <Formik
        initialValues={{
          firstName: '', phone: '', email: '',
          role: '', password: '', confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            {/* First Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">First Name</label>
                <Field name="firstName" placeholder="First Name" className={inputClass} />
                {errors.firstName && touched.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                <Field name="phone" placeholder="Phone" className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <Field name="email" type="email" placeholder="Email" className={inputClass} />
              {errors.email && touched.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
              <Field as="select" name="role" className={inputClass}>
                <option value="">Select Role</option>
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </Field>
              {errors.role && touched.role && (
                <p className="text-xs text-red-500 mt-1">{errors.role}</p>
              )}
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
                <div className="relative">
                  <Field
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2 top-2 text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </Form>
        )}
      </Formik>

      {/* Sign in link */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Has account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">Quick Signup With</span>
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
          text="signup_with"
        />
      </div>
    </AuthLayout>
  )
}
