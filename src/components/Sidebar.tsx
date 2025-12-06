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
    <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 border-t md:border-t-0 flex flex-col shadow-lg z-10 overflow-hidden flex-shrink-0 transition-all animate-fade-in-up md:max-h-screen max-h-[60vh]">
      <div className="flex border-b dark:border-gray-700 flex-shrink-0">
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium ${
            activeTab === 'ENTITY' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`} 
          onClick={() => setActiveTab('ENTITY')}
        >
          Entity
        </button>
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium ${
            activeTab === 'RELATIONSHIP' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`} 
          onClick={() => setActiveTab('RELATIONSHIP')}
          data-tutorial="relationship-tab"
        >
          Relationship
        </button>
      </div>

      <div className="p-2 md:p-4 flex-1 overflow-y-auto">
        {selectedNodeIds.length > 1 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <MousePointer2 size={32} className="mb-2 opacity-20 md:size-12 md:mb-4" />
            <p className="text-sm md:text-base">{selectedNodeIds.length} items selected</p>
            <Button variant="danger" className="mt-2 md:mt-4 text-xs md:text-sm py-1.5 md:py-2" onClick={deleteSelected}>
              Delete Selection
            </Button>
          </div>
        ) : (
          <>
            {activeTab === 'ENTITY' && (
              <div className="space-y-3 md:space-y-6">
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
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100 text-sm md:text-base"
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
                  <div className="space-y-1.5 md:space-y-2 max-h-[250px] md:max-h-[450px] overflow-y-auto pr-1 md:pr-2" data-tutorial="attributes-section">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-0.5 border dark:border-gray-600 rounded p-1.5 md:p-2 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex gap-1.5 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-1.5 md:px-2 py-1 md:py-1.5 text-xs md:text-sm border dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100" 
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
                        <div className="flex gap-1 text-xs">
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                            title="Primary Key"
                          >
                            PK
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isMultivalued 
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                            title="Multivalued (double ellipse)"
                          >
                            Multi
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isDerived 
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
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
              <div className="space-y-2 md:space-y-4">
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
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100 text-sm md:text-base"
                />
                
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 md:space-y-3 border dark:border-gray-600">
                  <div className="flex items-end gap-1.5 md:gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 md:mb-1">
                        Entity 1
                      </label>
                      <select 
                        value={relEntity1} 
                        onChange={(e) => setRelEntity1(e.target.value)} 
                        className="w-full px-1.5 md:px-2 py-1.5 md:py-2 border dark:border-gray-600 rounded text-xs md:text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
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
                        className="w-full px-1 py-1.5 md:py-2 border dark:border-gray-600 rounded text-xs md:text-sm bg-white dark:bg-gray-800 dark:text-gray-100 text-center"
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
                        className="w-full px-1.5 md:px-2 py-1.5 md:py-2 border dark:border-gray-600 rounded text-xs md:text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
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
                        className="w-full px-1 py-1.5 md:py-2 border dark:border-gray-600 rounded text-xs md:text-sm bg-white dark:bg-gray-800 dark:text-gray-100 text-center"
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
                  <div className="space-y-1.5 md:space-y-2 max-h-[120px] md:max-h-[150px] overflow-y-auto pr-1 md:pr-2">
                    {newAttributes.map((attr, idx) => (
                      <div key={attr.id} className="flex flex-col gap-0.5 border dark:border-gray-600 rounded p-1.5 md:p-2 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex gap-1.5 items-center">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={attr.label} 
                              onChange={(e) => handleAttributeChange(idx, 'label', e.target.value)} 
                              placeholder={`Attr ${idx + 1}`} 
                              className="w-full px-1.5 md:px-2 py-1 md:py-1.5 text-xs md:text-sm border dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100" 
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
                        <div className="flex gap-1 text-xs">
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isPrimaryKey 
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isPrimaryKey', !attr.isPrimaryKey)} 
                            title="Primary Key"
                          >
                            PK
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isMultivalued 
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                            }`} 
                            onClick={() => handleAttributeChange(idx, 'isMultivalued', !attr.isMultivalued)} 
                            title="Multivalued (double ellipse)"
                          >
                            Multi
                          </div>
                          <div 
                            className={`cursor-pointer px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold border transition-colors flex-shrink-0 ${
                              attr.isDerived 
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-500'
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
  );
};
