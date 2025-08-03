// app/components/sections/AuthHeader.tsx
'use client';

interface AuthHeaderProps {
  user: {
    firstName?: string;
    email: string;
  };
  onLogout: () => void;
}

export default function AuthHeader({ user, onLogout }: AuthHeaderProps) {
  return (
    <header className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-lg text-gray-700">
              Welcome back, {user.firstName || user.email}!
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
