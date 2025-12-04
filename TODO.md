# ER Diagram Builder - TODO List

## 📋 Planned Features

### 1. Weak Entities - Double-bordered rectangles
- [ ] Add checkbox in entity form to mark as weak
- [ ] Add `isWeak` property to Entity type
- [ ] Visual: Render inner rectangle for weak entities
- [ ] Update save/load to preserve weak entity status

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

### 2. Multivalued Attributes - Double-bordered ellipses
- [ ] Add checkbox for each attribute in forms
- [ ] Add `isMultivalued` property to Attribute type
- [ ] Visual: Render outer ellipse for multivalued attributes
- [ ] Update save/load to preserve multivalued status

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

### 3. Derived Attributes - Dashed ellipse borders
- [ ] Add checkbox for each attribute in forms
- [ ] Add `isDerived` property to Attribute type
- [ ] Visual: Apply dashed stroke style (`strokeDasharray="5,5"`)
- [ ] Update save/load to preserve derived status

**Implementation Notes:**
```tsx
<ellipse 
  cx="0" cy="0" rx="45" ry="25" 
  strokeDasharray={node.isDerived ? "5,5" : "none"}
/>
```

---

### 4. Undo/Redo - Full history tracking
- [ ] Create history state with nodes/connections snapshots
- [ ] Implement undo/redo functions with 50-action limit
- [ ] Add Ctrl+Z / Ctrl+Y keyboard shortcuts
- [ ] Add undo/redo buttons in header with disabled states
- [ ] Push to history on: create, update, delete, move

**Implementation Notes:**
```tsx
const [history, setHistory] = useState<{past: State[], future: State[]}>({past: [], future: []});
const undo = () => { /* pop from past, push current to future */ };
const redo = () => { /* pop from future, push current to past */ };
```

---

### 5. Keyboard Shortcuts
- [ ] Delete key - Delete selected nodes
- [ ] Ctrl+A - Select all nodes
- [ ] Ctrl+Z / Ctrl+Y - Undo/Redo
- [ ] Ctrl+F - Toggle search bar
- [ ] Update help panel with new shortcuts
- [ ] Add keyboard event listener to canvas/window

**Shortcut Table:**
| Key | Action |
|-----|--------|
| Delete | Delete selected |
| Ctrl+A | Select all |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Search |
| Space+Drag | Pan |

---

### 6. Zoom to Fit - Auto-fit all nodes
- [ ] Add "Fit to Screen" button in toolbar (near zoom controls)
- [ ] Calculate bounding box of all nodes
- [ ] Center view and adjust zoom to fit with padding
- [ ] Animate transition (optional)

**Implementation Notes:**
```tsx
const zoomToFit = () => {
  const bounds = calculateBoundingBox(nodes);
  const zoom = calculateFitZoom(bounds, containerSize);
  setView({ x: centerX, y: centerY, zoom });
};
```

---

### 7. Grid Snapping - Clean node placement
- [ ] Add toggle button in header ("Snap to Grid")
- [ ] Add `isGridSnapping` state
- [ ] Snap coordinates to 20px grid when moving nodes
- [ ] Visual feedback: Show grid when snapping is on (optional)

**Implementation Notes:**
```tsx
const snapToGrid = (value: number) => Math.round(value / 20) * 20;
// In drag handler:
if (isGridSnapping) {
  node.x = snapToGrid(node.x);
  node.y = snapToGrid(node.y);
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

### 9. Search/Filter - Find nodes by name
- [ ] Add search input in header
- [ ] Ctrl+F keyboard shortcut to focus search
- [ ] Filter nodes by label (case-insensitive)
- [ ] Highlight matching nodes (yellow/orange border)
- [ ] Scroll/pan to first match
- [ ] Show "X of Y" results counter

**Implementation Notes:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const matchingNodes = nodes.filter(n => 
  n.label.toLowerCase().includes(searchQuery.toLowerCase())
);
// In SVG: Apply highlight stroke to matching nodes
```

---

### 10. Share Link - URL-based sharing
- [ ] Encode diagram state to Base64
- [ ] Compress JSON for smaller URLs
- [ ] Add "Share" button that copies URL
- [ ] Toast notification on copy
- [ ] Auto-load diagram from URL on page load
- [ ] Handle URL length limits (max ~2000 chars)

**Implementation Notes:**
```tsx
const shareLink = () => {
  const state = { nodes, connections };
  const encoded = btoa(JSON.stringify(state));
  const url = `${window.location.origin}${window.location.pathname}?diagram=${encoded}`;
  navigator.clipboard.writeText(url);
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

**Phase 2 - Core Features:**
4. Weak Entities
5. Multivalued Attributes
6. Derived Attributes
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
