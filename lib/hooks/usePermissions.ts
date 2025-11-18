'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export type ResourceType = 'personnel' | 'notes' | 'tasks' | 'permissions';

export interface Permission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ResourcePermissions {
  personnel: Permission;
  notes: Permission;
  tasks: Permission;
  permissions: Permission;
}

export interface UsePermissionsReturn {
  permissions: ResourcePermissions | null;
  role: string | null;
  hierarchyLevel: number | null;
  isLoading: boolean;
  isOwner: boolean;
  userId: string | null;
  canView: (resource: ResourceType) => boolean;
  canCreate: (resource: ResourceType) => boolean;
  canEdit: (resource: ResourceType) => boolean;
  canDelete: (resource: ResourceType) => boolean;
  canViewNote: (note: { author_id: string }) => boolean;
  canEditNote: (note: { author_id: string }) => boolean;
  canDeleteNote: (note: { author_id: string }) => boolean;
  canViewTask: (task: { author_id?: string | null }) => boolean;
  canEditTask: (task: { author_id?: string | null }) => boolean;
  canDeleteTask: (task: { author_id?: string | null }) => boolean;
  canCreateNoteFor: (personnelId: string, personnelMetadata?: any) => boolean;
  canCreateTaskFor: (personnelId: string, personnelMetadata?: any) => boolean;
}

const defaultPermission: Permission = {
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
};

const ownerPermission: Permission = {
  can_view: true,
  can_create: true,
  can_edit: true,
  can_delete: true,
};

export function usePermissions(): UsePermissionsReturn {
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<ResourcePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // Derive values from AuthContext
  const role = profile?.role || null;
  const hierarchyLevel = profile?.hierarchy_level || null;
  const organizationId = profile?.organization_id || null;
  const userId = user?.id || null;

  useEffect(() => {
    if (!authLoading && profile) {
      fetchPermissions();
    } else if (!authLoading && !profile) {
      setIsLoading(false);
    }
  }, [authLoading, profile?.role, profile?.organization_id]);

  // Real-time subscription for permission changes - optional, don't block UI
  useEffect(() => {
    if (!organizationId || !role || role === 'owner' || !hasFetched) return;

    const channel = supabase
      .channel(`permissions-changes-${organizationId}-${role}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'permissions',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          console.log('Permissions updated, refetching...');
          fetchPermissions();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Permissions real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Permissions real-time subscription error (non-blocking)');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, role, hasFetched]);

  const fetchPermissions = async () => {
    try {
      if (!profile || !user) {
        setIsLoading(false);
        return;
      }

      // Only show loading on first fetch
      if (!hasFetched) {
        setIsLoading(true);
      }

      // Owner has full permissions on everything
      if (profile.role === 'owner') {
        setPermissions({
          personnel: ownerPermission,
          notes: ownerPermission,
          tasks: ownerPermission,
          permissions: ownerPermission,
        });
        setHasFetched(true);
        setIsLoading(false);
        return;
      }

      // Fetch permissions for manager/personnel
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('resource_type, can_view, can_create, can_edit, can_delete')
        .eq('organization_id', profile.organization_id)
        .eq('role', profile.role);

      if (permissionsError) throw permissionsError;

      // Build permissions object
      const permissionsMap: ResourcePermissions = {
        personnel: defaultPermission,
        notes: defaultPermission,
        tasks: defaultPermission,
        permissions: defaultPermission,
      };

      permissionsData?.forEach((perm) => {
        const resourceType = perm.resource_type as ResourceType;
        permissionsMap[resourceType] = {
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
        };
      });

      setPermissions(permissionsMap);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canView = (resource: ResourceType): boolean => {
    if (role === 'owner') return true;
    return permissions?.[resource]?.can_view ?? false;
  };

  const canCreate = (resource: ResourceType): boolean => {
    if (role === 'owner') return true;
    return permissions?.[resource]?.can_create ?? false;
  };

  const canEdit = (resource: ResourceType): boolean => {
    if (role === 'owner') return true;
    return permissions?.[resource]?.can_edit ?? false;
  };

  const canDelete = (resource: ResourceType): boolean => {
    if (role === 'owner') return true;
    return permissions?.[resource]?.can_delete ?? false;
  };

  // Note-based permission checks
  const canViewNote = (note: { author_id: string }): boolean => {
    // Owner sees everything
    if (role === 'owner') return true;
    
    // Everyone sees their own notes
    if (note.author_id === userId) return true;
    
    // Backend RLS handles the rest (personnel_id checks)
    // If note is visible, it means RLS allowed it
    return true;
  };

  const canEditNote = (note: { author_id: string }): boolean => {
    if (role === 'owner') return true;
    return note.author_id === userId && canEdit('notes');
  };

  const canDeleteNote = (note: { author_id: string }): boolean => {
    if (role === 'owner') return true;
    return note.author_id === userId && canDelete('notes');
  };

  // Task-based permission checks
  const canViewTask = (task: { author_id?: string | null }): boolean => {
    if (role === 'owner') return true;
    if (task.author_id === userId) return true;
    // Backend RLS handles hierarchy, frontend just checks ownership
    return true;
  };

  const canEditTask = (task: { author_id?: string | null }): boolean => {
    if (role === 'owner') return true;
    return task.author_id === userId && canEdit('tasks');
  };

  const canDeleteTask = (task: { author_id?: string | null }): boolean => {
    if (role === 'owner') return true;
    return task.author_id === userId && canDelete('tasks');
  };

  // Check if user can create note for specific personnel
  const canCreateNoteFor = (personnelId: string, personnelMetadata?: any): boolean => {
    // Must have create permission first
    if (!canCreate('notes')) return false;
    
    // Owner can create for anyone
    if (role === 'owner') return true;
    
    // Manager can create for anyone (Owner filtered in list)
    if (role === 'manager') return true;
    
    // Personnel can only create for themselves
    if (role === 'personnel') {
      // Check if personnel.id matches userId (profile-based personnel)
      if (personnelId === userId) return true;
      
      // Check if personnel.metadata.user_id matches userId (manual personnel)
      if (personnelMetadata?.user_id === userId) return true;
      
      return false;
    }
    
    return false;
  };

  // Check if user can create task for specific personnel
  const canCreateTaskFor = (personnelId: string, personnelMetadata?: any): boolean => {
    // Must have create permission first
    if (!canCreate('tasks')) return false;
    
    // Owner can create for anyone
    if (role === 'owner') return true;
    
    // Manager can create for anyone (Owner filtered in list)
    if (role === 'manager') return true;
    
    // Personnel can only create for themselves
    if (role === 'personnel') {
      // Check if personnel.id matches userId (profile-based personnel)
      if (personnelId === userId) return true;
      
      // Check if personnel.metadata.user_id matches userId (manual personnel)
      if (personnelMetadata?.user_id === userId) return true;
      
      return false;
    }
    
    return false;
  };

  return {
    permissions,
    role,
    hierarchyLevel,
    isLoading,
    isOwner: role === 'owner',
    userId,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canViewNote,
    canEditNote,
    canDeleteNote,
    canViewTask,
    canEditTask,
    canDeleteTask,
    canCreateNoteFor,
    canCreateTaskFor,
  };
}
