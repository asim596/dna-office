import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FamilyTree {
  id: string;
  name: string;
  description?: string;
  privacyLevel: 'private' | 'public' | 'shared';
  personCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FamilyTreeStore {
  trees: FamilyTree[];
  currentTree: FamilyTree | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setTrees: (trees: FamilyTree[]) => void;
  setCurrentTree: (tree: FamilyTree | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API actions
  fetchTrees: () => Promise<void>;
  createTree: (data: Partial<FamilyTree>) => Promise<void>;
}

export const useFamilyTreeStore = create<FamilyTreeStore>()(
  persist(
    (set, get) => ({
      trees: [],
      currentTree: null,
      loading: false,
      error: null,

      setTrees: (trees) => set({ trees }),
      setCurrentTree: (currentTree) => set({ currentTree }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      fetchTrees: async () => {
        try {
          set({ loading: true, error: null });
          const response = await fetch('/api/family-trees', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch trees');
          }

          const data = await response.json();
          set({ trees: data.data, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      createTree: async (data) => {
        try {
          set({ loading: true, error: null });
          const response = await fetch('/api/family-trees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error('Failed to create tree');
          }

          const result = await response.json();
          const { trees } = get();
          set({ trees: [...trees, result.data], loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },
    }),
    {
      name: 'family-tree-store',
      partialize: (state) => ({
        trees: state.trees,
        currentTree: state.currentTree,
      }),
    }
  )
);
