/**
 * @deprecated This file is kept for backward compatibility only.
 * Please use `import { useAuth } from '@/lib/contexts/AuthContext'` instead.
 * 
 * This hook now re-exports the useAuth from AuthContext to maintain
 * backward compatibility with existing code. All new code should import
 * directly from AuthContext.
 * 
 * Migration: Replace all imports of this file with:
 * import { useAuth } from '@/lib/contexts/AuthContext';
 */

export { useAuth } from '@/lib/contexts/AuthContext';
