import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, X, Link, MousePointer2 } from 'lucide-react';
import type { Node, AttributeInput } from '../types';
import { Button } from './Button';

interface EntitySelectProps {
  value: string;
  onChange: (id: string) => void;
  entities: Node[];
  accent: 'blue' | 'purple';
}

const EntitySelect: React.FC<EntitySelectProps> = ({ value, onChange, entities, accent }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = entities.find(n => n.id === value);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const isBlue = accent === 'blue';
  const openBorder = isBlue ? 'border-blue-400 dark:border-blue-500' : 'border-purple-400 dark:border-purple-500';
  const openShadow = isBlue ? 'shadow-blue-500/10' : 'shadow-purple-500/10';
  const activeItem = isBlue
    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold'
    : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-semibold';
  const hoverItem = isBlue
    ? 'hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
    : 'hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300';

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between pl-3 pr-2.5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm bg-white dark:bg-zinc-800 border transition-all shadow-sm cursor-pointer ${
          open
            ? `${openBorder} shadow-lg ${openShadow}`
            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
        }`}
      >
        <span className={`truncate mr-1 ${
          selected ? 'text-gray-800 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'
        }`}>
          {selected ? selected.label : 'Select entity…'}
        </span>
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-gray-600 dark:text-zinc-300' : 'text-gray-400 dark:text-zinc-500'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-800 shadow-2xl overflow-hidden">
          {entities.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-400 dark:text-zinc-500 text-center italic">No entities on canvas yet</div>
          ) : (
            entities.map((n, i) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { onChange(n.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 md:py-2.5 text-xs md:text-sm transition-colors ${
                  i > 0 ? 'border-t border-gray-50 dark:border-white/[0.04]' : ''
                } ${
                  n.id === value ? activeItem : `text-gray-700 dark:text-zinc-200 ${hoverItem}`
                }`}
              >
                {n.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  activeTab: 'ENTITY' | 'RELATIONSHIP';
  setActiveTab: (tab: 'ENTITY' | 'RELATIONSHIP') => void;
  selectedNodeIds: string[];
  nodes: Node[];
  
  // Entity state
  newEntityLabel: string;
  setNewEntityLabel: (label: string) => void;
  isWeakEntity: boolean;
  setIsWeakEntity: (value: boolean) => void;
  editingEntityId: string | null;
  
  // Relationship state
  relLabel: string;
  setRelLabel: (label: string) => void;
  relEntity1: string;
  setRelEntity1: (id: string) => void;
  relEntity2: string;
  setRelEntity2: (id: string) => void;
  cardinality1: string;
  setCardinality1: (value: string) => void;
  cardinality2: string;
  setCardinality2: (value: string) => void;
  editingRelId: string | null;
  
  // Attributes
  newAttributes: AttributeInput[];
  handleAddAttributeField: () => void;
  handleRemoveAttributeField: (idx: number) => void;
  handleAttributeChange: (idx: number, field: 'label' | 'isPrimaryKey' | 'isMultivalued' | 'isDerived', value: string | boolean) => void;
  
  // Actions
  handleSaveEntity: () => void;
  handleSaveRelationship: () => void;
  deleteSelected: () => void;
  setSelectedNodeIds: (ids: string[]) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedNodeIds,
  nodes,
  newEntityLabel,
  setNewEntityLabel,
  isWeakEntity,
  setIsWeakEntity,
  editingEntityId,
  relLabel,
  setRelLabel,
  relEntity1,
  setRelEntity1,
  relEntity2,
  setRelEntity2,
  cardinality1,
  setCardinality1,
  cardinality2,
  setCardinality2,
  editingRelId,
  newAttributes,
  handleAddAttributeField,
  handleRemoveAttributeField,
  handleAttributeChange,
  handleSaveEntity,
  handleSaveRelationship,
  deleteSelected,
  setSelectedNodeIds,
  onClose,
}) => {
  const entityNameInputRef = useRef<HTMLInputElement>(null);
  const sheetHandleTouchStartY = useRef<number | null>(null);
  const [sheetDragOffsetY, setSheetDragOffsetY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  useEffect(() => {
    if (activeTab === 'ENTITY') {
      entityNameInputRef.current?.focus();
    }
  }, [activeTab]);

  const handleSheetTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    sheetHandleTouchStartY.current = e.touches[0]?.clientY ?? null;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (sheetHandleTouchStartY.current === null) return;
    const currentY = e.touches[0]?.clientY ?? sheetHandleTouchStartY.current;
    const deltaY = Math.max(0, currentY - sheetHandleTouchStartY.current);
    setSheetDragOffsetY(deltaY);
  };

  const handleSheetTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (sheetHandleTouchStartY.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? sheetHandleTouchStartY.current;
    const deltaY = endY - sheetHandleTouchStartY.current;
    const shouldClose = deltaY > 90;
    setIsSheetDragging(false);
    setSheetDragOffsetY(0);
    if (shouldClose && onClose) onClose();
    sheetHandleTouchStartY.current = null;
  };

  const handleSheetTouchCancel = () => {
    setIsSheetDragging(false);
    setSheetDragOffsetY(0);
    sheetHandleTouchStartY.current = null;
  };

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 md:inset-auto md:top-4 md:left-4 w-full md:w-96 md:rounded-3xl rounded-t-[28px] bg-white dark:bg-zinc-900 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.35)] z-20 overflow-hidden transition-all md:animate-fade-in-up border border-gray-200 dark:border-zinc-800 h-auto max-h-[92dvh] md:h-[calc(100vh-2rem)] md:max-h-none animate-[sheetUp_260ms_cubic-bezier(0.22,1,0.36,1)]"
      style={{
        scrollbarWidth: 'none',
        WebkitFontSmoothing: 'antialiased',
        backfaceVisibility: 'hidden',
        transform: sheetDragOffsetY > 0 ? `translateY(${sheetDragOffsetY}px)` : undefined,
        transition: isSheetDragging ? 'none' : 'transform 220ms cubic-bezier(0.22,1,0.36,1)'
      }}>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 0px;
        }
        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes sheetUp {
          from {
            transform: translateY(22px);
            opacity: 0.72;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="md:hidden py-2 flex justify-center border-b border-gray-200 dark:border-zinc-800"
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        onTouchCancel={handleSheetTouchCancel}
      >
        <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-zinc-700" />
      </div>

      <div className="flex border-b border-gray-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-all ${
            activeTab === 'ENTITY' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10' 
              : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100/50 dark:hover:bg-white/5'
          }`} 
          onClick={() => setActiveTab('ENTITY')}
        >
          Entity
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-all ${
            activeTab === 'RELATIONSHIP' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10' 
              : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100/50 dark:hover:bg-white/5'
          }`} 
          onClick={() => {
            if (editingEntityId) setSelectedNodeIds([]);
            setActiveTab('RELATIONSHIP');
          }}
          data-tutorial="relationship-tab"
        >
          Relationship
        </button>
      </div>

      <div className="flex-1 overflow-y-scroll bg-white dark:bg-zinc-900 sidebar-scroll">
        <div className="p-3 md:p-4 pr-4">
        {selectedNodeIds.length > 1 ? (
          <div className="space-y-4 pb-24 md:pb-10">
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 dark:bg-blue-400/15 border border-blue-300/40 dark:border-blue-400/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <MousePointer2 size={18} />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800 dark:text-zinc-100">{selectedNodeIds.length} items selected</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Bulk actions will affect all selected nodes.</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pt-3 pb-4 md:pb-3 space-y-2">
              <Button
                variant="danger"
                className="w-full py-3 text-sm"
                onClick={deleteSelected}
              >
                Delete Selection
              </Button>
              <Button
                variant="ghost"
                className="w-full py-2 text-sm"
                onClick={() => setSelectedNodeIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'ENTITY' && (
              <div className="space-y-4 md:space-y-6 pb-28 md:pb-12" onWheel={(e) => e.stopPropagation()}>
                <div>
                  <div className="flex justify-between items-center mb-2 md:mb-2">
                    <label className="block text-sm font-bold text-gray-800 dark:text-zinc-200">
                      {editingEntityId ? "Edit Entity Name" : "1. New Entity"}
                    </label>
                    {editingEntityId && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 md:py-1 rounded font-bold text-xs">
                        EDITING
                      </span>
                    )}
                  </div>
                  <input 
                    ref={entityNameInputRef}
                    type="text" 
                    value={newEntityLabel} 
                    onChange={(e) => setNewEntityLabel(e.target.value)} 
                    placeholder="Entity Name" 
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 text-base transition-all"
                    data-tutorial="entity-input"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="next"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="weakEntity" 
                      checked={isWeakEntity} 
                      onChange={(e) => setIsWeakEntity(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="weakEntity" className="text-sm text-gray-600 dark:text-zinc-400 cursor-pointer">
                      Weak Entity (double-bordered)
                    </label>
                  </div>
                </div>
                
                <div data-tutorial="attributes-panel">
                  <div className="flex items-center justify-between mb-2 md:mb-2">
                    <label className="block text-sm font-bold text-gray-800 dark:text-zinc-200">
                      {editingEntityId ? "Edit Attributes" : "2. Attributes"}
                    </label>
                    <button 
                      onClick={handleAddAttributeField} 
                      className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2" data-tutorial="attributes-section">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-2 border border-gray-200 dark:border-zinc-800 rounded-lg p-2.5 bg-gray-50 dark:bg-zinc-800">
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-700 dark:text-zinc-100 transition-all" 
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); 
                              }}
                              enterKeyHint={idx === newAttributes.length - 1 ? 'done' : 'next'}
                              autoCapitalize="none"
                              autoCorrect="off"
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveAttributeField(idx)} 
                            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                          >
                            PK
                          </button>
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isMultivalued 
                                ? 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-300/50 dark:border-purple-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                          >
                            Multi
                          </button>
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isDerived 
                                ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300/50 dark:border-blue-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} 
                          >
                            Der
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pt-3 pb-4 md:pb-3 space-y-2">
                  {editingEntityId && (
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleSaveEntity} 
                        className="flex-1 py-3 text-sm" 
                        variant="success" 
                        icon={Check}
                      >
                        Update Entity
                      </Button>
                      <Button
                        onClick={deleteSelected}
                        className="py-3 px-4 text-sm rounded-lg"
                        variant="danger"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                  {!editingEntityId && (
                    <Button 
                      onClick={handleSaveEntity} 
                      className="w-full py-3 text-sm" 
                      variant="primary" 
                      icon={Plus}
                    >
                      Create Entity
                    </Button>
                  )}
                  {editingEntityId && (
                    <Button 
                      onClick={() => setSelectedNodeIds([])}
                      className="w-full text-sm py-2"
                      variant="ghost"
                      data-tutorial="cancel-edit-btn"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'RELATIONSHIP' && (
              <div className="space-y-3 md:space-y-4 pb-28 md:pb-12 overscroll-contain" onWheel={(e) => e.stopPropagation()} data-tutorial="relationship-form">
                <div className="flex justify-between items-center mb-1.5 md:mb-1">
                  <label className="block text-sm font-bold text-gray-800 dark:text-zinc-200">
                    Relationship Name
                  </label>
                  {editingRelId && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 md:py-1 rounded font-bold text-xs">
                      EDITING
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={relLabel} 
                  onChange={(e) => setRelLabel(e.target.value)} 
                  placeholder="e.g. Enrolls In" 
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 text-base transition-all"
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="done"
                />
                
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 overflow-visible">
                  {/* Entity 1 */}
                  <div className="p-3 md:p-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">
                      Entity 1
                    </label>
                    <div className="flex gap-2 items-center">
                      <EntitySelect
                          value={relEntity1}
                          onChange={setRelEntity1}
                          entities={nodes.filter(n => n.type === 'ENTITY')}
                          accent="blue"
                        />
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 shadow-sm">
                        {(['1', 'N', 'M'] as const).map(card => (
                          <button
                            key={card}
                            type="button"
                            onClick={() => setCardinality1(card)}
                            className={`w-11 py-3 text-xs font-black transition-all ${
                              cardinality1 === card
                                ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-inner'
                                : 'bg-white/50 dark:bg-white/5 text-gray-400 dark:text-zinc-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400'
                            }`}
                          >
                            {card}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider with connector badge */}
                  <div className="flex items-center gap-2 px-3 md:px-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/15" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-300/30 dark:border-blue-400/20 text-blue-500 dark:text-blue-400">
                      <Link size={11} />
                      <span className="text-xs font-bold tracking-wide">relates to</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 dark:via-white/15" />
                  </div>

                  {/* Entity 2 */}
                  <div className="p-3 md:p-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-2">
                      Entity 2
                    </label>
                    <div className="flex gap-2 items-center">
                      <EntitySelect
                          value={relEntity2}
                          onChange={setRelEntity2}
                          entities={nodes.filter(n => n.type === 'ENTITY')}
                          accent="purple"
                        />
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 shadow-sm">
                        {(['1', 'N', 'M'] as const).map(card => (
                          <button
                            key={card}
                            type="button"
                            onClick={() => setCardinality2(card)}
                            className={`w-11 py-3 text-xs font-black transition-all ${
                              cardinality2 === card
                                ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-inner'
                                : 'bg-white/50 dark:bg-white/5 text-gray-400 dark:text-zinc-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-500 dark:hover:text-purple-400'
                            }`}
                          >
                            {card}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 md:mb-2">
                    <label className="block text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Relationship Attributes
                    </label>
                    <button 
                      onClick={handleAddAttributeField} 
                      className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-2 border border-gray-200 dark:border-zinc-800 rounded-lg p-2.5 bg-gray-50 dark:bg-zinc-800">
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-700 dark:text-zinc-100 transition-all" 
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); 
                              }}
                              enterKeyHint={idx === newAttributes.length - 1 ? 'done' : 'next'}
                              autoCapitalize="none"
                              autoCorrect="off"
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveAttributeField(idx)} 
                            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                          >
                            PK
                          </button>
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isMultivalued 
                                ? 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-300/50 dark:border-purple-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                          >
                            Multi
                          </button>
                          <button 
                            type="button"
                            className={`flex-1 py-2 px-2 rounded-lg font-bold border transition-colors text-xs ${
                              attr.isDerived 
                                ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300/50 dark:border-blue-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-zinc-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} 
                          >
                            Der
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pt-3 pb-4 md:pb-3 space-y-2">
                  <Button 
                    onClick={handleSaveRelationship} 
                    className="w-full py-3 text-sm" 
                    variant={editingRelId ? "success" : "primary"} 
                    icon={editingRelId ? Check : Plus}
                  >
                    {editingRelId ? "Update Relationship" : "Connect Entities"}
                  </Button>
                  {editingRelId && (
                    <Button 
                      onClick={() => setSelectedNodeIds([])} 
                      className="w-full text-sm py-2" 
                      variant="ghost"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
