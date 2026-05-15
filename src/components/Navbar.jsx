import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

const links = [
  { to: '/',        label: 'Dashboard' },
  { to: '/log',     label: 'Log'       },
  { to: '/history', label: 'History'   },
  { to: '/export',  label: 'Export'    },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="font-semibold text-gray-800 text-sm">Surgery Logbook</span>
      <div className="flex items-center gap-4">
        {links.map(l => (
          <Link key={l.to} to={l.to}
            className={`text-sm ${pathname === l.to ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}>
            {l.label}
          </Link>
        ))}
        <button onClick={() => signOut(auth)}
          className="text-sm text-gray-400 hover:text-red-500 transition">
          Sign out
        </button>
      </div>
    </nav>
  )
}