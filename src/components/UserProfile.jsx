import React, { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { signOut } from '../lib/supabase';

export default function UserProfile({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    const success = await signOut();
    if (success && onLogout) {
      onLogout();
    }
    setShowDropdown(false);
  };

  if (!user) return null;

  const userInitials = user.user_metadata?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    || user.email?.charAt(0).toUpperCase()
    || 'U';

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#fdf2e7] border border-[#e0d5c1] hover:bg-[#f7ece2] transition-colors"
        title={displayName}
      >
        <div className="w-6 h-6 rounded-full bg-[#c2461f] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
          {userInitials}
        </div>
        <ChevronDown size={13} className={`text-[#59413b] transition-transform shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-[#e0d5c1] rounded-xl shadow-lg z-50">
          {/* User Info */}
          <div className="p-3 border-b border-[#f7ece2]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#c2461f] text-white flex items-center justify-center font-bold">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#201b15] truncate">
                  {displayName}
                </span>
                <span className="text-xs text-[#59413b] truncate">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-sm font-bold text-[#c2461f] hover:bg-[#fdf2e7] transition-colors rounded-b-xl"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
