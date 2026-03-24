import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { toast } from 'sonner'
import AuthLayout from '../../components/layout/AuthLayout'
import { forgotPasswordApi } from './api'

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
})

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await forgotPasswordApi(values.email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout label="FORGOT PASSWORD">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Check Your Email</h2>
          <p className="text-sm text-gray-600 mb-6">
            If that email is registered, you will receive a reset link shortly.
          </p>
          <Link to="/login" className="text-sm text-primary font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout label="FORGOT PASSWORD">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <Field name="email" type="email" placeholder="Email" className={inputClass} />
              {errors.email && touched.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </Form>
        )}
      </Formik>

      <p className="text-center text-sm text-gray-500 mt-4">
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  )
}
