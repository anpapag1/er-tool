# ER Diagram Builder - TODO List

## 📋 Planned Features

### 1. ✅ Weak Entities - Double-bordered rectangles (COMPLETED)
- [x] Add checkbox in entity form to mark as weak
- [x] Add `isWeak` property to Entity type
- [x] Visual: Render inner rectangle for weak entities
- [x] Update save/load to preserve weak entity status

**Implementation Notes:**
```tsx
// In SVG rendering:
{node.type === 'ENTITY' && (
  <>
    <rect x="-60" y="-25" width="120" height="50" ... />
    {node.isWeak && <rect x="-55" y="-20" width="110" height="40" ... />}
  </>
)}
```

---

### 2. ✅ Multivalued Attributes - Double-bordered ellipses (COMPLETED)
- [x] Add checkbox for each attribute in forms
- [x] Add `isMultivalued` property to Attribute type
- [x] Visual: Render outer ellipse for multivalued attributes
- [x] Update save/load to preserve multivalued status

**Implementation Notes:**
```tsx
// In SVG rendering:
{node.type === 'ATTRIBUTE' && (
  <>
    <ellipse cx="0" cy="0" rx="45" ry="25" ... />
    {node.isMultivalued && <ellipse cx="0" cy="0" rx="50" ry="30" ... />}
  </>
)}
```

---

### 3. ✅ Derived Attributes - Dashed ellipse borders (COMPLETED)
- [x] Add checkbox for each attribute in forms
- [x] Add `isDerived` property to Attribute type
- [x] Visual: Apply dashed stroke style (`strokeDasharray="5,5"`)
- [x] Update save/load to preserve derived status

**Implementation Notes:**
```tsx
<ellipse 
  cx="0" cy="0" rx="45" ry="25" 
  strokeDasharray={node.isDerived ? "5,5" : "none"}
/>
```

---

### 4. ✅ Undo/Redo - Full history tracking (COMPLETED)
- [x] Create history state with nodes/connections snapshots
- [x] Implement undo/redo functions with 50-action limit
- [x] Add Ctrl+Z / Ctrl+Y keyboard shortcuts
- [x] Add undo/redo buttons in header with disabled states
- [x] Push to history on: create, update, delete, move

**Implementation Notes:**
```tsx
const [history, setHistory] = useState<{past: Array<{nodes: Node[], connections: Connection[]}>, future: Array<{nodes: Node[], connections: Connection[]}>}>({past: [], future: []});
const saveHistory = () => { /* Push current state to past, clear future */ };
const undo = () => { /* Pop from past, push current to future, restore previous */ };
const redo = () => { /* Pop from future, push current to past, restore next */ };
// Called before: handleSaveEntity, handleSaveRelationship, deleteSelected, handleMouseUp (drag end)
```

---

### 5. ✅ Keyboard Shortcuts (COMPLETED)
- [x] Delete key - Delete selected nodes
- [x] Ctrl+A - Select all nodes
- [x] Ctrl+Z / Ctrl+Y - Undo/Redo
- [x] Ctrl+F - Toggle search bar
- [x] Update help panel with new shortcuts
- [x] Add keyboard event listener to canvas/window

**Shortcut Table:**
| Key | Action |
|-----|--------|
| Delete/Backspace | Delete selected |
| Ctrl+A | Select all |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Search |
| Space+Drag | Pan |

**Implementation Notes:**
- Input field detection prevents shortcuts while typing
- Help panel shows comprehensive keyboard and mouse shortcuts

---

### 6. ✅ Zoom to Fit - Auto-fit all nodes (COMPLETED)
- [x] Add "Fit to Screen" button in toolbar (near zoom controls)
- [x] Calculate bounding box of all nodes
- [x] Center view and adjust zoom to fit with padding
- [x] Animate transition (optional)

**Implementation Notes:**
```tsx
const handleZoomToFit = () => {
  if (nodes.length === 0) return;
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
  const zoomX = containerWidth / width;
  const zoomY = containerHeight / height;
  const newZoom = Math.min(Math.max(0.1, Math.min(zoomX, zoomY)), 4);
  setView({ x: -centerX * newZoom + containerWidth / 2, y: -centerY * newZoom + containerHeight / 2, zoom: newZoom });
};
```

---

### 7. ✅ Grid Snapping - Clean node placement (COMPLETED)
- [x] Add toggle button in header ("Snap to Grid")
- [x] Add `isGridSnapping` state
- [x] Snap coordinates to 20px grid when moving nodes
- [x] Visual feedback: Show grid when snapping is on (optional)

