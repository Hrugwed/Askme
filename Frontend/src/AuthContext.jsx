import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios'; // Import axios

export const AuthContext = createContext();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Use axios.get for GET requests
                const response = await axios.get(`${API_BASE_URL}/api/auth/current_user`, {
                    withCredentials: true // Equivalent to credentials: 'include'
                });

                // Axios wraps the response in a 'data' property
                if (response.status === 200 && response.data.user) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                // Axios errors have a .response property for server responses
                console.error('Frontend: Error checking auth status:', error.response ? error.response.data : error.message);
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
            // Use axios.post for POST requests
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password }, {
                withCredentials: true // Equivalent to credentials: 'include'
            });

            if (response.status === 200) {
                setUser(response.data.user);
                setIsAuthenticated(true);
                return { success: true, message: response.data.msg };
            } else {
                // This block might not be reached if axios throws on non-2xx status
                return { success: false, message: response.data.msg || 'Login failed' };
            }
        } catch (error) {
            console.error('Frontend: Login error:', error.response ? error.response.data : error.message);
            // Axios automatically throws for 4xx/5xx responses, so we handle it here
            return { success: false, message: error.response?.data?.msg || 'Login failed' };
        } finally {
            setAuthLoading(false);
        }
    };

    const register = async (username, password, email) => {
        setAuthLoading(true);
        try {
            // Use axios.post for POST requests
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { username, password, email }, {
                withCredentials: true // Equivalent to credentials: 'include'
            });

            if (response.status === 201) { // Assuming 201 for successful registration
                setUser(response.data.user);
                setIsAuthenticated(true);
                return { success: true, message: response.data.msg };
            } else {
                // This block might not be reached if axios throws on non-2xx status
                return { success: false, message: response.data.msg || 'Registration failed' };
            }
        } catch (error) {
            console.error('Frontend: Registration error:', error.response ? error.response.data : error.message);
            return { success: false, message: error.response?.data?.msg || 'Registration failed' };
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        setAuthLoading(true);
        try {
            // Use axios.get for GET requests
            const response = await axios.get(`${API_BASE_URL}/api/auth/logout`, {
                withCredentials: true // Equivalent to credentials: 'include'
            });

            if (response.status === 200) {
                setUser(null);
                setIsAuthenticated(false);
                return { success: true, message: response.data.msg };
            } else {
                // This block might not be reached if axios throws on non-2xx status
                return { success: false, message: response.data.msg || 'Logout failed' };
            }
        } catch (error) {
            console.error('Frontend: Logout error:', error.response ? error.response.data : error.message);
            return { success: false, message: error.response?.data?.msg || 'Network error or server unavailable.' };
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
