import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

// Ensure API_BASE_URL does NOT have a trailing slash
// If VITE_API_BASE_URL is 'http://localhost:3000/' it will be trimmed to 'http://localhost:3000'
// If VITE_API_BASE_URL is 'https://askme-4r17.onrender.com/' it will be trimmed
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log('Frontend: Checking authentication status...');
            const fetchUrl = `${API_BASE_URL}/api/auth/current_user`;
            console.log('Frontend: Fetching current_user from URL:', fetchUrl); // Added URL logging
            try {
                const response = await fetch(fetchUrl, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                console.log('Frontend: current_user response status:', response.status);
                const data = await response.json();
                console.log('Frontend: current_user response data:', data);

                if (response.ok && data.user) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                    console.log('Frontend: User is authenticated.');
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    console.log('Frontend: User is NOT authenticated.');
                }
            } catch (error) {
                console.error('Frontend: Error checking auth status:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
                console.log('Frontend: Auth status check finished.');
            }
        };

        checkAuthStatus();
    }, []); // Empty dependency array means this runs once on mount

    const login = async (username, password) => {
        setAuthLoading(true);
        const fetchUrl = `${API_BASE_URL}/api/auth/login`; // Added URL for login
        console.log('Frontend: Fetching login from URL:', fetchUrl); // Added URL logging
        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true, message: data.msg };
            } else {
                return { success: false, message: data.msg || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error or server unavailable.' };
        } finally {
            setAuthLoading(false);
        }
    };

    const register = async (username, password, email) => {
        setAuthLoading(true);
        const fetchUrl = `${API_BASE_URL}/api/auth/register`; // Added URL for register
        console.log('Frontend: Fetching register from URL:', fetchUrl); // Added URL logging
        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true, message: data.msg };
            } else {
                return { success: false, message: data.msg || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error or server unavailable.' };
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        setAuthLoading(true);
        const fetchUrl = `${API_BASE_URL}/api/auth/logout`; // Added URL for logout
        console.log('Frontend: Fetching logout from URL:', fetchUrl); // Added URL logging
        try {
            const response = await fetch(fetchUrl, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                setUser(null);
                setIsAuthenticated(false);
                return { success: true, message: 'Logged out successfully' };
            } else {
                return { success: false, message: 'Logout failed' };
            }
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Network error or server unavailable.' };
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, authLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
