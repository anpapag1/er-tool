# ER Diagram Builder

An interactive web-based Entity-Relationship (ER) diagram editor built with React and TypeScript. Create, visualize, and manage database schemas with an intuitive drag-and-drop interface.

## Features

- **Interactive Canvas**: Drag entities and attributes freely on an infinite canvas
- **Entity & Relationship Management**: Create entities, attributes, and relationships with custom properties
- **Physics Simulation**: Automatic layout adjustment with realistic physics forces (repulsion, springs, damping)
- **Touch Support**: Full support for touch interactions on mobile and tablet devices
  - Single-finger panning and node dragging
  - Two-finger pinch zoom
- **Minimap**: Visual overview of your entire diagram with viewport tracking
- **Grid Snapping**: Precise node alignment with optional grid snapping
- **Interactive Tutorial**: Step-by-step guided tour for new users with spotlight effect
- **Responsive Design**: Optimized for desktop, tablet, and mobile screens
- **Dark Mode**: Built-in dark theme support
- **Export Functionality**: Share and save your diagrams
- **Undo/Redo**: Full history management for your changes

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser with ES6+ support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anpapag1/er-tool.git
cd er-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5174`

## Usage

### Creating Entities
1. Click the "Entity" button in the header to add a new entity
2. Click on the canvas to place it
3. Edit the entity name and add attributes in the sidebar

### Adding Attributes
1. Select an entity
2. Click "Add Attribute" in the Attributes tab
3. Define the attribute name and properties

### Creating Relationships
1. Click the "Relationship" button
2. Click on two entities to create a relationship between them
3. Configure the relationship properties in the sidebar

### Canvas Navigation
- **Pan**: Click and drag on empty canvas space, or single-finger drag on mobile
- **Zoom**: Use mouse wheel, or two-finger pinch on mobile
- **Minimap**: Click the minimap in the bottom-right corner to jump to a location

### Tutorial
First-time users will see an interactive tutorial. Skip it anytime with the Skip button or restart it from the menu.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with dark mode support
- **Vite** - Fast build tool and dev server
- **SVG Canvas** - Vector-based diagram rendering
- **localStorage** - Persistent tutorial state

## Building for Production

Build the optimized production bundle:
```bash
npm run build
```

The output will be in the `dist/` directory.

## Deployment

This project is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will build the project and push it to the `gh-pages` branch.

## Architecture

### Components
- **App.tsx** - Main application component with canvas and interaction logic
- **Header.tsx** - Top navigation bar with controls
- **Sidebar.tsx** - Entity/relationship editor panel
- **TutorialOverlay.tsx** - Interactive tutorial with spotlight effect
- **Button.tsx** - Reusable button component

### Hooks
- **useTutorial.ts** - Tutorial state management
- **useHistory.ts** - Undo/Redo functionality
- **useShare.ts** - Diagram sharing and export

### Physics Engine
The canvas includes a physics simulation that:
- Repels entities from each other to prevent overlap
- Creates spring forces along relationships
- Uses damping for smooth motion and settling
- Allows manual node positioning without physics interference

## Mobile Optimization

The application is fully optimized for mobile devices:
- Responsive layouts that adapt to screen size
- Touch-friendly controls and larger tap targets
- Bottom-sheet style tutorial on mobile
- Hidden minimap spotlight effect on smaller screens
- Optimized sidebar for one-handed use

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

Created by [@anpapag1](https://github.com/anpapag1)

[View on GitHub](https://github.com/anpapag1/er-tool)
