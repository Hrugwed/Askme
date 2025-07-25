// src/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Will store user object { id, username, email }
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true); // For initial authentication check

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // This endpoint checks if the session is active on the server
                const response = await fetch('http://localhost:3000/api/auth/current_user', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include' // Important for sending cookies
                });
                const data = await response.json();

                if (response.ok && data.user) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuthStatus();
    }, []); // Run only once on mount to check initial auth status

    const login = async (username, password) => {
        setAuthLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
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
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
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
        try {
            const response = await fetch('http://localhost:3000/api/auth/logout', {
                method: 'GET', // Or POST, depending on your backend
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