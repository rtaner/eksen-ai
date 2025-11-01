'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  isLoading: boolean;
  isOwner: boolean;
  canView: (resource: ResourceType) => boolean;
  canCreate: (resource: ResourceType) => boolean;
  canEdit: (resource: ResourceType) => boolean;
  canDelete: (resource: ResourceType) => boolean;
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
  const [permissions, setPermissions] = useState<ResourcePermissions | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's profile to find role and organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setRole(profile.role);

      // Owner has full permissions on everything
      if (profile.role === 'owner') {
        setPermissions({
          personnel: ownerPermission,
          notes: ownerPermission,
          tasks: ownerPermission,
          permissions: ownerPermission,
        });
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

  return {
    permissions,
    role,
    isLoading,
    isOwner: role === 'owner',
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
