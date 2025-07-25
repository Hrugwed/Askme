
import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/current_user`, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
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
    }, []);

    const login = async (username, password) => {
        setAuthLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, { // <--- CHANGED HERE
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
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, { // <--- CHANGED HERE
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
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { // <--- CHANGED HERE
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