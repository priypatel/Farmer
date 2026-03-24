import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import { setPasswordApi } from './api'

const validationSchema = Yup.object({
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Confirm password is required'),
})

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <AuthLayout label="SET PASSWORD">
        <div className="text-center py-8">
          <p className="text-red-500 font-medium">Invalid link. No token provided.</p>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout label="SET PASSWORD">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Password Set Successfully!</h2>
          <p className="text-sm text-gray-600 mb-4">You can now log in with your email and password.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-dark"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await setPasswordApi(token, values.password, values.confirmPassword)
      toast.success('Password set successfully!')
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to set password'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout label="SET PASSWORD">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Set Your Password</h2>
      <p className="text-sm text-gray-500 mb-4">
        Create a password so you can log in with email and password in addition to Google.
      </p>

      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
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
              <Field
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                className={inputClass}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Setting password...' : 'Set Password'}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
