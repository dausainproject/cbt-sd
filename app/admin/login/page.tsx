'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Email atau Password salah!')
    } else {
      router.push('/admin/dashboard')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-100">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Login Admin Guru
          </h1>
          <p className="text-slate-500">
            Masuk untuk mengelola sistem ujian
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          <input
            type="email"
            placeholder="Email Admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:outline-none transition"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:outline-none transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition"
          >
            {loading ? 'Mengecek...' : 'Masuk →'}
          </button>

        </form>
      </div>
    </main>
  )
}