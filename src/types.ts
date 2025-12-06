export type NodeType = 'ENTITY' | 'ATTRIBUTE' | 'RELATIONSHIP';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  isPrimaryKey?: boolean;
  parentId?: string;
  isWeak?: boolean; // For weak entities
  isMultivalued?: boolean; // For multivalued attributes
  isDerived?: boolean; // For derived attributes
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface AttributeInput {
  id: string;
  label: string;
  isPrimaryKey: boolean;
  isMultivalued: boolean;
  isDerived: boolean;
}

export interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

export interface PhysicsConfig {
  repulsion: number;
  collisionRadius: number;
  damping: number;
  springLength: number;
  springStiffness: number;
}

export interface HistoryState {
  past: Array<{ nodes: Node[], connections: Connection[] }>;
  future: Array<{ nodes: Node[], connections: Connection[] }>;
}

export interface TutorialStep {
  title: string;
  content: string;
  highlight: 'sidebar' | 'canvas' | 'shortcuts' | 'export' | null;
}
