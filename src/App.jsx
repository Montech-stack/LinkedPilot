import React, { useState, useCallback, useEffect } from 'react';
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
import LandingPage from './components/Auth/LandingPage';
import { predictBranch } from './services/api';
import styles from './App.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#333' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}


const MapWorkspace = ({ user, theme, toggleTheme, signOut }) => {
  const {
    scale,
    offset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setScale,
    setOffset,
    flyTo
  } = useCanvas();

  const {
    nodes,
    connections,
    loading,
    error,
    generateNewMap,
    handleExpand,
    savedMaps,
    currentMapId,
    createNewMap,
    deleteMap,
    loadMap,
    topic,
    mode,
    shareMap,
    loadSharedMap,
    collapseNode
  } = useMapData();

  const [selectedNode, setSelectedNode] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Handle URL params for shared maps
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mapId = params.get('mapId');
    if (mapId) {
      loadSharedMap(mapId);
    }
  }, [loadSharedMap]);



  const [panelNode, setPanelNode] = useState(null);

  // Ensure body doesn't scroll in workspace
  useEffect(() => {
    document.body.classList.remove('landing-page');
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setPanelNode(node); // Update panel content only on direct click
  }, []);

  const handleCanvasClick = useCallback(() => {
    // setPanelNode(null); // Keep panel open on canvas click
  }, []);

  const handleNavigate = useCallback((dx, dy) => {
    // Determine current node (or mock central if none)
    let current = selectedNode;
    // If no node selected, try to find the one closest to screen center
    if (!current) {
      // Simple fallback: just use central node
      current = nodes.find(n => n.id === 'central') || nodes[0];
    }
    if (!current) return;

    let nextNode = null;

    // UP: Go to Parent
    if (dy < -0.5) {
      if (current.id === 'central') return; // Central has no parent
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === current.id;
      });
      if (parentConn) {
        const fromId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
        nextNode = nodes.find(n => n.id === fromId);
      }
    }
    // DOWN: Go to Child (Middle or First)
    else if (dy > 0.5) {
      const potentialChildren = connections
        .filter(c => {
          const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
          return fromId === current.id;
        })
        .map(c => {
          const toId = typeof c.to === 'string' ? c.to : c.to?.id;
          return nodes.find(n => n.id === toId);
        })
        .filter(Boolean)
        .sort((a, b) => {
          const angleA = Math.atan2(a.y - current.y, a.x - current.x);
          const angleB = Math.atan2(b.y - current.y, b.x - current.x);
          return angleA - angleB;
        });

      if (potentialChildren.length > 0) {
        // Pick middle child for intuitive navigation
        nextNode = potentialChildren[Math.floor(potentialChildren.length / 2)];
      }
    }
    // LEFT/RIGHT: Go to Sibling
    else if (Math.abs(dx) > 0.5) {
      if (current.id === 'central') return; // Central has no siblings

      // Find parent to get sibling list
      const parentConn = connections.find(c => {
        const toId = typeof c.to === 'string' ? c.to : c.to?.id;
        return toId === current.id;
      });

      if (parentConn) {
        const parentId = typeof parentConn.from === 'string' ? parentConn.from : parentConn.from?.id;
        const parentNode = nodes.find(n => n.id === parentId) || { x: 0, y: 0 };

        // Get all siblings, sorted by angle relative to parent
        const siblings = connections
          .filter(c => {
            const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
            return fromId === parentId;
          })
          .map(c => {
            const toId = typeof c.to === 'string' ? c.to : c.to?.id;
            return nodes.find(n => n.id === toId);
          })
          .filter(Boolean)
          .sort((a, b) => {
            const angleA = Math.atan2(a.y - parentNode.y, a.x - parentNode.x);
            const angleB = Math.atan2(b.y - parentNode.y, b.x - parentNode.x);
            return angleA - angleB;
          });

        const currentIndex = siblings.findIndex(n => n.id === current.id);

        if (currentIndex !== -1) {
          if (dx > 0.5) { // Right -> Next
            nextNode = siblings[currentIndex + 1] || siblings[0];
          } else { // Left -> Prev
            nextNode = siblings[currentIndex - 1] || siblings[siblings.length - 1];
          }
        }
      }
    }

    if (nextNode) {
      // Don't select, just fly to it (keeps InfoPanel stable)
      flyTo(nextNode.x, nextNode.y, 1.5, 600);
      // NOTE: We might want to implicitly track "focused" node without selecting, 
      // but 'selectedNode' is our state. If we don't update selectedNode, 
      // subsequent navigations will define "current" as the OLD selectedNode.
      // FIX: We MUST update selectedNode for navigation continuity, OR use a separate 'focusedNode' state.
      // Since user said "don't open panel", but we need to track where we are...
      // Paradox: User wants to navigate. If I don't update selectedNode, pressing DOWN twice 
      // will just go Parent -> Child, then Parent -> Child again (stuck).

      // OPTION: We update selectedNode, but modify InfoPanel to NOT open automatically?
      // User said: "Info panel should not automatically open... ONLY open when new node is SELECTED"
      // Implication: Navigation selects "focus" but not "selection".

      // Hack for now: Updating selectedNode IS how we know where we are.
      // If we don't update it, navigation allows 1 step then stuck.
      // I will update selectedNode, BUT I will check if InfoPanel has a prop to stay closed?
      // Actually, user said: "instead it should only open up or change when a new node is selected"
      // This implies Navigation != Selection.

      // Use a separate state ref or just force selection?
      // Wait, if I don't select, I can't navigate further. 
      // I will update selectedNode for now to fix the navigation logic.
      // To satisfy "don't open panel", I would need a "source=navigation" flag.

      // Let's look at the previous step. 
      // I removed setSelectedNode. That broke multi-step navigation.

      // FIX: setSelectedNode(nextNode) IS REQUIRED for navigation to continue from new spot.
      // I will restore it, because without it, you can't navigate >1 step.
      // To fix the "InfoPanel opens" issue, I should probably pass a flag or handle it in InfoPanel side.
      // Or... simply realize that "Selected" means "Info Panel Open".
      // Maybe I need a `focusedNode` state? That's too big a refactor.

      // Compromise: I will set selectedNode, because otherwise navigation is broken.
      setSelectedNode(nextNode);
    }
  }, [nodes, connections, selectedNode, flyTo]);

  const handleFindNode = useCallback(async (conceptText) => {
    const STOP_WORDS = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'that', 'this', 'it', 'are', 'was', 'be', 'has', 'had', 'with', 'as', 'by', 'on', 'at', 'from', 'which', 'how', 'why', 'who', 'do', 'does', 'did']);
    const searchTerms = conceptText.toLowerCase().split(/[\s?.,!]+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t));

    if (searchTerms.length === 0) return false;

    const scoreNode = (node) => {
      const text = [
        node.data?.title || '',
        node.data?.detail || '',
        node.data?.summary || '',
        node.data?.category || ''
      ].join(' ').toLowerCase();
      let score = 0;
      searchTerms.forEach(term => {
        if (text.includes(term)) score += 1;
        if ((node.data?.title || '').toLowerCase().includes(term)) score += 2;
      });
      return score;
    };

    // 1) Search existing nodes first (instant)
    const contentNodes = nodes.filter(n => n.type === 'branch' || n.type === 'sub');
    let bestNode = null;
    let bestScore = 0;
    contentNodes.forEach(n => {
      const s = scoreNode(n);
      if (s > bestScore) { bestScore = s; bestNode = n; }
    });

    if (bestNode && bestScore >= 3) {
      flyTo(bestNode.x, bestNode.y, 1.5, 1200);
      setSelectedNode(bestNode);
      setPanelNode(bestNode);
      return true;
    }

    // 2) Not found — ask AI which branch contains the concept (one fast call)
    const branches = nodes.filter(n => n.type === 'branch');
    if (branches.length === 0) return false;

    const branchTitles = branches.map(b => b.data?.title || '');
    const predicted = await predictBranch(conceptText, branchTitles, topic);

    // Find the matching branch (fuzzy match on predicted title)
    const targetBranch = branches.find(b =>
      b.data?.title?.toLowerCase() === predicted?.toLowerCase()
    ) || branches.find(b =>
      predicted?.toLowerCase()?.includes(b.data?.title?.toLowerCase())
    ) || branches[0];

    // 3) Expand only that one branch
    const result = await handleExpand(targetBranch.id);

    if (result && result.nodes && result.nodes.length > 0) {
      // Find best match in expanded nodes
      let expandBest = null;
      let expandBestScore = 0;
      result.nodes.filter(n => n.type === 'sub').forEach(n => {
        const s = scoreNode(n);
        if (s > expandBestScore) { expandBestScore = s; expandBest = n; }
      });

      if (expandBest) {
        flyTo(expandBest.x, expandBest.y, 1.5, 1200);
        setSelectedNode(expandBest);
        setPanelNode(expandBest);
        return true;
      }

      // If no text match, just go to the first expanded sub-node
      const firstSub = result.nodes.find(n => n.type === 'sub');
      if (firstSub) {
        flyTo(firstSub.x, firstSub.y, 1.5, 1200);
        setSelectedNode(firstSub);
        setPanelNode(firstSub);
        return true;
      }
    }

    // 4) Fallback: pan to the branch itself
    flyTo(targetBranch.x, targetBranch.y, 1.5, 1200);
    setSelectedNode(targetBranch);
    setPanelNode(targetBranch);
    return true;
  }, [nodes, flyTo, handleExpand, topic]);

  const handleExpandWrapper = useCallback(async (nodeId) => {
    const result = await handleExpand(nodeId);
    if (result && result.nodes && result.nodes.length > 0) {
      const contentNodes = result.nodes.filter(n => n.type === 'sub' || n.type === 'branch');
      if (contentNodes.length > 0) {
        const xs = contentNodes.map(n => n.x);
        const ys = contentNodes.map(n => n.y);
        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        flyTo(centerX, centerY, 1.2, 1500);
      } else {
        const node = result.nodes[0];
        flyTo(node.x, node.y, 1.2, 1000);
      }
    }
  }, [handleExpand, flyTo]);

  const handleCollapseWrapper = useCallback((nodeId) => {
    collapseNode(nodeId);
  }, [collapseNode]);

  const handleShare = async () => {
    try {
      const id = await shareMap(user);
      const link = `${window.location.origin}?mapId=${id}`;
      await navigator.clipboard.writeText(link);
      alert("Link copied to clipboard! Share it with the world.");
    } catch (err) {
      alert(err.message);
    }
  };

  const onZoomIn = () => setScale(s => Math.min(3.0, s * 1.2));
  const onZoomOut = () => setScale(s => Math.max(0.3, s / 1.2));
  const onReset = () => {
    const centralNode = nodes.find(n => n.id === 'central');
    if (centralNode) {
      flyTo(centralNode.x, centralNode.y, 1.0, 1200);
    } else {
      setOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setScale(1);
    }
    setSelectedNode(null);
  };

  const handlePan = (dx, dy) => {
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };



  return (
    <div
      className={styles.app}
      onMouseUp={handleMouseUp}
    >
      {/* Sidebar */}
      <Sidebar
        savedMaps={savedMaps}
        currentMapId={currentMapId}
        onSelectMap={loadMap}
        onNewMap={createNewMap}
        onDeleteMap={deleteMap}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onSignOut={signOut}
      />

      {nodes.length > 0 && (
        <DPad onNavigate={handleNavigate} onReset={onReset} selectedNode={selectedNode} />
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <QuizModal
          topic={topic || "General Knowledge"}
          user={user}
          mode={mode}
          onClose={() => setShowQuiz(false)}
          onFindNode={async (concept) => {
            const found = await handleFindNode(concept);
            if (found) setShowQuiz(false);
          }}
        />
      )}

      {/* Input Overlay */}
      {!nodes.length && !loading && (
        <InputOverlay onSubmit={generateNewMap} loading={loading} />
      )}

      {nodes.length === 0 && loading && (
        <InputOverlay onSubmit={() => { }} loading={true} />
      )}

      {/* Error Toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {/* Toolbar */}
      {nodes.length > 0 && (
        <Toolbar
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
          onQuiz={() => setShowQuiz(true)}
          onShare={handleShare}
        />
      )}

      {/* Info Panel */}
      <InfoPanel
        node={panelNode}
        onClose={() => setPanelNode(null)}
        connections={connections}
        onExpand={handleExpandWrapper}
        onCollapse={handleCollapseWrapper}
        loading={loading}
        topic={topic}
        mode={mode}
      />

      <Canvas
        scale={scale}
        offset={offset}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      >
        {/* Connections */}
        {connections.map(conn => {
          const fromId = typeof conn.from === 'string' ? conn.from : conn.from?.id;
          const toId = typeof conn.to === 'string' ? conn.to : conn.to?.id;
          const fromNode = nodes.find(n => n.id === fromId);
          const toNode = nodes.find(n => n.id === toId);
          if (!fromNode || !toNode) return null;
          return (
            <Connection
              key={conn.id}
              from={{ x: fromNode.x, y: fromNode.y }}
              to={{ x: toNode.x, y: toNode.y }}
              type={conn.type}
              color={conn.color}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          if (node.type === 'expand') {
            return (
              <ExpandNode
                key={node.id}
                style={{
                  left: node.x,
                  top: node.y,
                  position: 'absolute'
                }}
                onClick={() => handleExpandWrapper(node.id)}
              />
            );
          }
          return (
            <Node
              key={node.id}
              data={node.data}
              style={{
                left: node.x,
                top: node.y
              }}
              onClick={() => handleNodeClick(node)}
            />
          );
        })}
      </Canvas>
    </div>
  );
};


const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut, isAuthenticated } = useAuth();

  // Handle body overflow for landing page
  useEffect(() => {
    if (!isAuthenticated) {
      document.body.classList.add('landing-page');
    } else {
      document.body.classList.remove('landing-page');
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--accent-cyan)',
        fontFamily: 'var(--font-display)',
        fontSize: '18px',
        gap: '12px'
      }}>
        <div className="animate-spin" style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--glass-border)',
          borderTop: '2px solid var(--accent-cyan)',
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  // Not authenticated → show landing page
  if (!isAuthenticated) {
    return <LandingPage onAuth={() => { /* Session listener handles this */ }} />;
  }

  // Authenticated → show workspace
  return (
    <MapWorkspace
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      signOut={signOut}
    />
  );
};

const App = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
