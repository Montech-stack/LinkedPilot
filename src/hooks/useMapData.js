import { useState, useCallback, useReducer, useEffect } from 'react';
import { generateMap, expandBranch } from '../services/api';
import { supabase } from '../services/supabase';

const INITIAL_STATE = {
    nodes: [],
    connections: [],
    loading: false,
    expandingNodeId: null,
    error: null,
    depth: 1,
    topic: '',
    mode: 'research'
};

// Action types
const ACTIONS = {
    START_LOADING: 'START_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_MAP: 'SET_MAP',
    APPEND_CLUSTER: 'APPEND_CLUSTER',
    REMOVE_CHILDREN: 'REMOVE_CHILDREN',
    RESET: 'RESET'
};

const mapReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.START_LOADING:
            return { ...state, loading: true, error: null, expandingNodeId: action.payload };
        case ACTIONS.SET_ERROR:
            return { ...state, loading: false, expandingNodeId: null, error: action.payload };
        case ACTIONS.CLEAR_ERROR:
            return { ...state, error: null };
        case ACTIONS.SET_MAP:
            return {
                ...state,
                loading: false,
                expandingNodeId: null,
                nodes: action.payload.nodes,
                connections: action.payload.connections,
                topic: action.payload.topic,
                mode: action.payload.mode || state.mode,
                depth: 1
            };
        case ACTIONS.APPEND_CLUSTER:
            return {
                ...state,
                loading: false,
                expandingNodeId: null,
                nodes: [...state.nodes, ...action.payload.nodes],
                connections: [...state.connections, ...action.payload.connections],
                depth: state.depth + 1
            };
        case ACTIONS.RESET:
            return INITIAL_STATE;
        case ACTIONS.REMOVE_CHILDREN: {
            const parentId = action.payload;
            // Recursively find all descendant node IDs
            const toRemove = new Set();
            const findDescendants = (pid) => {
                state.connections.forEach(c => {
                    const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
                    const toId = typeof c.to === 'string' ? c.to : c.to?.id;
                    if (fromId === pid && !toRemove.has(toId)) {
                        toRemove.add(toId);
                        findDescendants(toId);
                    }
                });
            };
            findDescendants(parentId);
            return {
                ...state,
                nodes: state.nodes.filter(n => !toRemove.has(n.id)),
                connections: state.connections.filter(c => {
                    const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
                    return fromId !== parentId && !toRemove.has(fromId);
                })
            };
        }
        default:
            return state;
    }
};

// Layout configurations
const LAYOUT = {
    CENTRAL_RADIUS: 0,
    BRANCH_RADIUS: 260,
    SUB_RADIUS: 420,
    EXPAND_RADIUS_FROM_CENTER: 540,
    EXPAND_ANGLE: 135 * (Math.PI / 180),
    EXPANSION_NODE_RADIUS: 220,
    EXPANSION_SPREAD_BASE: 120 * (Math.PI / 180), // Base spread for small counts
    EXPANSION_SPREAD_MAX: 300 * (Math.PI / 180)   // Max spread for large counts
};