**Implementation Notes:**
```tsx
const snapToGrid = (value: number, gridSize: number = 20) => {
  return Math.round(value / gridSize) * gridSize;
};
// In drag handler:
if (isGridSnapping) {
  const newX = n.x + dx;
  const newY = n.y + dy;
  return { ...n, x: snapToGrid(newX), y: snapToGrid(newY) };
}
```

---

### 8. SQL Generation - CREATE TABLE export
- [ ] Create SQL generator function
- [ ] Handle entities → CREATE TABLE
- [ ] Handle attributes → columns with types
- [ ] Handle primary keys → PRIMARY KEY constraint
- [ ] Create junction tables for M:N relationships
- [ ] Add "Export SQL" button in header
- [ ] Download as .sql file

**Implementation Notes:**
```sql
-- Example output:
CREATE TABLE Entity1 (
  pk_attribute INT PRIMARY KEY,
  attribute2 VARCHAR(255)
);

-- M:N relationship:
CREATE TABLE Entity1_Relationship_Entity2 (
  entity1_id INT,
  entity2_id INT,
  PRIMARY KEY (entity1_id, entity2_id),
  FOREIGN KEY (entity1_id) REFERENCES Entity1(pk),
  FOREIGN KEY (entity2_id) REFERENCES Entity2(pk)
);
```

---

### 9. ✅ Search/Filter - Find nodes by name (COMPLETED)
- [x] Add search input in header
- [x] Ctrl+F keyboard shortcut to focus search
- [x] Filter nodes by label (case-insensitive)
- [x] Highlight matching nodes (yellow/orange border)
- [x] Show "X of Y" results counter

**Implementation Notes:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const matchingNodes = nodes.filter(n => 
  n.label.toLowerCase().includes(searchQuery.toLowerCase())
);
// In SVG: Apply highlight stroke to matching nodes
```

---

### 10. ✅ Share Link - URL-based sharing (COMPLETED)
- [x] Encode diagram state to Base64
- [x] Compress JSON for smaller URLs (using LZString)
- [x] Add "Share" button that copies URL
- [x] Toast notification on copy
- [x] Auto-load diagram from URL on page load
- [x] Handle URL length limits (max ~2000 chars)

**Implementation Notes:**
```tsx
const handleShare = () => {
  const data = JSON.stringify({ nodes, connections });
  const compressed = LZString.compressToEncodedURIComponent(data);
  const url = `${window.location.origin}${window.location.pathname}?diagram=${compressed}`;
  navigator.clipboard.writeText(url);
  // Show toast notification
};

const loadFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const diagramParam = params.get('diagram');
  if (diagramParam) {
    const decompressed = LZString.decompressFromEncodedURIComponent(diagramParam);
    const data = JSON.parse(decompressed);
    setNodes(data.nodes);
    setConnections(data.connections);
  }
};
```

---

### 11. Layer System - Organize diagrams
- [ ] Add `layer` property to Node type (default: 'default')
- [ ] Add layer selector dropdown in header
- [ ] Filter display by current layer
- [ ] "All Layers" view option
- [ ] Layer management UI (create/rename/delete layers)
- [ ] Update save/load to preserve layers

**Implementation Notes:**
```tsx
const [currentLayer, setCurrentLayer] = useState<string>('default');
const [layers, setLayers] = useState<string[]>(['default']);
const visibleNodes = nodes.filter(n => 
  currentLayer === 'all' || n.layer === currentLayer
);
```

---

## 🎯 Priority Order

**Phase 1 - Quick Wins:**
1. Keyboard Shortcuts (Delete, Ctrl+A)
2. Zoom to Fit
3. Grid Snapping

**Phase 2 - Core Features:** ✅ COMPLETED
4. ✅ Weak Entities
5. ✅ Multivalued Attributes
6. ✅ Derived Attributes
7. Search/Filter

**Phase 3 - Advanced:**
8. Undo/Redo
9. SQL Generation
10. Share Link
11. Layer System

---

## 📝 Notes

- All features should preserve backward compatibility with existing diagrams
- Update TypeScript types in a separate types section
- Add feature flags for easy enable/disable during development
- Update README.md after each major feature
- Consider performance impact for large diagrams (100+ nodes)
- Test on mobile devices where applicable

---

## 🚀 Future Considerations

- Dark mode theme
- PDF export
- Import from SQL
- Real-time collaboration
- Template library
- Validation system
- Context menu (right-click)
- Minimap for navigation
- Tutorial/onboarding flow
