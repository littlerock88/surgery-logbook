import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

const studentLinks = [
  { to: '/',        label: 'Dashboard' },
  { to: '/history', label: 'History'   },
  { to: '/export',  label: 'Export'    },
]

const adminLinks = [
  { to: '/admin',     label: 'Admin'     },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function Navbar({ user, isAdmin }) {
  const { pathname } = useLocation()
  const links = isAdmin ? adminLinks : studentLinks

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <span className="font-bold text-gray-800 text-sm tracking-tight hidden sm:block">Surgery Logbook</span>
            <span className="font-bold text-gray-800 text-sm tracking-tight sm:hidden">Logbook</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-0.5">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  pathname === l.to
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}>
                {l.label}
              </Link>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button onClick={() => signOut(auth)}
              className="px-2.5 py-1.5 rounded-lg text-xs sm:text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
              Sign out
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}