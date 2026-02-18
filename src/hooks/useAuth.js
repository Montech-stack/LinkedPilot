import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check initial session
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Get current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = useCallback(async (email, password, fullName) => {
        if (!supabase) {
            setError('Auth service unavailable');
            return { error: { message: 'Auth service unavailable' } };
        }
        setError(null);
        setLoading(true);

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });

        setLoading(false);
        if (authError) {
            setError(authError.message);
            return { error: authError };
        }
        return { data };
    }, []);

    const signIn = useCallback(async (email, password) => {
        if (!supabase) {
            setError('Auth service unavailable');
            return { error: { message: 'Auth service unavailable' } };
        }
        setError(null);
        setLoading(true);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(false);
        if (authError) {
            setError(authError.message);
            return { error: authError };
        }
        return { data };
    }, []);

    const signOut = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!supabase) {
            setError('Auth service unavailable');
            return;
        }
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (authError) setError(authError.message);
    }, []);

    return {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        isAuthenticated: !!user,
        clearError: () => setError(null)
    };
};
