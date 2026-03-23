import { useState, useCallback, useEffect } from 'react';
import {
  toggleFavorite as dbToggleFavorite,
  isFavorite as dbIsFavorite,
  getFavorites as dbGetFavorites,
  Policy,
} from '../database';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Policy[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const loadFavorites = useCallback(() => {
    try {
      const favs = dbGetFavorites();
      setFavorites(favs);
      setFavoriteIds(new Set(favs.map(p => p.id)));
    } catch (err) {
      console.warn('Error loading favorites:', err);
    }
  }, []);

  const toggleFavorite = useCallback(
    (policyId: string): boolean => {
      const isNowFavorited = dbToggleFavorite(policyId);
      loadFavorites(); // Refresh the list
      return isNowFavorited;
    },
    [loadFavorites],
  );

  const checkIsFavorite = useCallback(
    (policyId: string): boolean => {
      return favoriteIds.has(policyId);
    },
    [favoriteIds],
  );

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    favoriteIds,
    toggleFavorite,
    isFavorite: checkIsFavorite,
    refreshFavorites: loadFavorites,
  };
}
