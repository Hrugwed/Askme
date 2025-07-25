// src/AuthModal.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import './AuthModal.css'; // Create this CSS file for styling

const AuthModal = ({ show, onClose }) => {
    const { login, register, authLoading } = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState(''); // Optional, for registration
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isLoginMode) {
            const result = await login(username, password);
            if (result.success) {
                onClose(); // Close modal on success
            } else {
                setError(result.message);
            }
        } else {
            const result = await register(username, password, email);
            if (result.success) {
                onClose(); // Close modal on success
            } else {
                setError(result.message);
            }
        }
    };

    if (!show) {
        return null;
    }

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-content">
                <button className="auth-modal-close-btn" onClick={onClose}>&times;</button>
                <h2>{isLoginMode ? 'Login' : 'Register'}</h2>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={authLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={authLoading}
                        />
                    </div>
                    {!isLoginMode && (
                        <div className="form-group">
                            <label>Email (Optional):</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={authLoading}
                            />
                        </div>
                    )}
                    <button type="submit" disabled={authLoading}>
                        {authLoading ? 'Loading...' : (isLoginMode ? 'Login' : 'Register')}
                    </button>
                </form>
                <p className="toggle-mode">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={() => setIsLoginMode(!isLoginMode)}>
                        {isLoginMode ? ' Register here.' : ' Login here.'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;