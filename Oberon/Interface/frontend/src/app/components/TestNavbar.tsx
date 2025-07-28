// app/components/TestNavbar.tsx
'use client';

interface TestNavbarProps {
  isLoggedIn?: boolean;
  user?: {
    firstName?: string;
    email: string;
  };
  onLogout?: () => void;
}

const TestNavbar = ({ isLoggedIn = false, user, onLogout }: TestNavbarProps) => {
  console.log('TestNavbar rendered with:', { isLoggedIn, user, hasOnLogout: !!onLogout });

  return (
    <div className="bg-red-100 p-4">
      <h1>TEST NAVBAR</h1>
      <p>isLoggedIn: {isLoggedIn ? 'TRUE' : 'FALSE'}</p>
      <p>user: {user ? `${user.email}` : 'NO USER'}</p>
      <p>onLogout: {onLogout ? 'FUNCTION EXISTS' : 'NO FUNCTION'}</p>
      
      {isLoggedIn && user && (
        <div className="bg-green-200 p-2 mt-2">
          <p>LOGGED IN SECTION RENDERING</p>
          <p>Welcome back, {user.firstName || user.email}!</p>
          {onLogout && (
            <button 
              onClick={() => {
                console.log('Test logout clicked');
                onLogout();
              }}
              className="bg-red-500 text-white px-4 py-2 mt-2"
            >
              LOGOUT BUTTON
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestNavbar;
