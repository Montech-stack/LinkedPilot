import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const fetchIsPro = async (userId) => {
    if (!supabase || !userId) return false;
    const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', userId)
        .single();
    return data?.is_pro ?? false;
};

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPro, setIsPro] = useState(false);

    const [providerToken, setProviderToken] = useState(null);

    // Check initial session
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Get current session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            setProviderToken(session?.provider_token ?? null);
            try {
                if (u) setIsPro(await fetchIsPro(u.id));
            } catch {
                setIsPro(false);
            } finally {
                setLoading(false);
            }
        }).catch(() => setLoading(false));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const u = session?.user ?? null;
                setUser(u);
                setProviderToken(session?.provider_token ?? null);
                try {
                    setIsPro(u ? await fetchIsPro(u.id) : false);
                } catch {
                    setIsPro(false);
                }
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
        setProviderToken(null);
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

    const connectGoogleDrive = useCallback(async () => {
        if (!supabase) {
            setError('Auth service unavailable');
            return;
        }
        // Force a re-authentication with Google to explicitly request the Drive scope.
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                scopes: 'https://www.googleapis.com/auth/drive.readonly'
            }
        });
        if (authError) setError(authError.message);
    }, []);

    return {
        user,
        providerToken,
        loading,
        error,
        isPro,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        connectGoogleDrive,
        isAuthenticated: !!user,
        clearError: () => setError(null)
    };
};
