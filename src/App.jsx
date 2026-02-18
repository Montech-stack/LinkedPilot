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
    setOffset
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
    mode
  } = useMapData();

  const [selectedNode, setSelectedNode] = useState(null);

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

  const onZoomIn = () => setScale(s => Math.min(3.0, s * 1.2));
  const onZoomOut = () => setScale(s => Math.max(0.3, s / 1.2));
  const onReset = () => {
    setOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setScale(1);
    setSelectedNode(null);
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
        <Toolbar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onReset} />
      )}

      {/* Info Panel */}
      <InfoPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onExpand={handleExpand}
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
                onClick={() => handleExpand(node.id)}
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
