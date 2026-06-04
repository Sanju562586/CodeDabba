"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    password?: string;
}

interface AuthContextType {
    user: User | null;
    role: string | null;
    isLoading: boolean;
    login: (userData: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = sessionStorage.getItem('access_token');
                const storedUser = sessionStorage.getItem('user');
                const storedRole = sessionStorage.getItem('user_role');

                if (!token || !storedUser) {
                    setIsLoading(false);
                    return;
                }

                // Optimistically restore session from sessionStorage (prevents flash on refresh)
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setRole(storedRole);

                // Validate token against backend to ensure role is current
                try {
                    const { data } = await api.get('/auth/me');
                    if (data && data.id) {
                        // Role may have changed server-side, always trust server
                        const serverUser: User = {
                            id: data.id,
                            email: data.email,
                            role: data.role,
                            name: parsedUser.name, // name is not in JWT payload, keep from sessionStorage
                        };
                        setUser(serverUser);
                        setRole(data.role);
                        sessionStorage.setItem('user_role', data.role);
                        sessionStorage.setItem('user', JSON.stringify(serverUser));
                    }
                } catch {
                    // Token is invalid or expired and refresh also failed — clear session
                    setUser(null);
                    setRole(null);
                    sessionStorage.clear();
                }
            } catch (error) {
                console.error("Failed to restore validation session:", error);
                // Clear potentially corrupted data
                sessionStorage.clear();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (data: any) => {
        // Expected data: { user: User, access_token: string, refresh_token: string }
        if (!data.user) {
            console.error("Login failed: User data missing in response", data);
            return;
        }
        setUser(data.user);
        setRole(data.user.role);
        sessionStorage.setItem('access_token', data.access_token);
        sessionStorage.setItem('refresh_token', data.refresh_token);
        sessionStorage.setItem('user_id', data.user.id);
        sessionStorage.setItem('user_role', data.user.role);
        sessionStorage.setItem('user', JSON.stringify(data.user));
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            setRole(null);
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID"}>
            <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
