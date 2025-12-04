import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}