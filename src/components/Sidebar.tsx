import React from 'react';
import { Plus, Check, X, Link, MousePointer2 } from 'lucide-react';
import type { Node, AttributeInput } from '../types';
import { Button } from './Button';

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
  setSelectedNodeIds
}) => {
  return (
    <div className="absolute top-0 left-0 md:top-4 md:left-4 w-full md:w-96 md:rounded-3xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-3xl flex flex-col shadow-2xl z-10 overflow-hidden transition-all animate-fade-in-up h-full md:h-[calc(100vh-2rem)] border border-white/10 dark:border-white/5" style={{scrollbarWidth: 'none', WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden'}}>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 0px;
        }
        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex border-b border-white/10 dark:border-white/5 flex-shrink-0 bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl">
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-all ${
            activeTab === 'ENTITY' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5'
          }`} 
          onClick={() => setActiveTab('ENTITY')}
        >
          Entity
        </button>
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-all ${
            activeTab === 'RELATIONSHIP' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5'
          }`} 
          onClick={() => setActiveTab('RELATIONSHIP')}
          data-tutorial="relationship-tab"
        >
          Relationship
        </button>
      </div>

      <div className="flex-1 overflow-y-scroll bg-white/5 dark:bg-white/[0.02] backdrop-blur-3xl sidebar-scroll">
        <div className="p-2 md:p-4 pr-4">
        {selectedNodeIds.length > 1 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/20 dark:border-white/10">
            <MousePointer2 size={32} className="mb-2 opacity-20 md:size-12 md:mb-4" />
            <p className="text-sm md:text-base font-medium">{selectedNodeIds.length} items selected</p>
            <Button variant="danger" className="mt-2 md:mt-4 text-xs md:text-sm py-1.5 md:py-2" onClick={deleteSelected}>
              Delete Selection
            </Button>
          </div>
        ) : (
          <>
            {activeTab === 'ENTITY' && (
              <div className="space-y-3 md:space-y-6 pb-8 md:pb-12" onWheel={(e) => e.stopPropagation()}>
                <div>
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <label className="block text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200">
                      {editingEntityId ? "Edit Entity Name" : "1. New Entity"}
                    </label>
                    {editingEntityId && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 md:py-1 rounded font-bold text-xs">
                        EDITING
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={newEntityLabel} 
                    onChange={(e) => setNewEntityLabel(e.target.value)} 
                    placeholder="Entity Name" 
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 text-sm md:text-base transition-all"
                    data-tutorial="entity-input"
                  />
                  <div className="mt-1.5 md:mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="weakEntity" 
                      checked={isWeakEntity} 
                      onChange={(e) => setIsWeakEntity(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="weakEntity" className="text-xs md:text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      Weak Entity (double-bordered)
                    </label>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <label className="block text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200">
                      {editingEntityId ? "Edit Attributes" : "2. Attributes"}
                    </label>
                    <button 
                      onClick={handleAddAttributeField} 
                      className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1.5 md:space-y-2" data-tutorial="attributes-section">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-1.5 border border-gray-200/20 dark:border-white/10 rounded-lg p-1.5 md:p-2 bg-white/5 dark:bg-white/5 backdrop-blur-xl">
                        <div className="flex gap-1.5 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-1.5 md:px-2 py-1 md:py-1.5 text-xs md:text-sm border border-gray-200/20 dark:border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white/10 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 transition-all" 
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); 
                              }}
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveAttributeField(idx)} 
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                          >
                            <X size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 text-xs">
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                            title="Primary Key"
                          >
                            PK
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isMultivalued 
                                ? 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-300/50 dark:border-purple-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                            title="Multivalued (double ellipse)"
                          >
                            Multi
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isDerived 
                                ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300/50 dark:border-blue-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} 
                            title="Derived (dashed)"
                          >
                            Der
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveEntity} 
                  className="w-full py-2 md:py-3 text-xs md:text-sm" 
                  variant={editingEntityId ? "success" : "primary"} 
                  icon={editingEntityId ? Check : Plus}
                >
                  {editingEntityId ? "Update Entity" : "Create Entity"}
                </Button>
                {editingEntityId && (
                  <Button 
                    onClick={() => setSelectedNodeIds([])} 
                    className="w-full text-xs md:text-sm py-1.5 md:py-2" 
                    variant="ghost"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            )}

            {activeTab === 'RELATIONSHIP' && (
              <div className="space-y-2 md:space-y-4 pb-8 md:pb-12 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-0.5 md:mb-1">
                  <label className="block text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200">
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
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 text-sm md:text-base transition-all"
                />
                
                <div className="p-2 md:p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl space-y-2 md:space-y-3 border border-gray-200/50 dark:border-white/10">
                  <div className="flex items-end gap-1.5 md:gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 md:mb-1">
                        Entity 1
                      </label>
                      <select 
                        value={relEntity1} 
                        onChange={(e) => setRelEntity1(e.target.value)} 
                        className="w-full px-1.5 md:px-2 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-lg text-xs md:text-sm bg-white/70 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 transition-all"
                      >
                        <option value="">Select...</option>
                        {nodes.filter(n => n.type === 'ENTITY').map(n => (
                          <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-12 md:w-16">
                      <select 
                        value={cardinality1} 
                        onChange={e => setCardinality1(e.target.value)} 
                        className="w-full px-1 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-lg text-xs md:text-sm bg-white/70 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 text-center transition-all"
                      >
                        <option value="1">1</option>
                        <option value="N">N</option>
                        <option value="M">M</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-center text-gray-400 dark:text-gray-500">
                    <Link size={14} className="md:w-4 md:h-4" />
                  </div>
                  
                  <div className="flex items-end gap-1.5 md:gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 md:mb-1">
                        Entity 2
                      </label>
                      <select 
                        value={relEntity2} 
                        onChange={(e) => setRelEntity2(e.target.value)} 
                        className="w-full px-1.5 md:px-2 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-lg text-xs md:text-sm bg-white/70 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 transition-all"
                      >
                        <option value="">Select...</option>
                        {nodes.filter(n => n.type === 'ENTITY').map(n => (
                          <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-12 md:w-16">
                      <select 
                        value={cardinality2} 
                        onChange={e => setCardinality2(e.target.value)} 
                        className="w-full px-1 py-1.5 md:py-2 border border-gray-200 dark:border-white/10 rounded-lg text-xs md:text-sm bg-white/70 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 text-center transition-all"
                      >
                        <option value="1">1</option>
                        <option value="N">N</option>
                        <option value="M">M</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5 md:mb-2">
                    <label className="block text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200">
                      Relationship Attributes
                    </label>
                    <button 
                      onClick={handleAddAttributeField} 
                      className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-1.5 border border-gray-200/20 dark:border-white/10 rounded-lg p-1.5 md:p-2 bg-white/5 dark:bg-white/5 backdrop-blur-xl">
                        <div className="flex gap-1.5 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-1.5 md:px-2 py-1 md:py-1.5 text-xs md:text-sm border border-gray-200/20 dark:border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white/10 dark:bg-white/5 backdrop-blur-sm dark:text-gray-100 transition-all" 
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter' && idx === newAttributes.length - 1) handleAddAttributeField(); 
                              }}
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveAttributeField(idx)} 
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                          >
                            <X size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 text-xs">
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                            title="Primary Key"
                          >
                            PK
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isMultivalued 
                                ? 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-300/50 dark:border-purple-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                            title="Multivalued (double ellipse)"
                          >
                            Multi
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-bold border transition-colors flex-shrink-0 ${
                              attr.isDerived 
                                ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-300/50 dark:border-blue-500/50' 
                                : 'bg-gray-200/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200/20 dark:border-white/10'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isDerived', !attr.isDerived)} 
                            title="Derived (dashed)"
                          >
                            Der
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSaveRelationship} 
                  className="w-full py-2 md:py-3 text-xs md:text-sm" 
                  variant={editingRelId ? "success" : "primary"} 
                  icon={editingRelId ? Check : Plus}
                >
                  {editingRelId ? "Update Relationship" : "Connect Entities"}
                </Button>
                {editingRelId && (
                  <Button 
                    onClick={() => setSelectedNodeIds([])} 
                    className="w-full text-xs md:text-sm py-1.5 md:py-2" 
                    variant="ghost"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
