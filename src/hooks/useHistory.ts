import { useState, useCallback } from 'react';
import type { Node, Connection, HistoryState } from '../types';

const MAX_HISTORY = 50;

export const useHistory = (nodes: Node[], connections: Connection[]) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: []
  });

  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newPast = [...prev.past, { nodes, connections }];
      // Limit history to MAX_HISTORY items
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [] // Clear future when new action is performed
      };
    });
  }, [nodes, connections]);

  const undo = useCallback((
    setNodes: (nodes: Node[]) => void,
    setConnections: (connections: Connection[]) => void,
    setSelectedNodeIds: (ids: string[]) => void
  ) => {
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    setHistory({
      past: newPast,
      future: [{ nodes, connections }, ...history.future]
    });

    setNodes(previous.nodes);
    setConnections(previous.connections);
    setSelectedNodeIds([]);
  }, [history, nodes, connections]);

  const redo = useCallback((
    setNodes: (nodes: Node[]) => void,
    setConnections: (connections: Connection[]) => void,
    setSelectedNodeIds: (ids: string[]) => void
  ) => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, { nodes, connections }],
      future: newFuture
    });

    setNodes(next.nodes);
    setConnections(next.connections);
    setSelectedNodeIds([]);
  }, [history, nodes, connections]);

  return {
    history,
    saveHistory,
    undo,
    redo
  };
};
