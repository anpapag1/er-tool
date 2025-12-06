import { useCallback } from 'react';
import type { Node, Connection } from '../types';
import LZString from 'lz-string';

export const useShare = (
  nodes: Node[],
  connections: Connection[],
  setShowToast: (show: boolean) => void
) => {
  const handleShare = useCallback(() => {
    try {
      const data = JSON.stringify({ nodes, connections });
      const compressed = LZString.compressToEncodedURIComponent(data);
      const url = `${window.location.origin}${window.location.pathname}?diagram=${compressed}`;

      navigator.clipboard.writeText(url).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      });
    } catch (error) {
      console.error('Failed to generate share link:', error);
      alert('Failed to generate share link. Diagram might be too large.');
    }
  }, [nodes, connections, setShowToast]);

  return { handleShare };
};
