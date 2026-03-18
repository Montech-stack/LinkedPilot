import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMapData } from './hooks/useMapData';
import { useCanvas } from './hooks/useCanvas';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import Canvas from './components/Canvas/Canvas';
import Node from './components/Node/Node';
import ExpandNode from './components/Node/ExpandNode';
import Connection from './components/Connection/Connection';
import InputOverlay from './components/UI/InputOverlay';
import Toolbar from './components/UI/Toolbar';
import InfoPanel from './components/UI/InfoPanel';
import Sidebar from './components/UI/Sidebar';
import DPad from './components/UI/DPad';
import QuizModal from './components/UI/QuizModal';
import UpgradeModal from './components/UI/UpgradeModal';
import LandingPage from './components/Auth/LandingPage';
import DataConnectModal from './components/UI/DataConnectModal';
import InstallPrompt from './components/UI/InstallPrompt';
import { predictBranch } from './services/api';
import styles from './App.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#333' }}>
          <h1>Something went wrong.</h1>
          <p>Please try again later.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


const MapWorkspace = ({ user, theme, toggleTheme, signOut, auth, isPro }) => {
  const {
    scale, offset, handleWheel,
    handleMouseDown, handleMouseMove, handleMouseUp,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    setScale, setOffset, flyTo, isDragging
  } = useCanvas();

  const {
    nodes, connections, loading, error, expandingNodeId,
    generateNewMap, cancelGenerate, handleExpand, savedMaps, currentMapId,
    createNewMap, deleteMap, loadMap, updateMapMeta, topic, mode, shareMap, loadSharedMap, collapseNode,
    clearError, syncEnabled
  } = useMapData();

  // ── Share modal state — must be declared before the auto-dismiss effect ──
  const [shareState, setShareState] = useState({ loading: false, link: null, copied: false });
  const shareLinkRef = useRef(null);

  // Auto-dismiss errors after 8 seconds
  useEffect(() => {
    if (!error && !shareState.error) return;
    const t = setTimeout(() => {
      clearError();
      setShareState(s => ({ ...s, error: false }));
    }, 8000);
    return () => clearTimeout(t);
  }, [error, shareState.error, clearError]);

  // ── Panel & selection state ───────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelNode, setPanelNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Set of node IDs that currently have children (are expanded)
  const expandedNodeIds = useMemo(() => {
    const ids = new Set();
    connections.forEach(c => {
      const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
      if (fromId && fromId !== 'central') ids.add(fromId);
    });
    return ids;
  }, [connections]);

  // ── Per-node chat persistence (keyed by `${mapId}:${nodeId}`) ─────────
  const [nodeChatStore, setNodeChatStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('neuronNodeChats') || '{}'); } catch { return {}; }
  });
  // Persist chat store to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('neuronNodeChats', JSON.stringify(nodeChatStore)); } catch {}
  }, [nodeChatStore]);

  // Get messages for currently displayed node
  const chatKey = panelNode && currentMapId ? `${currentMapId}:${panelNode.id}` : null;
  const currentMessages = chatKey ? (nodeChatStore[chatKey] || []) : [];

  const handleMessagesChange = useCallback((newMessages) => {
    if (!chatKey) return;
    setNodeChatStore(prev => ({ ...prev, [chatKey]: newMessages }));
  }, [chatKey]);

  const handleClearChat = useCallback(() => {
    if (!chatKey) return;
    setNodeChatStore(prev => ({ ...prev, [chatKey]: [] }));
  }, [chatKey]);

  // ── Other modals ──────────────────────────────────────────────────────
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDataConnect, setShowDataConnect] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editingMap, setEditingMap] = useState(null); // { id, topic, mode }

  // Handle URL params for shared maps
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mapId = params.get('mapId');
    // Allowlist: UUID or alphanumeric slug, max 64 chars — reject anything else
    if (mapId && /^[a-zA-Z0-9_-]{1,64}$/.test(mapId)) loadSharedMap(mapId);
  }, [loadSharedMap]);

  // Remove body scroll
  useEffect(() => { document.body.classList.remove('landing-page'); }, []);

  // ── Build parent chain for a node (from central root → immediate parent) ──
  const getParentChain = useCallback((nodeId) => {
    const chain = [];
    let currentId = nodeId;
    const visited = new Set();
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === currentId;
      });
      if (!parentConn) break;
      const parentId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
      const parentNode = nodes.find(n => n.id === parentId);
      if (!parentNode) break;
      chain.unshift(parentNode.data); // prepend so order is root→parent
      currentId = parentId;
    }
    return chain;
  }, [nodes, connections]);

  const parentChain = panelNode ? getParentChain(panelNode.id) : [];

  // ── Node click handler — opens/updates panel WITHOUT closing it ────────
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setPanelNode(node);
    setPanelOpen(true);
    flyTo(node.x, node.y, Math.max(scale, 1.2), 600);
  }, [flyTo, scale]);

  // ── Close panel (only via X button) ───────────────────────────────────
  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
  }, []);

  // ── Input/data submit ─────────────────────────────────────────────────
  const handleInputSubmit = (submittedTopic, selectedMode) => {
    if (selectedMode === 'data-integration') {
      setShowDataConnect(true);
    } else {
      generateNewMap(submittedTopic, selectedMode);
    }
  };

  const handleDataConnect = (dataPayload) => {
    generateNewMap(dataPayload.topic, 'data-integration', dataPayload.content);
  };

  // ── D-pad / keyboard navigation (moves focus, doesn't touch panel) ────
  const handleNavigate = useCallback((dx, dy) => {
    let current = selectedNode;
    if (!current) current = nodes.find(n => n.id === 'central') || nodes[0];
    if (!current) return;
    let nextNode = null;

    if (dy < -0.5) {
      // UP: parent
      if (current.id === 'central') return;
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === current.id;
      });
      if (parentConn) {
        const fromId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
        nextNode = nodes.find(n => n.id === fromId);
      }
    } else if (dy > 0.5) {
      // DOWN: middle child
      const children = connections
        .filter(c => {
          const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
          return fromId === current.id;
        })
        .map(c => nodes.find(n => n.id === (typeof c.to === 'string' ? c.to : c.to?.id)))
        .filter(Boolean)
        .sort((a, b) => Math.atan2(a.y - current.y, a.x - current.x) - Math.atan2(b.y - current.y, b.x - current.x));
      if (children.length > 0) nextNode = children[Math.floor(children.length / 2)];
    } else if (Math.abs(dx) > 0.5) {
      // LEFT/RIGHT: siblings
      if (current.id === 'central') return;
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === current.id;
      });
      if (parentConn) {
        const parentId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
        const parentNode = nodes.find(n => n.id === parentId) || { x: 0, y: 0 };
        const siblings = connections
          .filter(c => (typeof c.from === 'string' ? c.from : c.from?.id) === parentId)
          .map(c => nodes.find(n => n.id === (typeof c.to === 'string' ? c.to : c.to?.id)))
          .filter(Boolean)
          .sort((a, b) => Math.atan2(a.y - parentNode.y, a.x - parentNode.x) - Math.atan2(b.y - parentNode.y, b.x - parentNode.x));
        const idx = siblings.findIndex(n => n.id === current.id);
        if (idx !== -1) {
          // Right (dx > 0) -> Next (idx + 1), Left (dx < 0) -> Prev (idx - 1)
          nextNode = dx > 0 
            ? (siblings[idx + 1] || siblings[0])
            : (siblings[idx - 1] || siblings[siblings.length - 1]);
        }
      }
    }

    if (nextNode) {
      setSelectedNode(nextNode);
      flyTo(nextNode.x, nextNode.y, 1.4, 500);
    }
  }, [nodes, connections, selectedNode, flyTo]);

  // ── Panel sibling navigation (updates panel content) ──────────────────
  const handlePanelNavigateSibling = useCallback((dir) => {
    const current = panelNode;
    if (!current) return;
    if (current.id === 'central') return;

    const parentConn = connections.find(c => {
      const toId = typeof c.to === 'string' ? c.to : c.to?.id;
      return toId === current.id;
    });
    if (!parentConn) return;

    const parentId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
    const parentNode = nodes.find(n => n.id === parentId) || { x: 0, y: 0 };
    const siblings = connections
      .filter(c => (typeof c.from === 'string' ? c.from : c.from?.id) === parentId)
      .map(c => nodes.find(n => n.id === (typeof c.to === 'string' ? c.to : c.to?.id)))
      .filter(Boolean)
      .sort((a, b) => Math.atan2(a.y - parentNode.y, a.x - parentNode.x) - Math.atan2(b.y - parentNode.y, b.x - parentNode.x));

    const idx = siblings.findIndex(n => n.id === current.id);
    if (idx === -1) return;

    const nextNode = dir > 0
      ? (siblings[idx + 1] || siblings[0])
      : (siblings[idx - 1] || siblings[siblings.length - 1]);

    if (nextNode && nextNode.id !== current.id) {
      setPanelNode(nextNode);
      setSelectedNode(nextNode);
      setPanelOpen(true);
      flyTo(nextNode.x, nextNode.y, Math.max(scale, 1.2), 500);
    }
  }, [panelNode, nodes, connections, flyTo, scale]);

  // ── Panel parent/child nav (from arrow buttons in panel) ─────────────
  const handlePanelNavigate = useCallback((dx, dy) => {
    const current = panelNode;
    if (!current) return;
    let nextNode = null;

    if (dy < -0.5) {
      // Go to parent
      if (current.id === 'central') return;
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === current.id;
      });
      if (parentConn) {
        const fromId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
        nextNode = nodes.find(n => n.id === fromId);
      }
    } else if (dy > 0.5) {
      // Go to middle child
      const children = connections
        .filter(c => (typeof c.from === 'string' ? c.from : c.from?.id) === current.id)
        .map(c => nodes.find(n => n.id === (typeof c.to === 'string' ? c.to : c.to?.id)))
        .filter(Boolean)
        .sort((a, b) => Math.atan2(a.y - current.y, a.x - current.x) - Math.atan2(b.y - current.y, b.x - current.x));
      if (children.length > 0) nextNode = children[Math.floor(children.length / 2)];
    }

    if (nextNode) {
      setPanelNode(nextNode);
      setSelectedNode(nextNode);
      setPanelOpen(true);
      flyTo(nextNode.x, nextNode.y, Math.max(scale, 1.2), 500);
    }
  }, [panelNode, nodes, connections, flyTo, scale]);

  // ── Find node ──────────────────────────────────────────────────────────
  const handleFindNode = useCallback(async (conceptText) => {
    const STOP_WORDS = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'that', 'this', 'it', 'are', 'was', 'be', 'has', 'had', 'with', 'as', 'by', 'on', 'at', 'from', 'which', 'how', 'why', 'who', 'do', 'does', 'did']);
    const searchTerms = conceptText.toLowerCase().split(/[\s?.,!]+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
    if (searchTerms.length === 0) return null;

    const scoreNode = (node) => {
      const text = [node.data?.title || '', node.data?.detail || '', node.data?.summary || '', node.data?.category || ''].join(' ').toLowerCase();
      let score = 0;
      searchTerms.forEach(term => {
        if (text.includes(term)) score += 1;
        if ((node.data?.title || '').toLowerCase().includes(term)) score += 2;
      });
      return score;
    };

    const contentNodes = nodes.filter(n => n.type === 'branch' || n.type === 'sub');
    let bestNode = null, bestScore = 0;
    contentNodes.forEach(n => { const s = scoreNode(n); if (s > bestScore) { bestScore = s; bestNode = n; } });

    if (bestNode && bestScore >= 3) {
      flyTo(bestNode.x, bestNode.y, 1.5, 1000);
      setSelectedNode(bestNode); setPanelNode(bestNode); setPanelOpen(true);
      return bestNode;
    }

    const branches = nodes.filter(n => n.type === 'branch');
    if (branches.length === 0) return null;
    const predicted = await predictBranch(conceptText, branches.map(b => b.data?.title || ''), topic);
    const targetBranch = branches.find(b => b.data?.title?.toLowerCase() === predicted?.toLowerCase())
      || branches.find(b => predicted?.toLowerCase()?.includes(b.data?.title?.toLowerCase()))
      || branches[0];

    const result = await handleExpand(targetBranch.id);
    if (result?.nodes?.length > 0) {
      const subNodes = result.nodes.filter(n => n.type === 'sub');
      let expandBest = null, expandBestScore = -1;
      subNodes.forEach(n => { const s = scoreNode(n); if (s > expandBestScore) { expandBestScore = s; expandBest = n; } });

      const target = (expandBest && expandBestScore > 0) ? expandBest : (subNodes[0] || targetBranch);
      flyTo(target.x, target.y, 1.5, 1000);
      setSelectedNode(target); setPanelNode(target); setPanelOpen(true);
      return target;
    }

    flyTo(targetBranch.x, targetBranch.y, 1.5, 1000);
    setSelectedNode(targetBranch); setPanelNode(targetBranch); setPanelOpen(true);
    return targetBranch;
  }, [nodes, flyTo, handleExpand, topic]);

  // ── Expand node and center view ───────────────────────────────────────
  const handleExpandWrapper = useCallback(async (nodeId) => {
    const result = await handleExpand(nodeId);
    if (result?.nodes?.length > 0) {
      const contentNodes = result.nodes.filter(n => n.type === 'sub' || n.type === 'branch');
      if (contentNodes.length > 0) {
        const xs = contentNodes.map(n => n.x);
        const ys = contentNodes.map(n => n.y);
        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        flyTo(centerX, centerY, 1.15, 1200);
      }
    }
  }, [handleExpand, flyTo]);

  const handleCollapseWrapper = useCallback((nodeId) => {
    collapseNode(nodeId);
  }, [collapseNode]);

  // ── Share ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (shareState.loading) return;
    setShareState({ loading: true, link: null, copied: false });
    try {
      const id = await shareMap(user);
      const link = `${window.location.origin}?mapId=${id}`;
      setShareState({ loading: false, link, copied: false });
      // Focus the link input so users can copy manually on mobile if needed
      setTimeout(() => shareLinkRef.current?.select(), 50);
    } catch {
      setShareState({ loading: false, link: null, copied: false, error: true });
    }
  };

  const handleCopyLink = async () => {
    if (!shareState.link) return;
    try {
      await navigator.clipboard.writeText(shareState.link);
    } catch {
      // Fallback for mobile / insecure contexts: select the input text
      shareLinkRef.current?.select();
      document.execCommand('copy');
    }
    setShareState(s => ({ ...s, copied: true }));
    setTimeout(() => setShareState(s => ({ ...s, copied: false })), 2500);
  };

  const closeShareModal = () => setShareState({ loading: false, link: null, copied: false });

  // ── Zoom buttons ───────────────────────────────────────────────────────
  const onZoomIn = () => {
    const newScale = Math.min(4.0, scale * 1.2);
    const worldCX = (window.innerWidth / 2 - offset.x) / scale;
    const worldCY = (window.innerHeight / 2 - offset.y) / scale;
    flyTo(worldCX, worldCY, newScale, 300);
  };
  const onZoomOut = () => {
    const newScale = Math.max(0.2, scale / 1.2);
    const worldCX = (window.innerWidth / 2 - offset.x) / scale;
    const worldCY = (window.innerHeight / 2 - offset.y) / scale;
    flyTo(worldCX, worldCY, newScale, 300);
  };
  const onReset = () => {
    const centralNode = nodes.find(n => n.id === 'central');
    if (centralNode) flyTo(centralNode.x, centralNode.y, 1.0, 900);
    else { setOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 }); setScale(1); }
    setSelectedNode(null);
  };

  const handlePan = (dx, dy) => {
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  // Handle import: update savedMaps in localStorage
  const handleUpdateMaps = useCallback((updatedMaps) => {
    try {
      window.localStorage.setItem('neuronMaps', JSON.stringify(updatedMaps));
      // Reload the page to pick up the new maps
      window.location.reload();
    } catch (err) {
      console.error("Failed to import maps:", err);
      alert("Error, please try again.");
    }
  }, []);

  return (
    <div
      className={styles.app}
      onMouseUp={handleMouseUp}
      style={{ cursor: 'default' }}
    >
      <Sidebar
        savedMaps={savedMaps}
        currentMapId={currentMapId}
        onSelectMap={loadMap}
        onNewMap={createNewMap}
        onDeleteMap={deleteMap}
        onRequestEdit={(map) => setEditingMap(map)}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onSignOut={signOut}
        onUpdateMaps={handleUpdateMaps}
        syncEnabled={syncEnabled}
        isPro={isPro}
        onUpgrade={() => setShowUpgrade(true)}
      />

      {nodes.length > 0 && (
        <DPad onNavigate={handleNavigate} onReset={onReset} selectedNode={selectedNode} />
      )}

      {showQuiz && (
        <QuizModal
          topic={topic || "General Knowledge"}
          user={user}
          mode={mode}
          onClose={() => setShowQuiz(false)}
          onFindNode={async (concept, questionData) => {
            const foundNode = await handleFindNode(concept);
            if (foundNode) {
              const chatKey = `${currentMapId}:${foundNode.id}`;
              const existingMessages = nodeChatStore[chatKey] || [];
              const newMessage = {
                type: 'ai',
                content: `**Quiz Question:**\n${questionData.question}\n\n**Explanation:**\n${questionData.explanation}`
              };
              const newMessages = [...existingMessages, newMessage];
              setNodeChatStore(prev => ({ ...prev, [chatKey]: newMessages }));
              setShowQuiz(false);
            }
          }}
        />
      )}

      {showDataConnect && (
        <DataConnectModal
          onClose={() => setShowDataConnect(false)}
          onConnect={handleDataConnect}
          auth={auth}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          user={user}
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => {
            setShowUpgrade(false);
            auth.refreshPro();
          }}
        />
      )}

      {/* New map input */}
      {!nodes.length && !loading && !showDataConnect && !editingMap && (
        <InputOverlay onSubmit={handleInputSubmit} loading={loading} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
      )}

      {nodes.length === 0 && loading && !editingMap && (
        <InputOverlay onSubmit={() => { }} loading={true} onCancel={cancelGenerate} />
      )}

      {/* Edit map overlay — shown over existing map */}
      {editingMap && (
        <InputOverlay
          onSubmit={(newTopic, newMode) => {
            updateMapMeta(editingMap.id, { topic: newTopic, mode: newMode });
            setEditingMap(null);
          }}
          loading={false}
          initialTopic={editingMap.topic}
          initialMode={editingMap.mode}
          isEditing
          onCancel={() => setEditingMap(null)}
          isPro={isPro}
          onUpgrade={() => setShowUpgrade(true)}
        />
      )}

      {(error || shareState.error) && (
        <div className={styles.errorToast}>
          <span>Something went wrong. Please try again.</span>
          <button onClick={() => { clearError(); setShareState(s => ({ ...s, error: false })); }} aria-label="Dismiss">✕</button>
        </div>
      )}

      {nodes.length > 0 && (
        <Toolbar
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
          onQuiz={() => setShowQuiz(true)}
          onShare={handleShare}
          shareLoading={shareState.loading}
        />
      )}

      {shareState.link && (
        <div className={styles.shareOverlay} onClick={closeShareModal}>
          <div className={styles.shareCard} onClick={e => e.stopPropagation()}>
            <div className={styles.shareCardHeader}>
              <div className={styles.shareCardTitle}>
                <div className={styles.shareCardIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </div>
                <span>Share this map</span>
              </div>
              <button className={styles.shareCloseBtn} onClick={closeShareModal} aria-label="Close">✕</button>
            </div>
            <p className={styles.shareCardDesc}>Anyone with this link can view your map.</p>
            <div className={styles.shareLinkRow}>
              <input
                ref={shareLinkRef}
                className={styles.shareLinkInput}
                value={shareState.link}
                readOnly
                onClick={e => e.target.select()}
              />
              <button
                className={`${styles.shareCopyBtn} ${shareState.copied ? styles.shareCopyBtnCopied : ''}`}
                onClick={handleCopyLink}
              >
                {shareState.copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <button className={styles.shareDoneBtn} onClick={closeShareModal}>Done</button>
          </div>
        </div>
      )}

      {/* Info Panel — never closes on canvas click, only on X */}
      <InfoPanel
        node={panelNode}
        isOpen={panelOpen}
        onClose={handlePanelClose}
        connections={connections}
        nodes={nodes}
        onExpand={handleExpandWrapper}
        onCollapse={handleCollapseWrapper}
        onNavigate={handlePanelNavigate}
        onNavigateSibling={handlePanelNavigateSibling}
        loading={loading}
        topic={topic}
        mode={mode}
        messages={currentMessages}
        onMessagesChange={handleMessagesChange}
        onClearChat={handleClearChat}
        parentChain={parentChain}
        isPro={isPro}
        onUpgrade={() => setShowUpgrade(true)}
      />

      <Canvas
        scale={scale}
        offset={offset}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={() => { /* Canvas click no longer closes panel */ }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {connections.map(conn => {
          const fromId = typeof conn.from === 'string' ? conn.from : conn.from?.id;
          const toId = typeof conn.to === 'string' ? conn.to : conn.to?.id;
          const fromNode = nodes.find(n => n.id === fromId);
          const toNode = nodes.find(n => n.id === toId);
          if (!fromNode || !toNode) return null;
          return (
            <Connection
              key={conn.id}
              fromX={fromNode.x}
              fromY={fromNode.y}
              toX={toNode.x}
              toY={toNode.y}
              type={conn.type}
              color={conn.color}
            />
          );
        })}

        {nodes.map(node => {
          if (node.type === 'expand') {
            return (
              <ExpandNode
                key={node.id}
                style={{ left: node.x, top: node.y, position: 'absolute' }}
                onClick={() => handleExpandWrapper(node.id)}
              />
            );
          }
          return (
            <Node
              key={node.id}
              nodeData={node}
              isSelected={selectedNode?.id === node.id}
              isExpanded={expandedNodeIds.has(node.id)}
              isLoading={expandingNodeId === node.id}
              onExpand={handleExpandWrapper}
              onCollapse={handleCollapseWrapper}
              onClick={handleNodeClick}
            />
          );
        })}
      </Canvas>
    </div>
  );
};


const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const { user, loading, signOut, isAuthenticated } = auth;

  useEffect(() => {
    if (!isAuthenticated) document.body.classList.add('landing-page');
    else document.body.classList.remove('landing-page');
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', color: 'var(--accent-cyan)',
        fontFamily: 'var(--font-display)', fontSize: '18px', gap: '12px'
      }}>
        <div className="animate-spin" style={{
          width: '24px', height: '24px',
          border: '2px solid var(--glass-border)',
          borderTop: '2px solid var(--accent-cyan)',
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onAuth={() => { }} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <MapWorkspace
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      signOut={signOut}
      auth={auth}
      isPro={auth.isPro}
    />
  );
};

const App = () => (
  <ErrorBoundary>
    <AppContent />
    <InstallPrompt />
  </ErrorBoundary>
);

export default App;
