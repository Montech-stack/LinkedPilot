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



  // Ensure body doesn't scroll in workspace
  useEffect(() => {
    document.body.classList.remove('landing-page');
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNavigate = useCallback((dx, dy) => {
    const current = selectedNode || nodes.find(n => n.id === 'central') || nodes[0];
    if (!current) return;

    // Target angle from direction inputs (0,-1=Up, etc.)
    const targetAngle = Math.atan2(dy, dx);

    let bestNode = null;
    let minDist = Infinity;

    nodes.forEach(node => {
      if (node.id === current.id) return;

      const dist = Math.sqrt(Math.pow(node.x - current.x, 2) + Math.pow(node.y - current.y, 2));
      const angle = Math.atan2(node.y - current.y, node.x - current.x);

      // Angle difference (shortest path)
      let diff = angle - targetAngle;
      while (diff <= -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;

      // Cone of +/- 60 degrees
      if (Math.abs(diff) < Math.PI / 3) {
        if (dist < minDist) {
          minDist = dist;
          bestNode = node;
        }
      }
    });

    if (bestNode) {
      setSelectedNode(bestNode);
      flyTo(bestNode.x, bestNode.y, 1.5, 800);
    }
  }, [nodes, selectedNode, flyTo]);

  const handleFindNode = useCallback(async (conceptText) => {
    // Filter out common stop words to focus on meaningful terms
    const STOP_WORDS = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'that', 'this', 'it', 'are', 'was', 'be', 'has', 'had', 'with', 'as', 'by', 'on', 'at', 'from', 'which', 'how', 'why', 'who', 'do', 'does', 'did']);
    const searchTerms = conceptText.toLowerCase().split(/[\s?.,!]+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t));

    if (searchTerms.length === 0) return false;

    // Score a node by how many meaningful terms match its content
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
        // Bonus for title match (more specific)
        if ((node.data?.title || '').toLowerCase().includes(term)) score += 2;
      });
      return score;
    };

    // 1) Search ALL existing nodes (branches + subs) for best match
    const contentNodes = nodes.filter(n => n.type === 'branch' || n.type === 'sub');
    let bestNode = null;
    let bestScore = 0;
    contentNodes.forEach(n => {
      const s = scoreNode(n);
      if (s > bestScore) { bestScore = s; bestNode = n; }
    });

    // Strong match in existing nodes? Go directly
    if (bestNode && bestScore >= 3) {
      flyTo(bestNode.x, bestNode.y, 1.5, 1200);
      setSelectedNode(bestNode);
      return true;
    }

    // 2) No strong match — expand branches to find the concept
    // Sort branches by relevance score (best first)
    const branches = nodes.filter(n => n.type === 'branch');
    const scoredBranches = branches.map(b => ({ branch: b, score: scoreNode(b) }))
      .sort((a, b) => b.score - a.score);

    // Try expanding branches (most relevant first) until we find a match
    for (const { branch } of scoredBranches) {
      // Skip branches that already have children expanded
      const hasChildren = nodes.some(n => n.type === 'sub' &&
        nodes.some(c => c.type === 'sub' &&
          Math.hypot(c.x - branch.x, c.y - branch.y) < 400));

      const result = await handleExpand(branch.id);

      if (result && result.nodes && result.nodes.length > 0) {
        // Search the newly created nodes
        let expandBest = null;
        let expandBestScore = 0;
        result.nodes.filter(n => n.type === 'sub').forEach(n => {
          const s = scoreNode(n);
          if (s > expandBestScore) { expandBestScore = s; expandBest = n; }
        });

        if (expandBest && expandBestScore >= 2) {
          flyTo(expandBest.x, expandBest.y, 1.5, 1200);
          setSelectedNode(expandBest);
          return true;
        }
      }
    }

    // 3) After expanding all branches, do one final search across ALL nodes
    const allContentNodes = nodes.filter(n => n.type === 'branch' || n.type === 'sub');
    let finalBest = null;
    let finalBestScore = 0;
    allContentNodes.forEach(n => {
      const s = scoreNode(n);
      if (s > finalBestScore) { finalBestScore = s; finalBest = n; }
    });

    if (finalBest) {
      flyTo(finalBest.x, finalBest.y, 1.5, 1200);
      setSelectedNode(finalBest);
      return true;
    }

    return false;
  }, [nodes, flyTo, handleExpand]);

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
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onExpand={handleExpandWrapper}
        onCollapse={collapseNode}
        connections={connections}
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
