// app/utils/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid
        return null;
      }
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    
    // Handle different response structures from your backend
    if (data.id && data.email) {
      return data as User;
    } else if (data.user && data.user.id) {
      return data.user as User;
    } else if (data.data && data.data.id) {
      return data.data as User;
    }
    
    return null;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Login failed'
      };
    }

    return data; // Your backend already returns { success, user, token }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error'
    };
  }
}

export async function signupUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Signup failed'
      };
    }

    return data; // Your backend returns { success, user, token }
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'Network error'
    };
  }
}

export async function checkUserConnections(userId: string) {
  try {
    const response = await fetch(`${API_URL}/api/basiq/check-connection/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check connections');
    }

    return response.json();
  } catch (error) {
    console.error('Check connections error:', error);
    throw error;
  }
}

export async function saveBasiqConnection(data: {
  userId: string;
  basiqUserId: string;
  institutionName: string;
  accountIds: string[];
}) {
  try {
    const response = await fetch(`${API_URL}/api/basiq/save-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to save connection');
    }

    return response.json();
  } catch (error) {
    console.error('Save connection error:', error);
    throw error;
  }
}
