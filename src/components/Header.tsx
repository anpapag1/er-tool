import React, { useState } from 'react';
import { Pause, Play, Grid, ChevronDown, Search, Copy, Settings, FileDown, Upload, PanelLeftClose, PanelLeftOpen, Undo, Redo, X, Moon, Sun } from 'lucide-react';
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
  
  // Settings
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  physicsConfig: PhysicsConfig;
  setPhysicsConfig: (config: PhysicsConfig) => void;
  
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
  isDarkMode,
  setIsDarkMode,
  fileInputRef: externalFileInputRef,
}: HeaderProps) {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const internalFileInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef || internalFileInputRef;

  if (isSearchOpen) {
    return (
      <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 px-2.5 md:px-4 py-2 md:py-3 shadow-2xl z-30 relative">
        <div className="w-full flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-2 md:px-3 py-1.5 md:py-2 min-h-[2.5rem]">
          <Search size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="flex-1 min-w-0 px-1 py-1 text-sm md:text-base outline-none bg-transparent dark:text-zinc-100"
            autoFocus
          />
          {searchQuery.trim() && (
            <span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
              {nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase().trim())).length}/{nodes.length}
            </span>
          )}
          <button
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0 flex items-center justify-center rounded-lg"
            title="Close Search"
          >
            <X size={15} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 px-2.5 md:px-4 py-2 md:py-3 flex items-center justify-between shadow-2xl z-30 relative">
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="hidden md:flex p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-zinc-300 transition-colors flex-shrink-0"
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} className="md:w-5 md:h-5" /> : <PanelLeftOpen size={18} className="md:w-5 md:h-5" />}
        </button>

        <div className="flex items-center gap-1 md:gap-2 md:pl-2 md:border-l border-gray-200/50 dark:border-white/10 min-w-0">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="logo" className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-md" />
          <h1 className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent truncate" style={{
            backgroundSize: '200% 100%'
          }}> ER-Tool</h1>
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
          <div className="h-6 w-px bg-gray-300 dark:bg-zinc-600 mx-0.5"></div>
        </div>

        {/* Physics Button - Icon only on mobile */}
        <button 
          onClick={() => setIsPhysicsEnabled(!isPhysicsEnabled)}
          className={`flex items-center justify-center md:justify-start gap-1.5 w-10 md:w-auto h-10 md:h-auto px-0 md:px-3 py-0 md:py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all flex-shrink-0 ${
            isPhysicsEnabled 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800' 
              : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
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
            className={`flex items-center justify-center md:justify-start gap-1.5 w-10 md:w-auto h-10 md:h-auto px-0 md:px-3 py-0 md:py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
              isGridSnapping 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800' 
                : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
            }`}
            title="Grid Options"
          >
            <Grid size={16} />
            <span className="hidden md:inline">Grid</span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>
          
          {isGridMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-40 md:w-48 z-50 text-xs md:text-sm">
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
                <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 px-2 py-1">Size</div>
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
        <div className="h-6 w-px bg-gray-300 dark:bg-zinc-600 mx-0.5 hidden sm:block"></div>

        {/* Search - Compact on mobile */}
        {isSearchOpen && (
          <div className="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-2 md:px-2 py-1.5 shadow-lg min-h-[2.5rem]">
            <Search size={15} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-28 md:w-40 px-1 py-1 text-sm md:text-sm outline-none bg-transparent dark:text-zinc-100"
              autoFocus
            />
            {searchQuery.trim() && (
              <span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                {nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase().trim())).length}/{nodes.length}
              </span>
            )}
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={() => setIsSearchOpen(!isSearchOpen)} 
          icon={Search}
          className={`${isSearchOpen ? 'bg-gray-200 dark:bg-zinc-700' : ''} h-9 w-9 p-0`}
          title="Search (Ctrl+F)"
        />

        {/* Share / Copy */}
        <Button 
          variant="ghost" 
          onClick={onShare} 
          icon={Copy} 
          title="Share Link" 
          disabled={nodes.length === 0}
          className={`h-9 w-9 md:h-auto md:w-auto p-0 md:px-3 md:py-1.5 ${nodes.length > 0 ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 hover:bg-blue-500/25 dark:hover:bg-blue-400/20' : ''}`}
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
          className={`${isSettingsOpen ? 'bg-gray-200 dark:bg-zinc-700' : ''} h-9 w-9 p-0`}
          title="Physics Settings" 
        />

        {/* Export Menu */}
        <div className="relative flex-shrink-0" data-tutorial="export-button">
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center justify-center md:justify-start gap-1.5 w-10 md:w-auto h-10 md:h-auto px-0 md:px-3 py-0 md:py-1.5 rounded-xl font-medium transition-all bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 text-xs md:text-sm"
            title="Export Options"
          >
            <FileDown size={16} />
            <span className="hidden md:inline">Export</span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>
          
          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-32 md:w-40 z-50 text-xs md:text-sm overflow-hidden">
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
        <div className="absolute top-full right-2 md:right-4 mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-3 md:p-4 w-[calc(100vw-1rem)] md:w-72 z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <h3 className="font-bold text-gray-700 dark:text-zinc-200 text-xs md:text-sm">Physics Settings</h3>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-300">Repulsion</label>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{physicsConfig.repulsion}</span>
              </div>
              <input 
                type="range" min="1000" max="50000" step="1000" 
                value={physicsConfig.repulsion}
                onChange={(e) => setPhysicsConfig({...physicsConfig, repulsion: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-300">Target Distance</label>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{physicsConfig.springLength}px</span>
              </div>
              <input 
                type="range" min="30" max="200" step="5" 
                value={physicsConfig.springLength}
                onChange={(e) => setPhysicsConfig({...physicsConfig, springLength: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-300">Stiffness</label>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{physicsConfig.springStiffness.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.2" step="0.01" 
                value={physicsConfig.springStiffness}
                onChange={(e) => setPhysicsConfig({...physicsConfig, springStiffness: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-300">Friction</label>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{physicsConfig.damping.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.1" max="0.99" step="0.01" 
                value={physicsConfig.damping}
                onChange={(e) => setPhysicsConfig({...physicsConfig, damping: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
