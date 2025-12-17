import React, { useState } from 'react';
import { Share2, Pause, Play, Grid, ChevronDown, Search, Copy, Settings, FileDown, Upload, PanelLeftClose, PanelLeftOpen, Undo, Redo, X, Moon, Sun } from 'lucide-react';
import { Button } from './Button';
import type { Node, PhysicsConfig } from '../types';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  
  // Undo/Redo
  history: { past: any[]; future: any[] };
  onUndo: () => void;
  onRedo: () => void;
  
  // Physics
  isPhysicsEnabled: boolean;
  setIsPhysicsEnabled: (enabled: boolean) => void;
  
  // Grid
  isGridSnapping: boolean;
  setIsGridSnapping: (snap: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  
  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  nodes: Node[];
  
  // Share & Export
  onShare: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onExportJpeg: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Settings & Tutorial
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  physicsConfig: PhysicsConfig;
  setPhysicsConfig: (config: PhysicsConfig) => void;
  onRestartTutorial: () => void;
  onStartTutorial?: () => void;
  
  // Theme
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function Header({
  isSidebarOpen,
  setIsSidebarOpen,
  history,
  onUndo,
  onRedo,
  isPhysicsEnabled,
  setIsPhysicsEnabled,
  isGridSnapping,
  setIsGridSnapping,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  nodes,
  onShare,
  onExportJson,
  onExportPng,
  onExportJpeg,
  onExportSvg,
  onExportPdf,
  onLoad,
  isSettingsOpen,
  setIsSettingsOpen,
  physicsConfig,
  setPhysicsConfig,
  onRestartTutorial,
  isDarkMode,
  setIsDarkMode,
  fileInputRef: externalFileInputRef,
}: HeaderProps) {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const internalFileInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef || internalFileInputRef;

  return (
    <header className="bg-white/80 dark:bg-black border-b border-gray-200/50 dark:border-white/10 px-2 md:px-4 py-2 md:py-3 flex items-center justify-between shadow-2xl z-30 relative">
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} className="md:w-5 md:h-5" /> : <PanelLeftOpen size={18} className="md:w-5 md:h-5" />}
        </button>

        <div className="flex items-center gap-1 md:gap-2 pl-2 border-l border-gray-200/50 dark:border-white/10 min-w-0">
          <Share2 className="text-blue-500 dark:text-blue-400 flex-shrink-0" size={18} />
          <h1 className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent truncate" style={{
            backgroundSize: '200% 100%'
          }}>ER Diagram</h1>
        </div>
      </div>

      {/* Right Section - Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Undo/Redo - Hide on small screens */}
        <div className="hidden sm:flex items-center gap-1">
          <Button 
            variant="ghost" 
            onClick={onUndo} 
            disabled={history.past.length === 0} 
            icon={Undo} 
            title="Undo (Ctrl+Z)" 
          />
          <Button 
            variant="ghost" 
            onClick={onRedo} 
            disabled={history.future.length === 0} 
            icon={Redo} 
            title="Redo (Ctrl+Y)" 
          />

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
        </div>

        {/* Physics Button - Icon only on mobile */}
        <button 
          onClick={() => setIsPhysicsEnabled(!isPhysicsEnabled)}
          className={`flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${
            isPhysicsEnabled 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={isPhysicsEnabled ? "Disable Physics" : "Enable Physics"}
          data-tutorial="physics-toggle"
        >
          {isPhysicsEnabled ? <Pause size={16} /> : <Play size={16} />}
          <span className="hidden md:inline">{isPhysicsEnabled ? "Physics" : "Off"}</span>
        </button>

        {/* Grid Menu */}
        <div className="relative flex-shrink-0">
          <button 
            onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
            className={`flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              isGridSnapping 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Grid Options"
          >
            <Grid size={16} />
            <span className="hidden md:inline">Grid</span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>
          
          {isGridMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 w-40 md:w-48 z-50 text-xs md:text-sm">
              <div className="p-2 border-b border-gray-200/50 dark:border-white/10">
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                  <span className="text-xs">Enable Snapping</span>
                  <input 
                    type="checkbox" 
                    checked={isGridSnapping} 
                    onChange={(e) => setIsGridSnapping(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                  <span className="text-xs">Show Grid</span>
                  <input 
                    type="checkbox" 
                    checked={showGrid} 
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Size</div>
                {[10, 20, 40].map((size) => (
                  <button 
                    key={size}
                    onClick={() => { setGridSize(size); setIsGridMenuOpen(false); }}
                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl transition-all ${
                      gridSize === size 
                        ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300 font-medium' 
                        : ''
                    }`}
                  >
                    {size}px {size === 10 ? '(Fine)' : size === 20 ? '(Default)' : '(Coarse)'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-0.5 hidden sm:block"></div>

        {/* Search - Compact on mobile */}
        {isSearchOpen && (
          <div className="flex items-center gap-1 md:gap-2 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl px-1 md:px-2 py-1 shadow-lg">
            <Search size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-24 md:w-40 px-1 py-1 text-xs md:text-sm outline-none bg-transparent dark:text-gray-100"
              autoFocus
            />
            {searchQuery.trim() && (
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase().trim())).length}/{nodes.length}
              </span>
            )}
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={() => setIsSearchOpen(!isSearchOpen)} 
          icon={Search}
          className={isSearchOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}
          title="Search (Ctrl+F)"
        />

        {/* Share - Hide on mobile, show on sm and up */}
        <Button 
          variant="ghost" 
          onClick={onShare} 
          icon={Copy} 
          title="Share Link" 
          disabled={nodes.length === 0}
          className="hidden sm:flex"
        />

        {/* Dark Mode */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-gray-600" />}
        </button>

        {/* Settings */}
        <Button 
          variant="ghost" 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
          icon={Settings}
          className={isSettingsOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}
          title="Physics Settings" 
        />

        {/* Export Menu */}
        <div className="relative flex-shrink-0" data-tutorial="export-button">
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg font-medium transition-all bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs md:text-sm"
            title="Export Options"
          >
            <FileDown size={16} />
            <span className="hidden md:inline">Export</span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>
          
          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 w-32 md:w-40 z-50 text-xs md:text-sm overflow-hidden">
              <button 
                onClick={() => { onExportJson(); setIsExportMenuOpen(false); }} 
                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all"
              >
                JSON
              </button>
              <button 
                onClick={() => { onExportPng(); setIsExportMenuOpen(false); }} 
                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all"
              >
                PNG
              </button>
              <button 
                onClick={() => { onExportJpeg(); setIsExportMenuOpen(false); }} 
                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all"
              >
                JPEG
              </button>
              <button 
                onClick={() => { onExportSvg(); setIsExportMenuOpen(false); }} 
                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all"
              >
                SVG
              </button>
              <button 
                onClick={() => { onExportPdf(); setIsExportMenuOpen(false); }} 
                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all"
              >
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Load - Hide on mobile */}
        <Button 
          variant="ghost" 
          onClick={() => fileInputRef.current?.click()} 
          icon={Upload} 
          title="Load from JSON"
          className="hidden sm:flex"
        />
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onLoad}
          className="hidden" 
          accept=".json" 
        />
      </div>

      {/* Physics Settings Panel - Mobile responsive */}
      {isSettingsOpen && (
        <div className="absolute top-full right-2 md:right-4 mt-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 p-3 md:p-4 w-[calc(100vw-1rem)] md:w-72 z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-xs md:text-sm">Physics Settings</h3>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Repulsion</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">{physicsConfig.repulsion}</span>
              </div>
              <input 
                type="range" min="1000" max="50000" step="1000" 
                value={physicsConfig.repulsion}
                onChange={(e) => setPhysicsConfig({...physicsConfig, repulsion: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Target Distance</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">{physicsConfig.springLength}px</span>
              </div>
              <input 
                type="range" min="30" max="200" step="5" 
                value={physicsConfig.springLength}
                onChange={(e) => setPhysicsConfig({...physicsConfig, springLength: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Stiffness</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">{physicsConfig.springStiffness.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.2" step="0.01" 
                value={physicsConfig.springStiffness}
                onChange={(e) => setPhysicsConfig({...physicsConfig, springStiffness: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Friction</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">{physicsConfig.damping.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="0.99" step="0.01" 
                value={physicsConfig.damping}
                onChange={(e) => setPhysicsConfig({...physicsConfig, damping: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200/50 dark:border-white/10">
              <button 
                onClick={() => {
                  onRestartTutorial();
                  setIsSettingsOpen(false);
                }}
                className="w-full py-2 px-3 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Restart Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
