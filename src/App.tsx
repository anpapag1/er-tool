import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, ZoomIn, ZoomOut, Maximize, Map } from 'lucide-react';
import LZString from 'lz-string';
import type { Node, Connection, AttributeInput, ViewState, PhysicsConfig } from './types';
import Header from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TutorialOverlay } from './components/TutorialOverlay';
import { useHistory } from './hooks/useHistory';
import { useShare } from './hooks/useShare';
import { useTutorial } from './hooks/useTutorial';

// --- Main Application ---

export default function ERDiagramTool() {
  // --- Tutorial State ---
  const tutorial = useTutorial();
  
  // --- Data State ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // --- History State ---
  const { history, saveHistory, undo, redo } = useHistory(nodes, connections);
  
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridSnapping, setIsGridSnapping] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  
  // --- Selection & View State ---
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, zoom: 1 });
  
  // --- Helper Functions ---
  const snapToGrid = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };
  
  // --- Share Functions ---
  const { handleShare } = useShare(nodes, connections, setShowToast);
  
  // --- History Functions ---
  
  const loadFromURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const diagramParam = params.get('diagram');
    
    if (diagramParam) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(diagramParam);
        if (decompressed) {
          const data = JSON.parse(decompressed);
          if (Array.isArray(data.nodes) && Array.isArray(data.connections)) {
            setNodes(data.nodes);
            setConnections(data.connections);
            data.nodes.forEach((n: Node) => velocities.current[n.id] = { vx: 0, vy: 0 });
            // Clear URL parameter after loading
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      } catch (error) {
        console.error('Failed to load diagram from URL:', error);
        alert('Failed to load shared diagram.');
      }
    }
  }, []);
  
  // --- Interaction State ---
  // MODES: 'IDLE' | 'PANNING' | 'BOX_SELECTING' | 'DRAGGING_NODES'
  const [interactionMode, setInteractionMode] = useState<'IDLE' | 'PANNING' | 'BOX_SELECTING' | 'DRAGGING_NODES'>('IDLE');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Screen coords for Panning, World coords for others
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  
  // --- Physics State ---
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const velocities = useRef<Record<string, { vx: number, vy: number }>>({});
  const animationRef = useRef<number | undefined>(undefined);
  
  // Physics Configuration
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({
      repulsion: 20000,
      collisionRadius: 30,
      damping: 0.8,
      springLength: 60,
      springStiffness: 0.05
  });
  // Ref to hold config for animation loop without triggering re-renders of the loop itself excessively
  const physicsConfigRef = useRef(physicsConfig);
  
  useEffect(() => {
      physicsConfigRef.current = physicsConfig;
  }, [physicsConfig]);
  
  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // --- Refs ---
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [activeTab, setActiveTab] = useState<'ENTITY' | 'RELATIONSHIP'>('ENTITY');
  const [newEntityLabel, setNewEntityLabel] = useState('');
  const [isWeakEntity, setIsWeakEntity] = useState(false);
  const [newAttributes, setNewAttributes] = useState<AttributeInput[]>([
    { id: 'attr_1', label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }
  ]);
  const [relLabel, setRelLabel] = useState('');
  const [relEntity1, setRelEntity1] = useState('');
  const [relEntity2, setRelEntity2] = useState('');
  const [cardinality1, setCardinality1] = useState('1');
  const [cardinality2, setCardinality2] = useState('N');

  // --- Memoized Helpers ---

  // Identify editing context based on SINGLE selection
  const editingEntityId = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    const node = nodes.find(n => n.id === selectedNodeIds[0]);
    if (!node) return null;
    if (node.type === 'ENTITY') return node.id;
    if (node.type === 'ATTRIBUTE') {
       // Check if parent is entity
       const parent = nodes.find(p => p.id === node.parentId);
       if (parent && parent.type === 'ENTITY') return parent.id;
    }
    return null;
  }, [selectedNodeIds, nodes]);

  const editingRelId = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    const node = nodes.find(n => n.id === selectedNodeIds[0]);
    if (!node) return null;
    if (node.type === 'RELATIONSHIP') return node.id;
    if (node.type === 'ATTRIBUTE') {
       // Check if parent is relationship
       const parent = nodes.find(p => p.id === node.parentId);
       if (parent && parent.type === 'RELATIONSHIP') return parent.id;
    }
    return null;
  }, [selectedNodeIds, nodes]);

  // Coordinate Conversion
  const toWorld = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - view.x) / view.zoom;
    const y = (clientY - rect.top - view.y) / view.zoom;
    return { x, y };
  }, [view]);

  // --- Initial Data ---
  useEffect(() => {
    // Try to load from URL first, otherwise start empty
    loadFromURL();
  }, [loadFromURL]);

  // --- Physics Engine ---

  const runPhysicsStep = useCallback(() => {
    if (!isPhysicsEnabled) return;

    setNodes(prevNodes => {
      const newNodes = prevNodes.map(n => ({ ...n }));
      
      // Read current settings from ref
      const { repulsion, collisionRadius, damping, springLength, springStiffness } = physicsConfigRef.current;
      const MAX_VELOCITY = 10;
      
      newNodes.forEach(node => {
        if (!velocities.current[node.id]) velocities.current[node.id] = { vx: 0, vy: 0 };
      });

      // 1. Repulsion Loop
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const n1 = newNodes[i];
          const n2 = newNodes[j];
          
          // Optimization: If neither is an attribute, skip (since entities/rels don't move by physics)
          if (n1.type !== 'ATTRIBUTE' && n2.type !== 'ATTRIBUTE') continue;

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          let distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          
          const force = repulsion / distSq;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          if (dist < collisionRadius) {
              const pushFactor = (collisionRadius - dist) * 0.5;
              fx += (dx / dist) * pushFactor;
              fy += (dy / dist) * pushFactor;
          }

          // Apply forces ONLY to Attributes
          if (n1.type === 'ATTRIBUTE' && (interactionMode !== 'DRAGGING_NODES' || !selectedNodeIds.includes(n1.id))) {
             velocities.current[n1.id].vx += fx;
             velocities.current[n1.id].vy += fy;
          }
          if (n2.type === 'ATTRIBUTE' && (interactionMode !== 'DRAGGING_NODES' || !selectedNodeIds.includes(n2.id))) {
             velocities.current[n2.id].vx -= fx;
             velocities.current[n2.id].vy -= fy;
          }
        }
      }

      // 2. Spring Loop
      connections.forEach(conn => {
        const source = newNodes.find(n => n.id === conn.sourceId);
        const target = newNodes.find(n => n.id === conn.targetId);
        
        if (source && target) {
          // If neither is an attribute, skip physics for this connection
          if (source.type !== 'ATTRIBUTE' && target.type !== 'ATTRIBUTE') return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const offset = dist - springLength;
          const force = offset * springStiffness;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          // Apply forces ONLY to Attributes
          if (source.type === 'ATTRIBUTE' && (interactionMode !== 'DRAGGING_NODES' || !selectedNodeIds.includes(source.id))) {
            velocities.current[source.id].vx += fx;
            velocities.current[source.id].vy += fy;
          }
          if (target.type === 'ATTRIBUTE' && (interactionMode !== 'DRAGGING_NODES' || !selectedNodeIds.includes(target.id))) {
            velocities.current[target.id].vx -= fx;
            velocities.current[target.id].vy -= fy;
          }
        }
      });

      // 3. Update Positions & Damping
      newNodes.forEach(node => {
        // Strict filter: Only update ATTRIBUTES
        if (node.type !== 'ATTRIBUTE') return;

        // Skip dragged items
        if (interactionMode === 'DRAGGING_NODES' && selectedNodeIds.includes(node.id)) return;
        // Skip attributes following dragged parent
        if (interactionMode === 'DRAGGING_NODES' && node.parentId && selectedNodeIds.includes(node.parentId)) return;
        
        const v = velocities.current[node.id];
        v.vx *= damping;
        v.vy *= damping;
        
        if (Math.abs(v.vx) > MAX_VELOCITY) v.vx = Math.sign(v.vx) * MAX_VELOCITY;
        if (Math.abs(v.vy) > MAX_VELOCITY) v.vy = Math.sign(v.vy) * MAX_VELOCITY;

        node.x += v.vx;
        node.y += v.vy;
      });

      return newNodes;
    });

    animationRef.current = requestAnimationFrame(runPhysicsStep);
  }, [isPhysicsEnabled, connections, selectedNodeIds, interactionMode]);

  useEffect(() => {
    if (isPhysicsEnabled) {
      animationRef.current = requestAnimationFrame(runPhysicsStep);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPhysicsEnabled, runPhysicsStep]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Ctrl+A in input fields
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') return;
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo(setNodes, setConnections, setSelectedNodeIds);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo(setNodes, setConnections, setSelectedNodeIds);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          saveHistory();
          setNodes(prev => prev.filter(n => !selectedNodeIds.includes(n.id) && !selectedNodeIds.includes(n.parentId || '')));
          setConnections(prev => prev.filter(c => !selectedNodeIds.includes(c.sourceId) && !selectedNodeIds.includes(c.targetId)));
          setSelectedNodeIds([]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedNodeIds(nodes.map(n => n.id));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeIds, nodes, saveHistory]);

  // --- Event Handling ---

  const handleZoomToFit = () => {
    if (nodes.length === 0) return;

    // Calculate bounding box
    const padding = 100;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom to fit
    const container = containerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const zoomX = containerWidth / width;
    const zoomY = containerHeight / height;
    const newZoom = Math.min(Math.max(0.1, Math.min(zoomX, zoomY)), 4);

    // Center view
    setView({
      x: -centerX * newZoom + containerWidth / 2,
      y: -centerY * newZoom + containerHeight / 2,
      zoom: newZoom
    });
  };

  // Tutorial functions are now handled by useTutorial hook

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom by default with scroll wheel
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(0.1, view.zoom + delta), 4);
    setView(v => ({ ...v, zoom: newZoom }));
  };

  const handleMouseDownBg = (e: React.MouseEvent) => {
    if (e.button === 1 || (e as any).code === 'Space') {
        setInteractionMode('PANNING');
        setDragStart({ x: e.clientX, y: e.clientY });
        return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        setSelectedNodeIds([]);
    }
    setInteractionMode('BOX_SELECTING');
    const worldPos = toWorld(e.clientX, e.clientY);
    setDragStart(worldPos);
    setSelectionBox({ x: worldPos.x, y: worldPos.y, w: 0, h: 0 });
  };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Selection Logic
    let newSelection = [...selectedNodeIds];
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (newSelection.includes(id)) {
            newSelection = newSelection.filter(i => i !== id);
        } else {
            newSelection.push(id);
        }
    } else {
        if (!newSelection.includes(id)) {
            newSelection = [id];
        }
    }
    
    setSelectedNodeIds(newSelection);
    setInteractionMode('DRAGGING_NODES');
    const worldPos = toWorld(e.clientX, e.clientY);
    setDragStart(worldPos);

    // Stop velocity for dragged nodes immediately
    newSelection.forEach(nid => {
        if (velocities.current[nid]) velocities.current[nid] = { vx: 0, vy: 0 };
    });
  };

  // Touch version for dragging nodes
  const handleTouchDownNode = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return; // Only handle single touch
    
    const touch = e.touches[0];
    // Selection Logic
    let newSelection = [...selectedNodeIds];
    if (!newSelection.includes(id)) {
        newSelection = [id];
    }
    
    setSelectedNodeIds(newSelection);
    setInteractionMode('DRAGGING_NODES');
    const worldPos = toWorld(touch.clientX, touch.clientY);
    setDragStart(worldPos);

    // Stop velocity for dragged nodes immediately
    newSelection.forEach(nid => {
        if (velocities.current[nid]) velocities.current[nid] = { vx: 0, vy: 0 };
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionMode === 'PANNING') {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    }
    else if (interactionMode === 'DRAGGING_NODES') {
        const worldPos = toWorld(e.clientX, e.clientY);
        const dx = worldPos.x - dragStart.x;
        const dy = worldPos.y - dragStart.y;
        
        // Logic: Find all nodes that need to move.
        // If an ENTITY or RELATIONSHIP is selected, its ATTRIBUTES should also move automatically.
        const effectiveMovingIds = new Set(selectedNodeIds);
        
        selectedNodeIds.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node && (node.type === 'ENTITY' || node.type === 'RELATIONSHIP')) {
                // Find children attributes
                nodes.forEach(child => {
                    if (child.parentId === id) {
                        effectiveMovingIds.add(child.id);
                    }
                });
            }
        });

        setNodes(prev => prev.map(n => {
            if (effectiveMovingIds.has(n.id)) {
                return { 
                    ...n, 
                    x: n.x + dx, 
                    y: n.y + dy 
                };
            }
            return n;
        }));
        
        // Also kill velocity for indirectly moved nodes
        effectiveMovingIds.forEach(id => {
             if (velocities.current[id]) velocities.current[id] = { vx: 0, vy: 0 };
        });

        setDragStart(worldPos);
    }
    else if (interactionMode === 'BOX_SELECTING') {
        const worldPos = toWorld(e.clientX, e.clientY);
        const x = Math.min(worldPos.x, dragStart.x);
        const y = Math.min(worldPos.y, dragStart.y);
        const w = Math.abs(worldPos.x - dragStart.x);
        const h = Math.abs(worldPos.y - dragStart.y);
        
        setSelectionBox({ x, y, w, h });

        const selected = nodes.filter(n => 
            n.x >= x && n.x <= x + w &&
            n.y >= y && n.y <= y + h
        ).map(n => n.id);
        
        setSelectedNodeIds(selected);
    }
  };

  const handleMouseUp = () => {
    // Save history when dragging ends
    if (interactionMode === 'DRAGGING_NODES') {
        saveHistory();
    }
    
    // Apply grid snapping when drag ends
    if (interactionMode === 'DRAGGING_NODES' && isGridSnapping) {
        setNodes(prev => prev.map(n => {
            if (selectedNodeIds.includes(n.id) || selectedNodeIds.includes(n.parentId || '')) {
                return {
                    ...n,
                    x: snapToGrid(n.x),
                    y: snapToGrid(n.y)
                };
            }
            return n;
        }));
    }
    
    setInteractionMode('IDLE');
    setSelectionBox(null);
  };

  // --- Touch Event Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle single touch for panning
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Check if touch is on canvas (not on sidebar, header, etc.)
      const target = e.target as HTMLElement;
      if (target.tagName === 'svg' || target.tagName === 'g' || (target as HTMLElement).closest('svg')) {
        setInteractionMode('PANNING');
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }
    }
    // Multi-touch for zoom (pinch) - handled in handleTouchMove
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      if (interactionMode === 'PANNING') {
        const dx = touch.clientX - dragStart.x;
        const dy = touch.clientY - dragStart.y;
        setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        setDragStart({ x: touch.clientX, y: touch.clientY });
      } else if (interactionMode === 'DRAGGING_NODES') {
        // Handle node dragging with touch
        const worldPos = toWorld(touch.clientX, touch.clientY);
        const dx = worldPos.x - dragStart.x;
        const dy = worldPos.y - dragStart.y;
        
        // Logic: Find all nodes that need to move.
        // If an ENTITY or RELATIONSHIP is selected, its ATTRIBUTES should also move automatically.
        const effectiveMovingIds = new Set(selectedNodeIds);
        
        selectedNodeIds.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node && (node.type === 'ENTITY' || node.type === 'RELATIONSHIP')) {
                // Find children attributes
                const children = nodes.filter(n => n.parentId === id).map(n => n.id);
                children.forEach(childId => effectiveMovingIds.add(childId));
            }
        });

        // Update node positions
        setNodes(prev => prev.map(n => {
            if (effectiveMovingIds.has(n.id)) {
                return { ...n, x: n.x + dx, y: n.y + dy };
            }
            return n;
        }));

        // Also kill velocity for indirectly moved nodes
        effectiveMovingIds.forEach(id => {
             if (velocities.current[id]) velocities.current[id] = { vx: 0, vy: 0 };
        });

        setDragStart(worldPos);
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // Store previous distance to calculate zoom delta
      if (!(window as any).lastTouchDistance) {
        (window as any).lastTouchDistance = distance;
      } else {
        const delta = (distance - (window as any).lastTouchDistance) * 0.01;
        const newZoom = Math.min(Math.max(0.1, view.zoom + delta), 4);
        setView(v => ({ ...v, zoom: newZoom }));
        (window as any).lastTouchDistance = distance;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    (window as any).lastTouchDistance = null;
    if (e.touches.length === 0) {
      handleMouseUp();
    }
  };
  
  // --- Form Logic ---
  const resetForms = useCallback(() => {
    setNewEntityLabel('');
    setIsWeakEntity(false);
    setNewAttributes([{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }]);
    setRelLabel('');
    setRelEntity1('');
    setRelEntity2('');
    setCardinality1('1');
    setCardinality2('N');
  }, []);

  useEffect(() => {
    if (editingEntityId) {
        setActiveTab('ENTITY');
        const entityNode = nodes.find(n => n.id === editingEntityId);
        if (entityNode) {
            setNewEntityLabel(entityNode.label);
            setIsWeakEntity(!!entityNode.isWeak);
            const attrs = nodes
                .filter(n => n.type === 'ATTRIBUTE' && n.parentId === editingEntityId)
                .map(n => ({ id: n.id, label: n.label, isPrimaryKey: !!n.isPrimaryKey, isMultivalued: !!n.isMultivalued, isDerived: !!n.isDerived }));
            setNewAttributes(attrs.length > 0 ? attrs : [{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }]);
        }
    } else if (editingRelId) {
        setActiveTab('RELATIONSHIP');
        const relNode = nodes.find(n => n.id === editingRelId);
        if (relNode) {
            setRelLabel(relNode.label);
            
            // Load existing attributes for this relationship
            const attrs = nodes
                .filter(n => n.type === 'ATTRIBUTE' && n.parentId === editingRelId)
                .map(n => ({ id: n.id, label: n.label, isPrimaryKey: !!n.isPrimaryKey, isMultivalued: !!n.isMultivalued, isDerived: !!n.isDerived }));
            setNewAttributes(attrs.length > 0 ? attrs : [{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }]);

            const connToRel = connections.find(c => c.targetId === editingRelId);
            const connFromRel = connections.find(c => c.sourceId === editingRelId);
            if (connToRel) {
                setRelEntity1(connToRel.sourceId);
                setCardinality1(connToRel.label || '');
            }
            if (connFromRel) {
                setRelEntity2(connFromRel.targetId);
                setCardinality2(connFromRel.label || '');
            }
        }
    } else {
        resetForms();
    }
  }, [editingEntityId, editingRelId, resetForms]); // FIXED: Removed nodes and connections from dependency array

  // --- Import / Export ---
  const handleExport = () => {
    const data = JSON.stringify({ nodes, connections }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `er_diagram_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;

    // 1. Serialize SVG
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    // Inline crucial styles for text elements because they lose CSS context when serialized
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach(text => {
        text.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        if (text.classList.contains('text-sm')) text.style.fontSize = '14px';
        if (text.classList.contains('text-xs')) text.style.fontSize = '12px';
        if (text.classList.contains('font-bold')) text.style.fontWeight = 'bold';
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    // 2. Prepare Canvas with 2x scale for high quality
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 2; // Higher resolution for better quality
    
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    
    if (!ctx) return;

    // Scale context for high DPI rendering
    ctx.scale(scale, scale);

    // 3. Draw Background (white/slate-100 to avoid transparency issues)
    ctx.fillStyle = '#f1f5f9'; 
    ctx.fillRect(0, 0, svgRect.width, svgRect.height);
    
    // 4. Create Blob URL & Draw
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `er_diagram_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    // Inline styles for text elements
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach(text => {
        text.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        if (text.classList.contains('text-sm')) text.style.fontSize = '14px';
        if (text.classList.contains('text-xs')) text.style.fontSize = '12px';
        if (text.classList.contains('font-bold')) text.style.fontWeight = 'bold';
    });

    // Add background rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', '#f1f5f9');
    svgClone.insertBefore(rect, svgClone.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `er_diagram_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJpeg = () => {
    if (!svgRef.current) return;

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach(text => {
        text.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        if (text.classList.contains('text-sm')) text.style.fontSize = '14px';
        if (text.classList.contains('text-xs')) text.style.fontSize = '12px';
        if (text.classList.contains('font-bold')) text.style.fontWeight = 'bold';
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 2;
    
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff'; // White background for JPEG
    ctx.fillRect(0, 0, svgRect.width, svgRect.height);
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `er_diagram_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleExportPdf = () => {
    if (!svgRef.current) return;

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach(text => {
        text.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        if (text.classList.contains('text-sm')) text.style.fontSize = '14px';
        if (text.classList.contains('text-xs')) text.style.fontSize = '12px';
        if (text.classList.contains('font-bold')) text.style.fontWeight = 'bold';
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 3; // Higher resolution for PDF
    
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, svgRect.width, svgRect.height);
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // Create a new window with the image for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ER Diagram - Print to PDF</title>
                    <style>
                        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
                        img { max-width: 100%; height: auto; }
                        @media print {
                            body { margin: 0; }
                            img { max-width: 100%; height: auto; page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 100);" />
                </body>
                </html>
            `);
            printWindow.document.close();
        }
        
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (Array.isArray(data.nodes) && Array.isArray(data.connections)) {
                  setNodes(data.nodes);
                  setConnections(data.connections);
                  velocities.current = {}; 
                  data.nodes.forEach((n: any) => velocities.current[n.id] = { vx: 0, vy: 0 });
              } else { alert("Invalid file format."); }
          } catch (err) { alert("Failed to parse JSON file."); }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  // --- CRUD Actions ---
  const handleAddAttributeField = () => setNewAttributes([...newAttributes, { id: `attr_temp_${Date.now()}`, label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }]);
  const handleRemoveAttributeField = (index: number) => { const updated = [...newAttributes]; updated.splice(index, 1); setNewAttributes(updated); };
  const handleAttributeChange = (index: number, field: 'label' | 'isPrimaryKey' | 'isMultivalued' | 'isDerived', value: string | boolean) => { 
    const updated = [...newAttributes]; 
    if (field === 'label') { 
      updated[index].label = value as string; 
    } else if (field === 'isPrimaryKey') { 
      updated[index].isPrimaryKey = value as boolean; 
    } else if (field === 'isMultivalued') { 
      updated[index].isMultivalued = value as boolean; 
    } else if (field === 'isDerived') { 
      updated[index].isDerived = value as boolean; 
    } 
    setNewAttributes(updated); 
  };

  // Restart Tutorial
  const restartTutorial = () => {
    tutorial.restartTutorial();
  };

  // Handle keyboard navigation for tutorial
  useEffect(() => {
    if (!tutorial.isActive) return;

    const handleTutorialKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        tutorial.nextStep();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        tutorial.previousStep();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        tutorial.skipTutorial();
      }
    };

    window.addEventListener('keydown', handleTutorialKeydown);
    return () => window.removeEventListener('keydown', handleTutorialKeydown);
  }, [tutorial]);

  const handleSaveEntity = () => {
    if (!newEntityLabel.trim()) return;
    saveHistory(); // Save state before changes
    if (editingEntityId) {
        setNodes(prev => {
            const nextNodes = [...prev];
            const entityIndex = nextNodes.findIndex(n => n.id === editingEntityId);
            if (entityIndex >= 0) nextNodes[entityIndex] = { ...nextNodes[entityIndex], label: newEntityLabel, isWeak: isWeakEntity };

            const existingAttrIds = new Set(prev.filter(n => n.parentId === editingEntityId).map(n => n.id));
            const formAttrIds = new Set<string>();

            newAttributes.forEach((attr, idx) => {
                if (!attr.label.trim()) return;
                
                // Check if this is a new attribute (temp ID or ID not in existing attributes)
                if (attr.id.startsWith('attr_temp') || !existingAttrIds.has(attr.id)) {
                    const newId = `a_${Date.now()}_${idx}`;
                    const parent = nextNodes.find(n => n.id === editingEntityId)!;
                    const angle = Math.random() * Math.PI * 2;
                    nextNodes.push({ id: newId, type: 'ATTRIBUTE', label: attr.label, x: parent.x + Math.cos(angle) * 80, y: parent.y + Math.sin(angle) * 80, parentId: editingEntityId, isPrimaryKey: attr.isPrimaryKey, isMultivalued: attr.isMultivalued, isDerived: attr.isDerived });
                    velocities.current[newId] = { vx: 0, vy: 0 };
                    setConnections(c => [...c, { id: `c_${Date.now()}_${idx}`, sourceId: editingEntityId, targetId: newId }]);
                    formAttrIds.add(newId); // Add the new ID to track it
                } else {
                    // Update existing attribute
                    formAttrIds.add(attr.id);
                    const nodeIdx = nextNodes.findIndex(n => n.id === attr.id);
                    if (nodeIdx >= 0) nextNodes[nodeIdx] = { ...nextNodes[nodeIdx], label: attr.label, isPrimaryKey: attr.isPrimaryKey, isMultivalued: attr.isMultivalued, isDerived: attr.isDerived };
                }
            });

            const toDeleteIds = Array.from(existingAttrIds).filter(id => !formAttrIds.has(id));
            const filteredNodes = nextNodes.filter(n => !toDeleteIds.includes(n.id));
            if (toDeleteIds.length > 0) setConnections(c => c.filter(conn => !toDeleteIds.includes(conn.targetId) && !toDeleteIds.includes(conn.sourceId)));
            return filteredNodes;
        });
    } else {
        const centerX = -view.x/view.zoom + (containerRef.current?.clientWidth || 800)/(2*view.zoom);
        const centerY = -view.y/view.zoom + (containerRef.current?.clientHeight || 600)/(2*view.zoom);
        const snappedX = isGridSnapping ? snapToGrid(centerX) : centerX;
        const snappedY = isGridSnapping ? snapToGrid(centerY) : centerY;
        const entityId = `e_${Date.now()}`;
        const entityNode: Node = { id: entityId, type: 'ENTITY', label: newEntityLabel, x: snappedX, y: snappedY, isWeak: isWeakEntity };
        velocities.current[entityId] = { vx: 0, vy: 0 };
        const newNodes = [entityNode];
        const newConns: Connection[] = [];
        newAttributes.forEach((attr, i) => {
            if (!attr.label.trim()) return;
            const attrId = `a_${Date.now()}_${i}`;
            const angle = (i / newAttributes.length) * Math.PI * 2;
            newNodes.push({ id: attrId, type: 'ATTRIBUTE', label: attr.label, x: entityNode.x + Math.cos(angle)*100, y: entityNode.y + Math.sin(angle)*100, parentId: entityId, isPrimaryKey: attr.isPrimaryKey, isMultivalued: attr.isMultivalued, isDerived: attr.isDerived });
            velocities.current[attrId] = { vx: 0, vy: 0 };
            newConns.push({ id: `c_${Date.now()}_${i}`, sourceId: entityId, targetId: attrId });
        });
        setNodes(prev => [...prev, ...newNodes]);
        setConnections(prev => [...prev, ...newConns]);
        resetForms();
    }
  };

  const handleSaveRelationship = () => {
     if (!relLabel.trim() || !relEntity1 || !relEntity2) return;
     saveHistory(); // Save state before changes
     
     // Determine the ID of the relationship (existing or new)
     const relId = editingRelId || `r_${Date.now()}`;
     
     // Helper needs to be deterministic or run once
     // Need current nodes state to determine what's new.
     // In Create mode, existing nodes for this relationship is empty.
     // In Update mode, it's nodes.filter(n => n.parentId === relId).
     const existingAttrNodes = editingRelId ? nodes.filter(n => n.parentId === relId) : [];
     const existingAttrIds = new Set(existingAttrNodes.map(n => n.id));
     const formAttrIds = new Set<string>();
     
     const newAttrNodes: Node[] = [];
     const newAttrConns: Connection[] = [];
     
     // Position reference: existing relationship node or calculation for new one
     let parentX = 0;
     let parentY = 0;
     
     if (editingRelId) {
         const relNode = nodes.find(n => n.id === editingRelId);
         if (relNode) {
             parentX = relNode.x;
             parentY = relNode.y;
         }
     } else {
         const e1 = nodes.find(n => n.id === relEntity1);
         const e2 = nodes.find(n => n.id === relEntity2);
         if (e1 && e2) {
             parentX = (e1.x + e2.x) / 2;
             parentY = (e1.y + e2.y) / 2;
         }
     }

     newAttributes.forEach((attr, idx) => {
        if (!attr.label.trim()) return;
        
        if (attr.id.startsWith('attr_temp') || !existingAttrIds.has(attr.id)) {
            // New Attribute
            const newId = `a_rel_${Date.now()}_${idx}`;
            const angle = Math.random() * Math.PI * 2;
            const attrNode: Node = {
                id: newId,
                type: 'ATTRIBUTE',
                label: attr.label,
                x: parentX + Math.cos(angle) * 80,
                y: parentY + Math.sin(angle) * 80,
                parentId: relId,
                isPrimaryKey: attr.isPrimaryKey,
                isMultivalued: attr.isMultivalued,
                isDerived: attr.isDerived
            };
            newAttrNodes.push(attrNode);
            velocities.current[newId] = { vx: 0, vy: 0 };
            newAttrConns.push({ id: `c_rel_attr_${Date.now()}_${idx}`, sourceId: relId, targetId: newId });
            formAttrIds.add(newId); // Track the new ID
        } else {
            formAttrIds.add(attr.id);
        }
     });
     
     const toDeleteIds = Array.from(existingAttrIds).filter(id => !formAttrIds.has(id));

     if (editingRelId) {
        // --- UPDATE ---
        setNodes(prev => {
            const nextNodes = prev.map(n => {
                if (n.id === editingRelId) return { ...n, label: relLabel };
                // Update labels of existing attributes
                if (formAttrIds.has(n.id)) {
                     const attrInput = newAttributes.find(a => a.id === n.id);
                     if (attrInput) return { ...n, label: attrInput.label, isPrimaryKey: attrInput.isPrimaryKey, isMultivalued: attrInput.isMultivalued, isDerived: attrInput.isDerived };
                }
                return n;
            }).filter(n => !toDeleteIds.includes(n.id));
            
            return [...nextNodes, ...newAttrNodes];
        });

        setConnections(prev => {
             const updated = prev.filter(c => c.targetId !== editingRelId && c.sourceId !== editingRelId);
             const c1 = { id: `c_${Date.now()}_1`, sourceId: relEntity1, targetId: editingRelId, label: cardinality1 };
             const c2 = { id: `c_${Date.now()}_2`, sourceId: editingRelId, targetId: relEntity2, label: cardinality2 };
             
             // Remove connections to deleted attributes
             const finalConnections = [...updated, c1, c2, ...newAttrConns].filter(c => !toDeleteIds.includes(c.targetId) && !toDeleteIds.includes(c.sourceId));
             return finalConnections;
        });

     } else {
        // --- CREATE ---
        const newRelNode: Node = { id: relId, type: 'RELATIONSHIP', label: relLabel, x: parentX, y: parentY };
        velocities.current[relId] = { vx: 0, vy: 0 };
        
        const c1 = { id: `c_${Date.now()}_1`, sourceId: relEntity1, targetId: relId, label: cardinality1 };
        const c2 = { id: `c_${Date.now()}_2`, sourceId: relId, targetId: relEntity2, label: cardinality2 };
        
        setNodes(prev => [...prev, newRelNode, ...newAttrNodes]);
        setConnections(prev => [...prev, c1, c2, ...newAttrConns]);
        setRelLabel('');
        setNewAttributes([{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false, isMultivalued: false, isDerived: false }]); 
     }
  };

  const deleteSelected = () => {
    if (selectedNodeIds.length === 0) return;
    saveHistory(); // Save state before deletion
    setNodes(nodes.filter(n => !selectedNodeIds.includes(n.id) && !selectedNodeIds.includes(n.parentId || '')));
    setConnections(connections.filter(c => !selectedNodeIds.includes(c.sourceId) && !selectedNodeIds.includes(c.targetId)));
    setSelectedNodeIds([]);
    resetForms();
  };



  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black font-sans text-slate-800 dark:text-gray-100">
      {/* Tutorial Overlay */}
      <TutorialOverlay
        isActive={tutorial.isActive}
        currentStep={tutorial.getCurrentStep()}
        stepNumber={tutorial.currentStep + 1}
        totalSteps={tutorial.steps.length}
        onNext={tutorial.nextStep}
        onPrevious={tutorial.previousStep}
        onSkip={tutorial.skipTutorial}
        progress={tutorial.getProgress()}
      />
      
      {/* Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        history={history}
        onUndo={() => undo(setNodes, setConnections, setSelectedNodeIds)}
        onRedo={() => redo(setNodes, setConnections, setSelectedNodeIds)}
        isPhysicsEnabled={isPhysicsEnabled}
        setIsPhysicsEnabled={setIsPhysicsEnabled}
        isGridSnapping={isGridSnapping}
        setIsGridSnapping={setIsGridSnapping}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        nodes={nodes}
        onShare={handleShare}
        onExportJson={handleExport}
        onExportPng={handleExportPng}
        onExportJpeg={handleExportJpeg}
        onExportSvg={handleExportSvg}
        onExportPdf={handleExportPdf}
        onLoad={handleFileChange}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        physicsConfig={physicsConfig}
        setPhysicsConfig={setPhysicsConfig}
        onRestartTutorial={restartTutorial}
        onStartTutorial={tutorial.startTutorial}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        fileInputRef={fileInputRef}
      />

      <div className="relative w-full h-full overflow-hidden">
        
        {/* Main Canvas */}
        <div ref={containerRef} className="w-full h-full bg-gray-50 dark:bg-black overflow-hidden cursor-crosshair touch-none"
             onMouseUp={handleMouseUp}
             onTouchEnd={handleTouchEnd}
             onMouseMove={handleMouseMove}
             onTouchMove={handleTouchMove}
             onMouseDown={handleMouseDownBg}
             onTouchStart={handleTouchStart}
             onWheel={handleWheel}
        >
        
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="absolute inset-0 md:inset-auto md:top-0 md:left-0 md:w-auto md:h-auto pointer-events-none md:pointer-events-auto z-10">
            <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedNodeIds={selectedNodeIds}
            nodes={nodes}
            newEntityLabel={newEntityLabel}
            setNewEntityLabel={setNewEntityLabel}
            isWeakEntity={isWeakEntity}
            setIsWeakEntity={setIsWeakEntity}
            editingEntityId={editingEntityId}
            relLabel={relLabel}
            setRelLabel={setRelLabel}
            relEntity1={relEntity1}
            setRelEntity1={setRelEntity1}
            relEntity2={relEntity2}
            setRelEntity2={setRelEntity2}
            cardinality1={cardinality1}
            setCardinality1={setCardinality1}
            cardinality2={cardinality2}
            setCardinality2={setCardinality2}
            editingRelId={editingRelId}
            newAttributes={newAttributes}
            handleAddAttributeField={handleAddAttributeField}
            handleRemoveAttributeField={handleRemoveAttributeField}
            handleAttributeChange={handleAttributeChange}
            handleSaveEntity={handleSaveEntity}
            handleSaveRelationship={handleSaveRelationship}
            deleteSelected={deleteSelected}
            setSelectedNodeIds={setSelectedNodeIds}
            />
          </div>
        )}
           {/* Hero Section - Show when no nodes exist */}
           {nodes.length === 0 && (
             <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all`} style={{
               left: isSidebarOpen ? '24rem' : '0',
               right: '0'
             }}>
               {/* Gradient Orbs Background */}
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
               <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
               
               <div className="text-center px-4 relative z-10">
                 <div className="mb-8 animate-fade-in-up">
                   <h1 className="text-5xl md:text-8xl font-bold text-white/90 mb-2 tracking-tight">
                     ER Diagram
                   </h1>
                   <h2 className="text-6xl md:text-9xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent text-glow" style={{
                     backgroundSize: '200% 100%',
                     animation: 'gradient 8s ease infinite'
                   }}>
                     BUILDER
                   </h2>
                 </div>
                 <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                   Create beautiful Entity-Relationship diagrams with an intuitive drag-and-drop interface
                 </p>
                 {tutorial.currentStep === null && (
                   <div className="flex justify-center pointer-events-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                     <button
                       onClick={tutorial.startTutorial}
                       className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-500/50"
                     >
                       Start Tutorial
                     </button>
                   </div>
                 )}
               </div>
             </div>
           )}
           
           {/* Grid */}
           {showGrid && (
           <div className="absolute inset-0 opacity-25 pointer-events-none" 
                style={{ 
                    backgroundImage: `radial-gradient(${isDarkMode ? '#9ca3af' : '#64748b'} 1.5px, transparent 1.5px)`, 
                    backgroundSize: `${gridSize * view.zoom}px ${gridSize * view.zoom}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`
                }}>
           </div>
           )}

           {/* Toolbar */}
           <div className={`absolute bottom-4 md:bottom-6 left-4 flex bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-2xl shadow-2xl border border-gray-200/20 dark:border-white/10 p-1 gap-1 z-20 flex-wrap w-auto transition-all ${isSidebarOpen ? 'md:left-[calc(24rem+2rem)]' : 'md:left-6'}`} data-tutorial="zoom-controls">
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom * 1.2 }))} className="p-2 hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all" title="Zoom In (Ctrl +)"><ZoomIn size={18} className="md:w-5 md:h-5"/></button>
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom / 1.2 }))} className="p-2 hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all" title="Zoom Out (Ctrl -)"><ZoomOut size={18} className="md:w-5 md:h-5"/></button>
               <button onClick={handleZoomToFit} className="p-2 hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all" title="Zoom to Fit"><Maximize size={18} className="md:w-5 md:h-5"/></button>
               <button onClick={() => setShowMinimap(!showMinimap)} className={`p-2 rounded-xl text-gray-700 dark:text-gray-200 transition-all ${showMinimap ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100/50 dark:hover:bg-white/10'}`} title="Toggle Minimap"><Map size={18} className="md:w-5 md:h-5"/></button>
           </div>
           
           <svg 
            ref={svgRef}
            className="w-full h-full block"
           >
             <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={isDarkMode ? "#e5e7eb" : "#333"} />
                </marker>
             </defs>

             {/* World Group with Transform */}
             <g transform={`translate(${view.x}, ${view.y}) scale(${view.zoom})`}>
                 {connections.map(conn => {
                    const src = nodes.find(n => n.id === conn.sourceId);
                    const tgt = nodes.find(n => n.id === conn.targetId);
                    if (!src || !tgt) return null;

                    // 1. Calculate Midpoint
                    const midX = (src.x + tgt.x) / 2;
                    const midY = (src.y + tgt.y) / 2;

                    // 2. Calculate Normal Vector (Perpendicular to line) for Label "Physics"
                    const dx = tgt.x - src.x;
                    const dy = tgt.y - src.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    // Normal vector (-dy, dx) normalized
                    const nx = -dy / len;
                    const ny = dx / len;
                    
                    // Push label 20px away from the line
                    const labelOffset = 20;
                    const labelX = midX + nx * labelOffset;
                    const labelY = midY + ny * labelOffset;

                    // 3. Determine Line Thickness based on Cardinality
                    const isMany = conn.label === 'N' || conn.label === 'M';
                    const strokeWidth = isMany ? 4 : 1.5;
                    
                    // 4. Check if connection is selected (either endpoint is selected)
                    const isConnSelected = selectedNodeIds.includes(conn.sourceId) || selectedNodeIds.includes(conn.targetId);
                    const connStroke = isConnSelected ? "#2563eb" : (isDarkMode ? "#9ca3af" : "black");
                    const connStrokeWidth = isConnSelected ? (isMany ? 5 : 2.5) : strokeWidth;

                    return (
                        <g key={conn.id}>
                            {/* Connection Line */}
                            <line 
                                x1={src.x} y1={src.y} 
                                x2={tgt.x} y2={tgt.y} 
                                stroke={connStroke} 
                                strokeWidth={connStrokeWidth} 
                                className="transition-all duration-300"
                            />
                            
                            {/* Floating Label Badge */}
                            {conn.label && (
                                <g className="transition-all duration-300">
                                    {/* White background circle "Physical backing" */}
                                    <circle 
                                        cx={labelX} 
                                        cy={labelY} 
                                        r={12} 
                                        fill={isDarkMode ? "#374151" : "white"} 
                                        stroke={isDarkMode ? "#4b5563" : "#e2e8f0"} 
                                        strokeWidth="1"
                                        className="shadow-sm"
                                    />
                                    {/* The Text Label */}
                                    <text 
                                        x={labelX} 
                                        y={labelY} 
                                        textAnchor="middle" 
                                        dy="4" // Vertical center adjustment
                                        fill={isDarkMode ? "#f3f4f6" : "#1f2937"}
                                        className="text-xs font-bold select-none pointer-events-none"
                                    >
                                        {conn.label}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                 })}

                 {nodes.map(node => {
                    const isMatch = searchQuery.trim() !== '' && node.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
                    const highlightStroke = isMatch ? "#f59e0b" : (selectedNodeIds.includes(node.id) ? "#2563eb" : (isDarkMode ? "#e5e7eb" : "black"));
                    const highlightFill = isMatch ? "#fef3c7" : (isDarkMode ? "#374151" : "white");
                    const textColor = isDarkMode ? "#f3f4f6" : "#1f2937";
                    
                    return (
                 <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                    onTouchStart={(e: React.TouchEvent) => handleTouchDownNode(e, node.id)}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: interactionMode === 'DRAGGING_NODES' && !selectedNodeIds.includes(node.id) ? 0.5 : 1 }}
                 >
                     {node.type === 'ENTITY' && (
                     <>
                         <rect x="-60" y="-25" width="120" height="50" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "2"} />
                         {node.isWeak && <rect x="-54" y="-19" width="108" height="38" fill="none" stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "2" : "1.5"} />}
                         <text x="0" y="0" textAnchor="middle" dy="5" fill={textColor} className="text-sm font-bold select-none pointer-events-none">{node.label}</text>
                     </>
                     )}
                     {node.type === 'ATTRIBUTE' && (
                     <>
                         <ellipse cx="0" cy="0" rx="45" ry="25" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "1.5"} strokeDasharray={node.isDerived ? "5,5" : "none"} />
                         {node.isMultivalued && <ellipse cx="0" cy="0" rx="50" ry="30" fill="none" stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "2" : "1"} strokeDasharray={node.isDerived ? "5,5" : "none"} />}
                         <text x="0" y="0" textAnchor="middle" dy="4" fill={textColor} className={`text-xs select-none pointer-events-none ${node.isPrimaryKey ? 'underline' : ''}`} textDecoration={node.isPrimaryKey ? "underline" : "none"}>{node.label}</text>
                     </>
                     )}
                     {node.type === 'RELATIONSHIP' && (
                     <>
                         <polygon points="0,-40 60,0 0,40 -60,0" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "2"} />
                         <text x="0" y="0" textAnchor="middle" dy="4" fill={textColor} className="text-xs font-bold select-none pointer-events-none">{node.label}</text>
                     </>
                     )}
                 </g>
                 );
                 })}

                {/* Selection Box Overlay (Rendered in world space) */}
                {selectionBox && (
                    <rect 
                        x={selectionBox.x} 
                        y={selectionBox.y} 
                        width={selectionBox.w} 
                        height={selectionBox.h} 
                        fill="rgba(37, 99, 235, 0.1)" 
                        stroke="#2563eb" 
                        strokeWidth="1" 
                        vectorEffect="non-scaling-stroke"
                    />
                )}
             </g>
           </svg>
           
           <div className="absolute top-4 right-4 bg-white/5 dark:bg-white/[0.02] backdrop-blur-3xl p-4 rounded-2xl text-xs text-gray-600 dark:text-gray-400 border border-gray-200/20 dark:border-white/10 pointer-events-none space-y-1 z-10 max-w-xs shadow-lg">
              <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">Keyboard Shortcuts</p>
              <p><strong>Ctrl+Z:</strong> Undo</p>
              <p><strong>Ctrl+Y:</strong> Redo</p>
              <p><strong>Ctrl+F:</strong> Search</p>
              <p><strong>Ctrl+A:</strong> Select All</p>
              <p><strong>Delete:</strong> Delete Selected</p>
              <p className="font-bold text-gray-700 dark:text-gray-200 mt-2 mb-1">Mouse Controls</p>
              <p><strong>Space+Drag:</strong> Pan</p>
              <p><strong>Wheel:</strong> Zoom</p>
              <p><strong>Drag Box:</strong> Multi-Select</p>
              <p><strong>Ctrl+Click:</strong> Add to Selection</p>
           </div>
        </div>
        
        {/* All canvas overlays - inside the main canvas container */}
        {/* Minimap */}
        {showMinimap && nodes.length > 0 && (() => {
        // Calculate bounding box of all nodes
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        
        const padding = 50;
        const contentWidth = (maxX - minX) + padding * 2;
        const contentHeight = (maxY - minY) + padding * 2;
        
        // Minimap dimensions
        const minimapWidth = 180;
        const minimapHeight = 120;
        
        // Calculate scale to fit content in minimap
        const scaleX = minimapWidth / contentWidth;
        const scaleY = minimapHeight / contentHeight;
        const minimapScale = Math.min(scaleX, scaleY);
        
        // Calculate viewport rectangle in minimap coordinates
        const vpWidth = (window.innerWidth / view.zoom) * minimapScale;
        const vpHeight = (window.innerHeight / view.zoom) * minimapScale;
        const vpX = ((-view.x / view.zoom - minX + padding) * minimapScale);
        const vpY = ((-view.y / view.zoom - minY + padding) * minimapScale);
        
        const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
          if (isDraggingMinimap) return; // Don't pan if we're dragging
          
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          // Convert click to diagram coordinates
          const diagX = (clickX / minimapScale) + minX - padding - (window.innerWidth / view.zoom / 2);
          const diagY = (clickY / minimapScale) + minY - padding - (window.innerHeight / view.zoom / 2);
          
          setView(v => ({
            ...v,
            x: -diagX * v.zoom,
            y: -diagY * v.zoom
          }));
        };
        
        const handleViewportMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsDraggingMinimap(true);
        };
        
        const handleViewportMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
          if (!isDraggingMinimap) return;
          
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // Convert to diagram coordinates (centered on cursor)
          const diagX = (mouseX / minimapScale) + minX - padding - (window.innerWidth / view.zoom / 2);
          const diagY = (mouseY / minimapScale) + minY - padding - (window.innerHeight / view.zoom / 2);
          
          setView(v => ({
            ...v,
            x: -diagX * v.zoom,
            y: -diagY * v.zoom
          }));
        };
        
        const handleViewportMouseUp = () => {
          setIsDraggingMinimap(false);
        };
        
        return (
          <div className="fixed bottom-20 md:bottom-22 right-4 md:right-6 z-20">
            <svg 
              width={minimapWidth} 
              height={minimapHeight}
              className="border border-gray-200/20 dark:border-white/10 rounded-2xl shadow-2xl bg-white/10 dark:bg-white/5 backdrop-blur-3xl cursor-pointer"
              onClick={handleMinimapClick}
              onMouseMove={handleViewportMouseMove}
              onMouseUp={handleViewportMouseUp}
              onMouseLeave={handleViewportMouseUp}
            >
              {/* Nodes */}
              {nodes.map(node => {
                const x = (node.x - minX + padding) * minimapScale;
                const y = (node.y - minY + padding) * minimapScale;
                const size = 6;
                
                if (node.type === 'ENTITY') {
                  return (
                    <rect
                      key={node.id}
                      x={x - size/2}
                      y={y - size/2}
                      width={size}
                      height={size}
                      fill="#3b82f6"
                      opacity="0.8"
                    />
                  );
                } else if (node.type === 'RELATIONSHIP') {
                  return (
                    <polygon
                      key={node.id}
                      points={`${x},${y-size/2} ${x+size/2},${y} ${x},${y+size/2} ${x-size/2},${y}`}
                      fill="#10b981"
                      opacity="0.8"
                    />
                  );
                } else {
                  return (
                    <circle
                      key={node.id}
                      cx={x}
                      cy={y}
                      r={size/2}
                      fill="#f59e0b"
                      opacity="0.8"
                    />
                  );
                }
              })}
              
              {/* Connections */}
              {connections.map(conn => {
                const from = nodes.find(n => n.id === conn.sourceId);
                const to = nodes.find(n => n.id === conn.targetId);
                if (!from || !to) return null;
                
                const x1 = (from.x - minX + padding) * minimapScale;
                const y1 = (from.y - minY + padding) * minimapScale;
                const x2 = (to.x - minX + padding) * minimapScale;
                const y2 = (to.y - minY + padding) * minimapScale;
                
                return (
                  <line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#94a3b8"
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                );
              })}
              
              {/* Viewport Rectangle */}
              <rect
                x={Math.max(0, Math.min(minimapWidth - vpWidth, vpX))}
                y={Math.max(0, Math.min(minimapHeight - vpHeight, vpY))}
                width={Math.min(vpWidth, minimapWidth)}
                height={Math.min(vpHeight, minimapHeight)}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.8"
                onMouseDown={handleViewportMouseDown}
                className="cursor-move"
              />
            </svg>
          </div>
        );
      })()}
      
      {/* Credits - Always visible */}
      <div className="fixed bottom-4 md:bottom-5 right-4 md:right-6 z-15">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-200">
          <span className="text-xs text-gray-600 dark:text-gray-400">By</span>
          <a 
            href="https://github.com/anpapag1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            @anpapag1
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a 
            href="https://github.com/anpapag1/er-tool" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Source
          </a>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 dark:bg-gray-900/80 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2 z-50 animate-fade-in">
          <Check size={20} className="text-green-400" />
          <span className="font-medium">Share link copied to clipboard!</span>
        </div>
      )}
      
      </div>
      {/* End Main Canvas */}
    </div>
  );
}