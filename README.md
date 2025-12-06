# ER Diagram Builder 🗂️

An interactive Entity-Relationship diagram builder with real-time physics simulation, built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

### Core Functionality
- **Visual ER Modeling** - Create entities, relationships, and attributes using Chen notation
- **Interactive Canvas** - Drag, pan, zoom, and organize your diagrams intuitively
- **Physics Engine** - Automatic layout with configurable force-directed graph simulation
- **Multi-Selection** - Select and move multiple nodes simultaneously with box selection
- **Primary Keys** - Mark attributes as primary keys with visual indicators

### Chen Notation Support
- **Weak Entities** - Double-bordered rectangles for weak entity sets
- **Multivalued Attributes** - Double-bordered ellipses for attributes with multiple values
- **Derived Attributes** - Dashed borders for computed attributes

### Advanced Controls
- **Pan & Zoom** - Space + Drag or Middle Click to pan, Mouse Wheel to zoom
- **Zoom to Fit** - Automatically fit entire diagram in view with one click
- **Grid Snapping** - Align nodes to 10px, 20px, or 40px grid with optional grid visibility
- **Minimap Navigation** - Overview panel in bottom-right corner with click/drag navigation
- **Box Selection** - Drag to select multiple items
- **Multi-Select** - Ctrl/Cmd + Click to add items to selection
- **Live Editing** - Click any node to edit its properties in the sidebar

### Undo/Redo System
- **50-Action History** - Full undo/redo support with Ctrl+Z/Ctrl+Y
- **Non-destructive** - Safely experiment with your diagram layout

### Search & Filter
- **Quick Search** - Find entities, relationships, and attributes instantly (Ctrl+F)
- **Visual Highlighting** - Matching items highlighted in blue for easy identification

### Data Management
- **Export/Import** - Save diagrams as JSON files
- **Multiple Export Formats** - PNG (high-quality 2x), JPEG, SVG, PDF
- **Share Link** - Generate compressed URLs to share diagrams instantly
- **Real-time Updates** - All changes reflect immediately on the canvas

### Physics Configuration
Fine-tune the automatic layout with adjustable parameters:
- Repulsion strength between nodes
- Target distance for connections
- Collision radius
- Spring stiffness
- Damping (friction)

## 🚀 Live Demo

Visit the live application: [https://anpapag1.github.io/er-tool/](https://anpapag1.github.io/er-tool/)

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library
- **SVG** - Canvas rendering

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/anpapag1/er-tool.git
cd er-tool

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🎮 Usage Guide

### Creating Entities
1. Open the **Entity** tab in the sidebar
2. Enter entity name
3. Add attributes (mark primary keys as needed)
4. Click **Create Entity**

### Creating Relationships
1. Switch to the **Relationship** tab
2. Enter relationship name
3. Select two entities to connect
4. Set cardinality (1, N, or M) for each side
5. Add relationship attributes (optional)
6. Click **Connect Entities**

### Canvas Navigation
- **Pan**: Hold Space + Drag or use Middle Mouse Button
- **Zoom**: Mouse Wheel
- **Select**: Click or drag box
- **Multi-Select**: Ctrl/Cmd + Click
- **Edit**: Click a node to edit in sidebar
- **Move**: Drag selected nodes

### Physics Control
- Toggle physics on/off with the button in the header
- Click the Settings icon to adjust physics parameters
- Physics only affects attributes (entities and relationships stay fixed)

## 📁 Project Structure

```
er-tool/
├── src/
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Entry point
│   ├── index.css         # Global styles
│   └── assets/           # Static assets
├── public/
│   └── icon.svg          # Favicon
├── dist/                 # Build output
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## 🎨 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl` + `Z` |
| Redo | `Ctrl` + `Y` |
| Search | `Ctrl` + `F` |
| Select All | `Ctrl` + `A` |
| Delete Selected | `Delete` |
| Pan Canvas | `Space` + Drag |
| Zoom In/Out | Mouse Wheel |
| Multi-Select | `Ctrl` + Click |
| Deselect All | Click empty canvas |

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

ISC License - See `package.json` for details

## 👤 Author

**anpapag1**

- GitHub: [@anpapag1](https://github.com/anpapag1)
- Project: [er-tool](https://github.com/anpapag1/er-tool)

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for database designers and students**
