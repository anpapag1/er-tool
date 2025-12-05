import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Share2, Pause, Play, Link, Check, X, MousePointer2, ZoomIn, ZoomOut, Maximize, Upload, PanelLeftClose, PanelLeftOpen, Settings, Search, FileDown, ChevronDown, Grid, Undo, Redo, Copy } from 'lucide-react';
import LZString from 'lz-string';

// --- Types ---

type NodeType = 'ENTITY' | 'ATTRIBUTE' | 'RELATIONSHIP';

interface Node {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  isPrimaryKey?: boolean; 
  parentId?: string;
  isWeak?: boolean; // For weak entities
  isMultivalued?: boolean; // For multivalued attributes
  isDerived?: boolean; // For derived attributes
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string; 
}

interface AttributeInput {
  id: string;
  label: string;
  isPrimaryKey: boolean;
  isMultivalued: boolean;
  isDerived: boolean;
}

interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

interface PhysicsConfig {
    repulsion: number;
    collisionRadius: number;
    damping: number;
    springLength: number;
    springStiffness: number;
}

// --- Helper Components ---

const Button = ({ onClick, children, className = "", variant = "primary", icon: Icon, title, disabled }: any) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 focus:ring-red-400",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} title={title}>
      {Icon && <Icon size={18} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

// --- Main Application ---

export default function ERDiagramTool() {
  // --- Data State ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // --- History State ---
  const [history, setHistory] = useState<{ past: Array<{ nodes: Node[], connections: Connection[] }>, future: Array<{ nodes: Node[], connections: Connection[] }> }>({
    past: [],
    future: []
  });
  const MAX_HISTORY = 50;
  
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isGridSnapping, setIsGridSnapping] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [showToast, setShowToast] = useState(false);
  
  // --- Selection & View State ---
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, zoom: 1 });
  
  // --- Helper Functions ---
  const snapToGrid = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };
  
  // --- History Functions ---
  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newPast = [...prev.past, { nodes, connections }];
      // Limit history to MAX_HISTORY items
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [] // Clear future when new action is performed
      };
    });
  }, [nodes, connections]);
  
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    setHistory({
      past: newPast,
      future: [{ nodes, connections }, ...history.future]
    });
    
    setNodes(previous.nodes);
    setConnections(previous.connections);
    setSelectedNodeIds([]);
  }, [history, nodes, connections]);
  
  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, { nodes, connections }],
      future: newFuture
    });
    
    setNodes(next.nodes);
    setConnections(next.connections);
    setSelectedNodeIds([]);
  }, [history, nodes, connections]);
  
  // --- Share Functions ---
  const handleShare = useCallback(() => {
    try {
      const data = JSON.stringify({ nodes, connections });
      const compressed = LZString.compressToEncodedURIComponent(data);
      const url = `${window.location.origin}${window.location.pathname}?diagram=${compressed}`;
      
      navigator.clipboard.writeText(url).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      });
    } catch (error) {
      console.error('Failed to generate share link:', error);
      alert('Failed to generate share link. Diagram might be too large.');
    }
  }, [nodes, connections]);
  
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
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
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

  const handleImportClick = () => { fileInputRef.current?.click(); };
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

  const handleSaveEntity = () => {
    if (!newEntityLabel.trim()) return;
    saveHistory(); // Save state before changes
    if (editingEntityId) {
        setNodes(prev => {
            const nextNodes = [...prev];
            const entityIndex = nextNodes.findIndex(n => n.id === editingEntityId);
            if (entityIndex >= 0) nextNodes[entityIndex] = { ...nextNodes[entityIndex], label: newEntityLabel, isWeak: isWeakEntity };

            const existingAttrIds = prev.filter(n => n.parentId === editingEntityId).map(n => n.id);
            const formAttrIds = new Set<string>();

            newAttributes.forEach((attr, idx) => {
                if (!attr.label.trim()) return;
                if (attr.id.startsWith('attr_temp') || !existingAttrIds.includes(attr.id)) {
                    const newId = `a_${Date.now()}_${idx}`;
                    const parent = nextNodes.find(n => n.id === editingEntityId)!;
                    const angle = Math.random() * Math.PI * 2;
                    nextNodes.push({ id: newId, type: 'ATTRIBUTE', label: attr.label, x: parent.x + Math.cos(angle) * 80, y: parent.y + Math.sin(angle) * 80, parentId: editingEntityId, isPrimaryKey: attr.isPrimaryKey, isMultivalued: attr.isMultivalued, isDerived: attr.isDerived });
                    velocities.current[newId] = { vx: 0, vy: 0 };
                    setConnections(c => [...c, { id: `c_${Date.now()}_${idx}`, sourceId: editingEntityId, targetId: newId }]);
                } else {
                    formAttrIds.add(attr.id);
                    const nodeIdx = nextNodes.findIndex(n => n.id === attr.id);
                    if (nodeIdx >= 0) nextNodes[nodeIdx] = { ...nextNodes[nodeIdx], label: attr.label, isPrimaryKey: attr.isPrimaryKey, isMultivalued: attr.isMultivalued, isDerived: attr.isDerived };
                }
            });

            const toDeleteIds = existingAttrIds.filter(id => !formAttrIds.has(id));
            const filteredNodes = nextNodes.filter(n => !toDeleteIds.includes(n.id));
            if (toDeleteIds.length > 0) setConnections(c => c.filter(conn => !toDeleteIds.includes(conn.targetId)));
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
     const existingAttrIds = existingAttrNodes.map(n => n.id);
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
        
        if (attr.id.startsWith('attr_temp') || !existingAttrIds.includes(attr.id)) {
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
        } else {
            formAttrIds.add(attr.id);
        }
     });
     
     const toDeleteIds = existingAttrIds.filter(id => !formAttrIds.has(id));

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
             const finalConnections = [...updated, c1, c2, ...newAttrConns].filter(c => !toDeleteIds.includes(c.targetId));
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
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
             title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
             {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <Share2 className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">ER Diagram Builder</h1>
          </div>
        </div>

        <div className="flex gap-2">
            <Button variant="ghost" onClick={undo} disabled={history.past.length === 0} icon={Undo} title="Undo (Ctrl+Z)" />
            <Button variant="ghost" onClick={redo} disabled={history.future.length === 0} icon={Redo} title="Redo (Ctrl+Y)" />
            <div className="h-8 w-px bg-gray-200 mx-2 self-center"></div>
            
            <button onClick={() => setIsPhysicsEnabled(!isPhysicsEnabled)} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPhysicsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {isPhysicsEnabled ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isPhysicsEnabled ? "Physics On" : "Physics Off"}
            </button>
            
            <div className="relative">
                <button 
                    onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isGridSnapping ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    title="Grid Options"
                >
                    <Grid size={16} />
                    <span>{isGridSnapping ? "Grid Snap On" : "Grid Snap Off"}</span>
                    <ChevronDown size={14} />
                </button>
                
                {isGridMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border w-48 z-50">
                        <div className="p-2 border-b">
                            <label className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                <span className="text-sm">Enable Snapping</span>
                                <input 
                                    type="checkbox" 
                                    checked={isGridSnapping} 
                                    onChange={(e) => setIsGridSnapping(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                            <label className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                <span className="text-sm">Show Grid</span>
                                <input 
                                    type="checkbox" 
                                    checked={showGrid} 
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                        </div>
                        <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 px-2 py-1">Grid Size</div>
                            <button 
                                onClick={() => { setGridSize(10); setIsGridMenuOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded transition-colors ${gridSize === 10 ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                            >
                                10px (Fine)
                            </button>
                            <button 
                                onClick={() => { setGridSize(20); setIsGridMenuOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded transition-colors ${gridSize === 20 ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                            >
                                20px (Default)
                            </button>
                            <button 
                                onClick={() => { setGridSize(40); setIsGridMenuOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded transition-colors ${gridSize === 40 ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                            >
                                40px (Coarse)
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="h-8 w-px bg-gray-200 mx-2 self-center"></div>
            
            {/* Search Box - Inline */}
            
            {/* Search Box - Inline */}
            {isSearchOpen && (
                <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1 shadow-sm">
                    <Search size={16} className="text-gray-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nodes..."
                        className="w-48 px-1 py-1 text-sm outline-none"
                        autoFocus
                    />
                    <span className="text-xs text-gray-500">
                        {searchQuery.trim() ? `${nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase().trim())).length}/${nodes.length}` : ''}
                    </span>
                    <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </div>
            )}
            
            <Button variant="ghost" onClick={() => setIsSearchOpen(!isSearchOpen)} icon={Search} className={isSearchOpen ? 'bg-gray-200' : ''} title="Search (Ctrl+F)" />
            <Button variant="ghost" onClick={handleShare} icon={Copy} title="Share Link" disabled={nodes.length === 0}>Share</Button>
            <Button variant="ghost" onClick={() => setIsSettingsOpen(!isSettingsOpen)} icon={Settings} className={isSettingsOpen ? 'bg-gray-200' : ''} title="Physics Settings" />
            
            <div className="relative">
                <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors bg-transparent hover:bg-gray-100 text-gray-600"
                    title="Export Options"
                >
                    <FileDown size={18} />
                    <span className="text-sm">Export</span>
                    <ChevronDown size={14} />
                </button>
                
                {isExportMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border w-40 z-50">
                        <button onClick={() => { handleExport(); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg transition-colors">JSON</button>
                        <button onClick={() => { handleExportPng(); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">PNG (High Quality)</button>
                        <button onClick={() => { handleExportJpeg(); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">JPEG</button>
                        <button onClick={() => { handleExportSvg(); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">SVG</button>
                        <button onClick={() => { handleExportPdf(); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg transition-colors">PDF (Print)</button>
                    </div>
                )}
            </div>
            
            <Button variant="ghost" onClick={handleImportClick} icon={Upload} title="Load from JSON">Load</Button>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
        
        {/* Physics Settings Panel (Absolute) */}
        {isSettingsOpen && (
            <div className="absolute top-full right-6 mt-2 bg-white rounded-lg shadow-xl border p-4 w-72 z-50">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700 text-sm">Physics Settings</h3>
                    <button onClick={() => setIsSettingsOpen(false)}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">Repulsion</label>
                            <span className="text-xs text-gray-400">{physicsConfig.repulsion}</span>
                        </div>
                        <input 
                            type="range" min="1000" max="50000" step="1000" 
                            value={physicsConfig.repulsion}
                            onChange={(e) => setPhysicsConfig({...physicsConfig, repulsion: parseInt(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">Target Distance</label>
                            <span className="text-xs text-gray-400">{physicsConfig.springLength}px</span>
                        </div>
                        <input 
                            type="range" min="30" max="200" step="5" 
                            value={physicsConfig.springLength}
                            onChange={(e) => setPhysicsConfig({...physicsConfig, springLength: parseInt(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">Stiffness</label>
                            <span className="text-xs text-gray-400">{physicsConfig.springStiffness}</span>
                        </div>
                        <input 
                            type="range" min="0.01" max="0.2" step="0.01" 
                            value={physicsConfig.springStiffness}
                            onChange={(e) => setPhysicsConfig({...physicsConfig, springStiffness: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">Friction (Damping)</label>
                            <span className="text-xs text-gray-400">{physicsConfig.damping}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="0.99" step="0.01" 
                            value={physicsConfig.damping}
                            onChange={(e) => setPhysicsConfig({...physicsConfig, damping: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>
            </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        {isSidebarOpen && (
        <div className="w-96 bg-white border-r flex flex-col shadow-lg z-10 overflow-hidden flex-shrink-0 transition-all">
          <div className="flex border-b">
            <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ENTITY' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('ENTITY')}>Entity</button>
            <button className={`flex-1 py-3 text-sm font-medium ${activeTab === 'RELATIONSHIP' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('RELATIONSHIP')}>Relationship</button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
             {selectedNodeIds.length > 1 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MousePointer2 size={48} className="mb-4 opacity-20" />
                    <p>{selectedNodeIds.length} items selected</p>
                    <Button variant="danger" className="mt-4" onClick={deleteSelected}>Delete Selection</Button>
                 </div>
             ) : (
                <>
                {activeTab === 'ENTITY' && (
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-800">{editingEntityId ? "Edit Entity Name" : "1. New Entity"}</label>
                            {editingEntityId && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">EDITING</span>}
                        </div>
                        <input type="text" value={newEntityLabel} onChange={(e) => setNewEntityLabel(e.target.value)} placeholder="Entity Name" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50"/>
                        <div className="mt-2 flex items-center gap-2">
                            <input type="checkbox" id="weakEntity" checked={isWeakEntity} onChange={(e) => setIsWeakEntity(e.target.checked)} className="w-4 h-4 text-blue-600 rounded"/>
                            <label htmlFor="weakEntity" className="text-sm text-gray-600 cursor-pointer">Weak Entity (double-bordered)</label>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-800">{editingEntityId ? "Edit Attributes" : "2. Attributes"}</label>
                            <button onClick={handleAddAttributeField} className="text-blue-600 text-xs font-bold hover:underline">+ Add Field</button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {newAttributes.map((attr, idx) => (
                            <div key={attr.id} className="flex flex-col gap-1 border rounded p-2 bg-gray-50">
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <input type="text" value={attr.label} onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} placeholder={`Attr ${idx + 1}`} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white" onKeyDown={(e) => { if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); }}/>
                                    </div>
                                    <button onClick={() => handleRemoveAttributeField(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isPrimaryKey ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} title="Primary Key">PK</div>
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isMultivalued ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} title="Multivalued (double ellipse)">Multi</div>
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isDerived ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} title="Derived (dashed)">Der</div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleSaveEntity} className="w-full py-3" variant={editingEntityId ? "success" : "primary"} icon={editingEntityId ? Check : Plus}>{editingEntityId ? "Update Entity" : "Create Entity"}</Button>
                    {editingEntityId && <Button onClick={() => setSelectedNodeIds([])} className="w-full" variant="ghost">Cancel Edit</Button>}
                </div>
                )}

                {activeTab === 'RELATIONSHIP' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-gray-800">Relationship Name</label>
                        {editingRelId && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">EDITING</span>}
                    </div>
                    <input type="text" value={relLabel} onChange={(e) => setRelLabel(e.target.value)} placeholder="e.g. Enrolls In" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"/>
                    
                    <div className="p-3 bg-gray-50 rounded-lg space-y-3 border">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Entity 1</label>
                                <select value={relEntity1} onChange={(e) => setRelEntity1(e.target.value)} className="w-full px-2 py-2 border rounded text-sm bg-white">
                                <option value="">Select...</option>
                                {nodes.filter(n => n.type === 'ENTITY').map(n => (<option key={n.id} value={n.id}>{n.label}</option>))}
                                </select>
                            </div>
                            <div className="w-16"><select value={cardinality1} onChange={e => setCardinality1(e.target.value)} className="w-full px-1 py-2 border rounded text-sm bg-white text-center"><option value="1">1</option><option value="N">N</option><option value="M">M</option></select></div>
                        </div>
                        <div className="flex justify-center text-gray-400"><Link size={16} /></div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Entity 2</label>
                                <select value={relEntity2} onChange={(e) => setRelEntity2(e.target.value)} className="w-full px-2 py-2 border rounded text-sm bg-white">
                                <option value="">Select...</option>
                                {nodes.filter(n => n.type === 'ENTITY').map(n => (<option key={n.id} value={n.id}>{n.label}</option>))}
                                </select>
                            </div>
                            <div className="w-16"><select value={cardinality2} onChange={e => setCardinality2(e.target.value)} className="w-full px-1 py-2 border rounded text-sm bg-white text-center"><option value="1">1</option><option value="N">N</option><option value="M">M</option></select></div>
                        </div>
                    </div>

                    {/* NEW: Relationship Attributes Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-800">Relationship Attributes</label>
                            <button onClick={handleAddAttributeField} className="text-blue-600 text-xs font-bold hover:underline">+ Add Field</button>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                            {newAttributes.map((attr, idx) => (
                            <div key={attr.id} className="flex flex-col gap-1 border rounded p-2 bg-gray-50">
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <input type="text" value={attr.label} onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} placeholder={`Attr ${idx + 1}`} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white" onKeyDown={(e) => { if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); }}/>
                                    </div>
                                    <button onClick={() => handleRemoveAttributeField(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isPrimaryKey ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} title="Primary Key">PK</div>
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isMultivalued ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} title="Multivalued (double ellipse)">Multi</div>
                                    <div className={`cursor-pointer px-2 py-1 rounded font-bold border transition-colors ${attr.isDerived ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} title="Derived (dashed)">Der</div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleSaveRelationship} className="w-full" variant={editingRelId ? "success" : "primary"} icon={editingRelId ? Check : Plus}>{editingRelId ? "Update Relationship" : "Connect Entities"}</Button>
                    {editingRelId && <Button onClick={() => setSelectedNodeIds([])} className="w-full" variant="ghost">Cancel Edit</Button>}
                </div>
                )}
                </>
             )}
          </div>
        </div>
        )}

        {/* Main Canvas */}
        <div ref={containerRef} className="flex-1 bg-slate-100 overflow-hidden relative cursor-crosshair"
             onMouseUp={handleMouseUp}
             onTouchEnd={handleMouseUp}
             onMouseMove={handleMouseMove}
             onTouchMove={(e: any) => handleMouseMove(e)}
             onMouseDown={handleMouseDownBg}
             onWheel={handleWheel}
        >
           {/* Grid */}
           {showGrid && (
           <div className="absolute inset-0 opacity-25 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)', 
                    backgroundSize: `${gridSize * view.zoom}px ${gridSize * view.zoom}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`
                }}>
           </div>
           )}

           {/* Toolbar */}
           <div className="absolute bottom-6 left-6 flex bg-white rounded-lg shadow-lg border p-1 gap-1 z-20">
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom * 1.2 }))} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn size={20}/></button>
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom / 1.2 }))} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out"><ZoomOut size={20}/></button>
               <button onClick={handleZoomToFit} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom to Fit"><Maximize size={20}/></button>
           </div>
           
           <svg 
            ref={svgRef}
            className="w-full h-full block"
           >
             <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
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
                    const connStroke = isConnSelected ? "#2563eb" : "black";
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
                                        fill="white" 
                                        stroke="#e2e8f0" 
                                        strokeWidth="1"
                                        className="shadow-sm"
                                    />
                                    {/* The Text Label */}
                                    <text 
                                        x={labelX} 
                                        y={labelY} 
                                        textAnchor="middle" 
                                        dy="4" // Vertical center adjustment
                                        className="text-xs font-bold fill-gray-800 select-none pointer-events-none"
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
                    const highlightStroke = isMatch ? "#f59e0b" : (selectedNodeIds.includes(node.id) ? "#2563eb" : "black");
                    const highlightFill = isMatch ? "#fef3c7" : "white";
                    
                    return (
                 <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                    onTouchStart={(e: any) => handleMouseDownNode(e, node.id)}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: interactionMode === 'DRAGGING_NODES' && !selectedNodeIds.includes(node.id) ? 0.5 : 1 }}
                 >
                     {node.type === 'ENTITY' && (
                     <>
                         <rect x="-60" y="-25" width="120" height="50" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "2"} />
                         {node.isWeak && <rect x="-54" y="-19" width="108" height="38" fill="none" stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "2" : "1.5"} />}
                         <text x="0" y="0" textAnchor="middle" dy="5" className="text-sm font-bold select-none pointer-events-none">{node.label}</text>
                     </>
                     )}
                     {node.type === 'ATTRIBUTE' && (
                     <>
                         <ellipse cx="0" cy="0" rx="45" ry="25" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "1.5"} strokeDasharray={node.isDerived ? "5,5" : "none"} />
                         {node.isMultivalued && <ellipse cx="0" cy="0" rx="50" ry="30" fill="none" stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "2" : "1"} strokeDasharray={node.isDerived ? "5,5" : "none"} />}
                         <text x="0" y="0" textAnchor="middle" dy="4" className={`text-xs select-none pointer-events-none ${node.isPrimaryKey ? 'underline' : ''}`} textDecoration={node.isPrimaryKey ? "underline" : "none"}>{node.label}</text>
                     </>
                     )}
                     {node.type === 'RELATIONSHIP' && (
                     <>
                         <polygon points="0,-40 60,0 0,40 -60,0" fill={highlightFill} stroke={highlightStroke} strokeWidth={selectedNodeIds.includes(node.id) || isMatch ? "3" : "2"} />
                         <text x="0" y="0" textAnchor="middle" dy="4" className="text-xs font-bold select-none pointer-events-none">{node.label}</text>
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
           
           <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg text-xs text-gray-500 shadow border pointer-events-none space-y-1 z-0">
              <p className="font-bold text-gray-700 mb-2">Keyboard Shortcuts</p>
              <p><strong>Ctrl+Z:</strong> Undo</p>
              <p><strong>Ctrl+Y:</strong> Redo</p>
              <p><strong>Ctrl+F:</strong> Search</p>
              <p><strong>Ctrl+A:</strong> Select All</p>
              <p><strong>Delete:</strong> Delete Selected</p>
              <p className="font-bold text-gray-700 mt-2 mb-1">Mouse Controls</p>
              <p><strong>Space+Drag:</strong> Pan</p>
              <p><strong>Wheel:</strong> Zoom</p>
              <p><strong>Drag Box:</strong> Multi-Select</p>
              <p><strong>Ctrl+Click:</strong> Add to Selection</p>
           </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <Check size={20} className="text-green-400" />
          <span className="font-medium">Share link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}