export const useMapData = () => {
    // Hook to manage map state and persistence
    // 1. Manage the list of saved maps
    // One-time migration: strip transient fields (error, loading, expandingNodeId) from all stored maps.
    // Existing users may have raw API error text persisted in localStorage — this cleans it up on load.
    const [savedMaps, setSavedMaps] = useState(() => {
        try {
            const item = window.localStorage.getItem('neuronMaps');
            const parsed = item ? JSON.parse(item) : {};
            if (!parsed || typeof parsed !== 'object') return {};
            let dirty = false;
            const cleaned = {};
            for (const [id, entry] of Object.entries(parsed)) {
                if (entry && typeof entry === 'object') {
                    // eslint-disable-next-line no-unused-vars
                    const { error, loading, expandingNodeId, ...clean } = entry;
                    cleaned[id] = clean;
                    if (entry.error !== undefined) dirty = true;
                }
            }
            if (dirty) {
                try { window.localStorage.setItem('neuronMaps', JSON.stringify(cleaned)); } catch {}
            }
            return dirty ? cleaned : parsed;
        } catch (error) {
            console.warn("Error reading neuronMaps:", error);
            return {};
        }
    });

    const [currentMapId, setCurrentMapId] = useState(() => {
        try {
            return window.localStorage.getItem('currentMapId') || null;
        } catch (error) {
            return null;
        }
    });

    // Supabase sync state
    const [user, setUser] = useState(null);
    const [syncEnabled, setSyncEnabled] = useState(false);

    // Get current user on mount
    useEffect(() => {
        if (!supabase) {
            setSyncEnabled(false);
            return;
        }

        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
            setSyncEnabled(!!authUser);
        };

        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authUser) => {
            setUser(authUser);
            setSyncEnabled(!!authUser);
        });

        return () => subscription?.unsubscribe();
    }, []);

    // Supabase sync functions
    const syncMapsToSupabase = useCallback(async (mapsToSync) => {
        if (!supabase || !user) return true; // Not logged in, just save locally

        try {
            // Just broadcast a sync event to other devices (don't store map data)
            const { error } = await supabase
                .from('sync_events')
                .insert({
                    user_id: user.id,
                    event_type: 'map_updated',
                    data: {
                        mapIds: Object.keys(mapsToSync),
                        timestamp: Date.now()
                    }
                });

            if (error) {
                console.error('Error broadcasting sync event:', error);
                return true; // Still success locally - we'll sync when back online
            }
            return true;
        } catch (err) {
            console.error('Failed to broadcast sync:', err);
            return true; // Still save locally
        }
    }, [user]);

    // Subscribe to real-time sync events from other devices
    const setupRealtimeListeners = useCallback(() => {
        if (!supabase || !user) return;

        try {
            // Listen for sync events on this user's channel
            const channel = supabase
                .channel(`user_sync_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'sync_events',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        // When another device syncs, reload maps from localStorage (they handle it locally)
                        // This is just a notification that another device made changes
                        console.log('Sync event received from another device:', payload.new);
                        // App will naturally update since localStorage is shared concept
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Failed to setup realtime listeners:', err);
        }
    }, [user]);

    const deleteMapFromSupabase = useCallback(async (mapId) => {
        if (!supabase || !user) return true; // Not logged in

        try {
            // Just broadcast a deletion event to other devices
            const { error } = await supabase
                .from('sync_events')
                .insert({
                    user_id: user.id,
                    event_type: 'map_deleted',
                    data: {
                        mapId: mapId,
                        timestamp: Date.now()
                    }
                });

            if (error) {
                console.error('Error broadcasting delete event:', error);
                return true; // Still success locally
            }
            return true;
        } catch (err) {
            console.error('Failed to broadcast delete:', err);
            return true; // Still delete locally
        }
    }, [user]);

    // On login: setup real-time sync listeners
    useEffect(() => {
        if (!syncEnabled || !user) return;

        const unsubscribe = setupRealtimeListeners();
        return unsubscribe;
    }, [syncEnabled, user, setupRealtimeListeners]);

    // 2. Initialize current map state based on ID
    // Strip transient fields (error, loading, expandingNodeId) — they should never be restored
    const getInitialState = () => {
        if (currentMapId && savedMaps[currentMapId]) {
            // eslint-disable-next-line no-unused-vars
            const { error, loading, expandingNodeId, ...clean } = savedMaps[currentMapId];
            return { ...INITIAL_STATE, ...clean };
        }
        return INITIAL_STATE;
    };

    const [state, dispatch] = useReducer(mapReducer, getInitialState());

    // Effect: Update state when currentMapId changes (Loading a map)
    useEffect(() => {
        if (currentMapId && savedMaps[currentMapId]) {
            // If we switched map, we need to reset/load the state
            // But useReducer state is independent. We need to force an update or re-initialize.
            // A common pattern is keying the hook or dispatching a LOAD action.
            dispatch({ type: ACTIONS.SET_MAP, payload: savedMaps[currentMapId] });
        } else if (!currentMapId) {
            dispatch({ type: ACTIONS.RESET });
        }
    }, [currentMapId]); // Be careful of dependency loops if savedMaps changes

    // Effect: Auto-save current state to localStorage + broadcast sync event if logged in
    useEffect(() => {
        if (!currentMapId && state.nodes.length > 0) {
            // First save of a new map?
        }

        if (currentMapId && state.nodes.length > 0) {
            // Never persist transient UI state — strip error, loading, expandingNodeId
            // eslint-disable-next-line no-unused-vars
            const { error: _e, loading: _l, expandingNodeId: _en, ...savable } = state;
            const mapData = {
                ...savable,
                lastModified: Date.now(),
                id: currentMapId
            };

            // Save to localStorage first (works offline)
            setSavedMaps(prev => ({
                ...prev,
                [currentMapId]: mapData
            }));
            window.localStorage.setItem('neuronMaps', JSON.stringify({
                ...JSON.parse(window.localStorage.getItem('neuronMaps') || '{}'),
                [currentMapId]: mapData
            }));

            // If logged in: broadcast sync event to other devices (but don't store map data)
            if (syncEnabled && user) {
                syncMapsToSupabase({ [currentMapId]: mapData });
            }
        }
    }, [state, syncEnabled, user, syncMapsToSupabase, currentMapId]);

    // Persist currentMapId
    useEffect(() => {
        if (currentMapId) {
            window.localStorage.setItem('currentMapId', currentMapId);
        } else {
            window.localStorage.removeItem('currentMapId');
        }
    }, [currentMapId]);

    // Helpers
    const createNewMap = () => {
        setCurrentMapId(null);
        dispatch({ type: ACTIONS.RESET });
    };

    const deleteMap = (id) => {
        const deleteFromDB = async () => {
            // Database-first: if user is logged in, delete from Supabase first
            if (syncEnabled && user) {
                const success = await deleteMapFromSupabase(id);
                if (!success) {
                    console.warn('Failed to delete map from Supabase, but removing from local cache');
                }
            }

            // After DB deletion (or if not logged in), update local state
            const newMaps = { ...savedMaps };
            delete newMaps[id];
            setSavedMaps(newMaps);
            window.localStorage.setItem('neuronMaps', JSON.stringify(newMaps));

            if (currentMapId === id) {
                setCurrentMapId(null);
                dispatch({ type: ACTIONS.RESET });
            }
        };

        deleteFromDB();
    };

    const loadMap = (id) => {
        // Allowlist map IDs to prevent prototype pollution (__proto__, constructor, etc.)
        if (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
            setCurrentMapId(id);
        }
    };

    // Helper to convert polar to cartesian
    const polarToCartesian = (radius, angle) => ({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
    });

    const generateNewMap = useCallback(async (topicInput, modeId = 'research', rawDataContent = null) => {
        dispatch({ type: ACTIONS.START_LOADING });
        try {
            const data = await generateMap(topicInput, modeId, rawDataContent);

            // Create new Map ID
            const newId = Date.now().toString();
            setCurrentMapId(newId);

            // ... generation logic ...
            // (Pass through normally, state effect will catch it and save)


            const nodes = [];
            const connections = [];

            // 1. Central Node
            const centralNode = {
                id: 'central',
                type: 'central',
                x: 0,
                y: 0,
                data: {
                    type: 'central',
                    title: data.central.title,
                    icon: data.central.icon,
                    category: 'Core Topic',
                    detail: `Central hub for ${data.central.title}. Explore branches to discover more.`,
                    // Assign random color just for fun or use default
                    color: 'var(--accent-cyan)'
                }
            };
            nodes.push(centralNode);

            // 2. Branch Nodes (6 of them, 60 deg apart)
            data.branches.forEach((branch, i) => {
                const angle = (i * 60) * (Math.PI / 180);
                const pos = polarToCartesian(LAYOUT.BRANCH_RADIUS, angle);

                // Cyclical colors
                const colors = [
                    'var(--accent-cyan)',
                    'var(--accent-purple)',
                    'var(--accent-orange)',
                    'var(--accent-green)',
                    'var(--accent-pink)',
                    'var(--accent-yellow)'
                ];
                const color = colors[i % 6];

                const branchNode = {
                    id: branch.id || `b${i}`,
                    type: 'branch',
                    x: pos.x,
                    y: pos.y,
                    data: { ...branch, color, type: 'branch', branchIndex: i + 1 }
                };
                nodes.push(branchNode);
                connections.push({ from: centralNode.id, to: branchNode.id, type: 'central', id: `c-${centralNode.id}-${branchNode.id}` });

                // 3. Sub Nodes - REMOVED for clarity (User Request)
                // Users will expand branches manually via "Expand with Neuro"
                /* 
                if (branch.children) {
                    branch.children.forEach((child, j) => {
                       // ... logic removed ...
                    });
                }
                */
            });

            // 4. Expand Node completely removed per user request.

            dispatch({
                type: ACTIONS.SET_MAP,
                payload: { nodes, connections, topic: topicInput, mode: modeId }
            });

        } catch (err) {
            console.error('generateNewMap error:', err);
            dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error. Please try again later.' });
        }
    }, []);

    const handleExpand = useCallback(async (targetNodeId) => {
        const targetNode = state.nodes.find(n => n.id === targetNodeId);
        if (!targetNode) return;

        let parentTopic = targetNode.data.title;
        let baseX = targetNode.x;
        let baseY = targetNode.y;
        let baseAngle = 0;

        if (targetNode.type === 'expand') {
            const connection = state.connections.find(c => {
                const toId = typeof c.to === 'string' ? c.to : c.to?.id;
                return toId === targetNode.id;
            });
            const parentId = connection ? (typeof connection.from === 'string' ? connection.from : connection.from?.id) : null;
            const parentNode = parentId ? state.nodes.find(n => n.id === parentId) : state.nodes[0];
            parentTopic = parentNode?.data?.title || state.topic;
            baseAngle = Math.atan2(targetNode.y, targetNode.x);
        } else {
            baseAngle = Math.atan2(targetNode.y, targetNode.x);
            const projectionDist = 180;
            baseX = targetNode.x + projectionDist * Math.cos(baseAngle);
            baseY = targetNode.y + projectionDist * Math.sin(baseAngle);
        }

        dispatch({ type: ACTIONS.START_LOADING, payload: targetNodeId });

        try {
            const newSubTopics = await expandBranch(parentTopic, state.topic, state.mode);

            // Sort by rank if available (1 = most important), keep top 5
            const sortedTopics = [...newSubTopics].sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 5);

            const newNodes = [];
            const newConnections = [];
            const count = sortedTopics.length;

            // Dynamic layout: adapt spread and radius based on count
            const spread = Math.min(
                LAYOUT.EXPANSION_SPREAD_MAX,
                LAYOUT.EXPANSION_SPREAD_BASE + (count - 3) * (15 * Math.PI / 180)
            );
            const radius = LAYOUT.EXPANSION_NODE_RADIUS + Math.max(0, (count - 5) * 20);

            sortedTopics.forEach((topic, i) => {
                // Evenly distribute across the spread arc
                const offsetAngle = count === 1
                    ? 0
                    : ((i / (count - 1)) - 0.5) * spread;
                const angle = baseAngle + offsetAngle;

                const centerX = targetNode.type === 'expand' ? targetNode.x : baseX;
                const centerY = targetNode.type === 'expand' ? targetNode.y : baseY;

                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const node = {
                    id: `exp-${Date.now()}-${i}`,
                    type: 'sub',
                    x,
                    y,
                    data: {
                        ...topic,
                        rank: topic.rank || (i + 1),
                        color: targetNode.data.color || 'var(--accent-cyan)',
                        type: 'sub'
                    }
                };

                newNodes.push(node);
                newConnections.push({
                    from: targetNode.id,
                    to: node.id,
                    type: 'sub',
                    color: targetNode.data.color || 'var(--accent-cyan)',
                    id: `c-${targetNode.id}-${node.id}`
                });
            });

            // Spawn new expand node further out logic removed completely.

            dispatch({
                type: ACTIONS.APPEND_CLUSTER,
                payload: { nodes: newNodes, connections: newConnections }
            });

            return { nodes: newNodes, connections: newConnections };

        } catch (err) {
            console.error('handleExpand error:', err);
            dispatch({ type: ACTIONS.SET_ERROR, payload: 'Error. Please try again later.' });
            return null;
        }

    }, [state.nodes, state.connections, state.topic]);


    const shareMap = async (user) => {
        if (!state.nodes.length) throw new Error("Map is empty.");

        const mapData = {
            nodes: state.nodes,
            connections: state.connections,
            topic: state.topic,
            mode: state.mode
        };

        if (!supabase) {
            // Local sharing: store snapshot in localStorage with a share key
            const shareId = `share-${Date.now()}`;
            try {
                const shares = JSON.parse(window.localStorage.getItem('neuronShares') || '{}');
                shares[shareId] = mapData;
                window.localStorage.setItem('neuronShares', JSON.stringify(shares));
            } catch (err) {
                console.error("Share save error:", err);
                throw new Error("Map is too large to share locally.");
            }
            return shareId;
        }

        try {
            const { data, error } = await supabase.from('maps').insert({
                user_id: user?.id || null,
                title: state.topic || 'Untitled Map',
                content: mapData,
                is_public: true
            }).select().single();

            if (error) throw error;
            return data.id;
        } catch (err) {
            console.error("Share error:", err);
            throw err;
        }
    };


    const loadSharedMap = useCallback(async (id) => {
        dispatch({ type: ACTIONS.START_LOADING });
        try {
            let mapPayload;

            if (id.startsWith('share-')) {
                // Local share: load from localStorage
                const shares = JSON.parse(window.localStorage.getItem('neuronShares') || '{}');
                const sharedData = shares[id];
                if (!sharedData) throw new Error("Shared map not found or expired.");
                mapPayload = sharedData;
            } else if (supabase) {
                // Supabase share
                const { data, error } = await supabase
                    .from('maps')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Map not found");
                mapPayload = data.content;
            } else {
                throw new Error("Cannot load shared map without a connection.");
            }

            // Fork: save to viewer's own local storage with a new ID
            const forkId = `fork-${Date.now()}`;
            setCurrentMapId(forkId);

            dispatch({
                type: ACTIONS.SET_MAP,
                payload: mapPayload
            });

            // The auto-save effect will persist this fork to localStorage
        } catch (err) {
            console.error("Load shared error:", err);
            dispatch({ type: ACTIONS.SET_ERROR, payload: "Error. Please try again later." });
        }
    }, []);

    const collapseNode = useCallback((nodeId) => {
        dispatch({ type: ACTIONS.REMOVE_CHILDREN, payload: nodeId });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_ERROR });
    }, []);

    // Update topic and/or mode for a saved map without reloading the page
    const updateMapMeta = useCallback((mapId, changes) => {
        if (!mapId || typeof changes !== 'object') return;
        setSavedMaps(prev => {
            if (!prev[mapId]) return prev;
            const updated = {
                ...prev,
                [mapId]: { ...prev[mapId], ...changes, lastModified: Date.now() },
            };
            try { window.localStorage.setItem('neuronMaps', JSON.stringify(updated)); } catch {}
            return updated;
        });
    }, []);

    return {
        ...state,
        generateNewMap,
        handleExpand,
        savedMaps,
        currentMapId,
        createNewMap,
        deleteMap,
        loadMap,
        updateMapMeta,
        shareMap,
        loadSharedMap,
        collapseNode,
        clearError,
        syncEnabled,
        user
    };
};
