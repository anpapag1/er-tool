import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Share2, Pause, Play, Link, Check, X, MousePointer2, Move, ZoomIn, ZoomOut, Maximize, Upload, Download, PanelLeftClose, PanelLeftOpen, Settings, Image as ImageIcon } from 'lucide-react';

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
  
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- Selection & View State ---
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, zoom: 1 });
  
  // --- Interaction State ---
  // MODES: 'IDLE' | 'PANNING' | 'BOX_SELECTING' | 'DRAGGING_NODES'
  const [interactionMode, setInteractionMode] = useState<'IDLE' | 'PANNING' | 'BOX_SELECTING' | 'DRAGGING_NODES'>('IDLE');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Screen coords for Panning, World coords for others
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  
  // --- Physics State ---
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const velocities = useRef<Record<string, { vx: number, vy: number }>>({});
  const animationRef = useRef<number>();
  
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
  const [newAttributes, setNewAttributes] = useState<AttributeInput[]>([
    { id: 'attr_1', label: '', isPrimaryKey: false }
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
    const initialNodes: Node[] = [
      { id: 'e1', type: 'ENTITY', label: 'Ήπειρος', x: 300, y: 300 },
      { id: 'e2', type: 'ENTITY', label: 'Ποταμός', x: 800, y: 300 },
      { id: 'e3', type: 'ENTITY', label: 'Κράτος', x: 300, y: 100 },
      { id: 'a1', type: 'ATTRIBUTE', label: 'Όνομα', x: 200, y: 400, parentId: 'e1', isPrimaryKey: true },
      { id: 'a2', type: 'ATTRIBUTE', label: 'Έκταση', x: 300, y: 450, parentId: 'e1' },
      { id: 'r1', type: 'RELATIONSHIP', label: 'Διέρχεται', x: 550, y: 300 },
      { id: 'r2', type: 'RELATIONSHIP', label: 'Βρίσκεται', x: 300, y: 200 },
    ];

    const initialConnections: Connection[] = [
      { id: 'c1', sourceId: 'e1', targetId: 'a1' },
      { id: 'c2', sourceId: 'e1', targetId: 'a2' },
      { id: 'c4', sourceId: 'e1', targetId: 'r1', label: '1' },
      { id: 'c5', sourceId: 'r1', targetId: 'e2', label: 'N' },
      { id: 'c6', sourceId: 'e1', targetId: 'r2', label: 'M' },
      { id: 'c7', sourceId: 'r2', targetId: 'e3', label: 'N' },
    ];

    setNodes(initialNodes);
    setConnections(initialConnections);
    initialNodes.forEach(n => { velocities.current[n.id] = { vx: 0, vy: 0 }; });
  }, []);

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


  // --- Event Handling ---

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom by default with scroll wheel
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(0.1, view.zoom + delta), 4);
    setView(v => ({ ...v, zoom: newZoom }));
  };

  const handleMouseDownBg = (e: React.MouseEvent) => {
    if (e.button === 1 || e.code === 'Space') {
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
    setInteractionMode('IDLE');
    setSelectionBox(null);
  };
  
  // --- Form Logic ---
  const resetForms = useCallback(() => {
    setNewEntityLabel('');
    setNewAttributes([{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false }]);
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
            const attrs = nodes
                .filter(n => n.type === 'ATTRIBUTE' && n.parentId === editingEntityId)
                .map(n => ({ id: n.id, label: n.label, isPrimaryKey: !!n.isPrimaryKey }));
            setNewAttributes(attrs.length > 0 ? attrs : [{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false }]);
        }
    } else if (editingRelId) {
        setActiveTab('RELATIONSHIP');
        const relNode = nodes.find(n => n.id === editingRelId);
        if (relNode) {
            setRelLabel(relNode.label);
            
            // Load existing attributes for this relationship
            const attrs = nodes
                .filter(n => n.type === 'ATTRIBUTE' && n.parentId === editingRelId)
                .map(n => ({ id: n.id, label: n.label, isPrimaryKey: !!n.isPrimaryKey }));
            setNewAttributes(attrs.length > 0 ? attrs : [{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false }]);

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
    
    // 2. Prepare Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgRect = svgRef.current.getBoundingClientRect();
    
    canvas.width = svgRect.width;
    canvas.height = svgRect.height;
    
    if (!ctx) return;

    // 3. Draw Background (white/slate-100 to avoid transparency issues)
    ctx.fillStyle = '#f1f5f9'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 4. Create Blob URL & Draw
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `er_diagram_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
  const handleAddAttributeField = () => setNewAttributes([...newAttributes, { id: `attr_temp_${Date.now()}`, label: '', isPrimaryKey: false }]);
  const handleRemoveAttributeField = (index: number) => { const updated = [...newAttributes]; updated.splice(index, 1); setNewAttributes(updated); };
  const handleAttributeChange = (index: number, field: 'label' | 'isPrimaryKey', value: any) => { const updated = [...newAttributes]; /* @ts-ignore */ updated[index][field] = value; setNewAttributes(updated); };

  const handleSaveEntity = () => {
    if (!newEntityLabel.trim()) return;
    if (editingEntityId) {
        setNodes(prev => {
            const nextNodes = [...prev];
            const entityIndex = nextNodes.findIndex(n => n.id === editingEntityId);
            if (entityIndex >= 0) nextNodes[entityIndex] = { ...nextNodes[entityIndex], label: newEntityLabel };

            const existingAttrIds = prev.filter(n => n.parentId === editingEntityId).map(n => n.id);
            const formAttrIds = new Set<string>();

            newAttributes.forEach((attr, idx) => {
                if (!attr.label.trim()) return;
                if (attr.id.startsWith('attr_temp') || !existingAttrIds.includes(attr.id)) {
                    const newId = `a_${Date.now()}_${idx}`;
                    const parent = nextNodes.find(n => n.id === editingEntityId)!;
                    const angle = Math.random() * Math.PI * 2;
                    nextNodes.push({ id: newId, type: 'ATTRIBUTE', label: attr.label, x: parent.x + Math.cos(angle) * 80, y: parent.y + Math.sin(angle) * 80, parentId: editingEntityId, isPrimaryKey: attr.isPrimaryKey });
                    velocities.current[newId] = { vx: 0, vy: 0 };
                    setConnections(c => [...c, { id: `c_${Date.now()}_${idx}`, sourceId: editingEntityId, targetId: newId }]);
                } else {
                    formAttrIds.add(attr.id);
                    const nodeIdx = nextNodes.findIndex(n => n.id === attr.id);
                    if (nodeIdx >= 0) nextNodes[nodeIdx] = { ...nextNodes[nodeIdx], label: attr.label, isPrimaryKey: attr.isPrimaryKey };
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
        const entityId = `e_${Date.now()}`;
        const entityNode: Node = { id: entityId, type: 'ENTITY', label: newEntityLabel, x: centerX, y: centerY };
        velocities.current[entityId] = { vx: 0, vy: 0 };
        const newNodes = [entityNode];
        const newConns: Connection[] = [];
        newAttributes.forEach((attr, i) => {
            if (!attr.label.trim()) return;
            const attrId = `a_${Date.now()}_${i}`;
            const angle = (i / newAttributes.length) * Math.PI * 2;
            newNodes.push({ id: attrId, type: 'ATTRIBUTE', label: attr.label, x: entityNode.x + Math.cos(angle)*100, y: entityNode.y + Math.sin(angle)*100, parentId: entityId, isPrimaryKey: attr.isPrimaryKey });
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
                isPrimaryKey: attr.isPrimaryKey
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
                     if (attrInput) return { ...n, label: attrInput.label, isPrimaryKey: attrInput.isPrimaryKey };
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
        setNewAttributes([{ id: `attr_${Date.now()}`, label: '', isPrimaryKey: false }]); 
     }
  };

  const deleteSelected = () => {
    if (selectedNodeIds.length === 0) return;
    setNodes(nodes.filter(n => !selectedNodeIds.includes(n.id) && !selectedNodeIds.includes(n.parentId || '')));
    setConnections(connections.filter(c => !selectedNodeIds.includes(c.sourceId) && !selectedNodeIds.includes(c.targetId)));
    setSelectedNodeIds([]);
    resetForms();
  };

  const clearCanvas = () => {
    if (window.confirm("Clear all nodes?")) {
      setNodes([]); setConnections([]); velocities.current = {}; resetForms(); setSelectedNodeIds([]);
    }
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
            <button onClick={() => setIsPhysicsEnabled(!isPhysicsEnabled)} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPhysicsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {isPhysicsEnabled ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isPhysicsEnabled ? "Physics On" : "Physics Off"}
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 self-center"></div>
            
            <Button variant="ghost" onClick={() => setIsSettingsOpen(!isSettingsOpen)} icon={Settings} className={isSettingsOpen ? 'bg-gray-200' : ''} title="Physics Settings" />
            <Button variant="ghost" onClick={handleExport} icon={Download} title="Save to JSON">Save</Button>
            <Button variant="ghost" onClick={handleExportPng} icon={ImageIcon} title="Export as PNG">PNG</Button>
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
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-800">{editingEntityId ? "Edit Attributes" : "2. Attributes"}</label>
                            <button onClick={handleAddAttributeField} className="text-blue-600 text-xs font-bold hover:underline">+ Add Field</button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {newAttributes.map((attr, idx) => (
                            <div key={attr.id} className="flex gap-2 items-center">
                                <div className="flex-1">
                                <input type="text" value={attr.label} onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} placeholder={`Attr ${idx + 1}`} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); }}/>
                                </div>
                                <div className={`cursor-pointer px-2 py-1.5 rounded text-xs font-bold border transition-colors ${attr.isPrimaryKey ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} title="Toggle Primary Key">PK</div>
                                <button onClick={() => handleRemoveAttributeField(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
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
                            <div key={attr.id} className="flex gap-2 items-center">
                                <div className="flex-1">
                                <input type="text" value={attr.label} onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} placeholder={`Attr ${idx + 1}`} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); }}/>
                                </div>
                                <div className={`cursor-pointer px-2 py-1.5 rounded text-xs font-bold border transition-colors ${attr.isPrimaryKey ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`} onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} title="Toggle Primary Key">PK</div>
                                <button onClick={() => handleRemoveAttributeField(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
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
             onTouchMove={handleMouseMove}
             onMouseDown={handleMouseDownBg}
             onWheel={handleWheel}
        >
           {/* Grid */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
                    backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`
                }}>
           </div>

           {/* Toolbar */}
           <div className="absolute bottom-6 left-6 flex bg-white rounded-lg shadow-lg border p-1 gap-1 z-20">
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom * 1.2 }))} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn size={20}/></button>
               <button onClick={() => setView(v => ({ ...v, zoom: v.zoom / 1.2 }))} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out"><ZoomOut size={20}/></button>
               <button onClick={() => setView({ x: 0, y: 0, zoom: 1 })} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Reset View"><Maximize size={20}/></button>
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

                    return (
                        <g key={conn.id}>
                            {/* Connection Line */}
                            <line 
                                x1={src.x} y1={src.y} 
                                x2={tgt.x} y2={tgt.y} 
                                stroke="black" 
                                strokeWidth={strokeWidth} 
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

                 {nodes.map(node => (
                 <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                    onTouchStart={(e) => handleMouseDownNode(e, node.id)}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: interactionMode === 'DRAGGING_NODES' && !selectedNodeIds.includes(node.id) ? 0.5 : 1 }}
                 >
                     {node.type === 'ENTITY' && (
                     <>
                         <rect x="-60" y="-25" width="120" height="50" fill="white" stroke={selectedNodeIds.includes(node.id) ? "#2563eb" : "black"} strokeWidth={selectedNodeIds.includes(node.id) ? "3" : "2"} />
                         <text x="0" y="0" textAnchor="middle" dy="5" className="text-sm font-bold select-none pointer-events-none">{node.label}</text>
                     </>
                     )}
                     {node.type === 'ATTRIBUTE' && (
                     <>
                         <ellipse cx="0" cy="0" rx="45" ry="25" fill="white" stroke={selectedNodeIds.includes(node.id) ? "#2563eb" : "black"} strokeWidth={selectedNodeIds.includes(node.id) ? "3" : "1.5"} />
                         <text x="0" y="0" textAnchor="middle" dy="4" className={`text-xs select-none pointer-events-none ${node.isPrimaryKey ? 'underline' : ''}`} textDecoration={node.isPrimaryKey ? "underline" : "none"}>{node.label}</text>
                     </>
                     )}
                     {node.type === 'RELATIONSHIP' && (
                     <>
                         <polygon points="0,-40 60,0 0,40 -60,0" fill="white" stroke={selectedNodeIds.includes(node.id) ? "#2563eb" : "black"} strokeWidth={selectedNodeIds.includes(node.id) ? "3" : "2"} />
                         <text x="0" y="0" textAnchor="middle" dy="4" className="text-xs font-bold select-none pointer-events-none">{node.label}</text>
                     </>
                     )}
                 </g>
                 ))}

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
              <p><strong>Pan:</strong> Space + Drag OR Middle Click</p>
              <p><strong>Select:</strong> Drag Box OR Click</p>
              <p><strong>Multi:</strong> Ctrl/Cmd + Click</p>
              <p><strong>Zoom:</strong> Mouse Wheel</p>
           </div>
        </div>
      </div>
    </div>
  );
}