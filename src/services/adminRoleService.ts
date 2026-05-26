import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { createAdminLog } from '@/utils/adminLogHelper';

export const adminRoleService = {
  getRoles: async () => {
    return prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  createRole: async (adminId: string, data: { name: string; description: string }) => {
    const exists = await prisma.role.findUnique({ where: { name: data.name } });
    if (exists) throw new ApiError('Role đã tồn tại', StatusCodes.CONFLICT);

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: false
      }
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'role.create',
      targetType: 'Role',
      targetId: role.id,
      detail: { name: role.name }
    });

    return role;
  },

  updateRole: async (adminId: string, id: string, description: string) => {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new ApiError('Role không tồn tại', StatusCodes.NOT_FOUND);

    const updatedRole = await prisma.role.update({
      where: { id },
      data: { description }
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'role.update',
      targetType: 'Role',
      targetId: id,
      detail: { description }
    });

    return updatedRole;
  },

  deleteRole: async (adminId: string, id: string) => {
    const role = await prisma.role.findUnique({ 
      where: { id },
      include: { _count: { select: { userRoles: true } } }
    });
    if (!role) throw new ApiError('Role không tồn tại', StatusCodes.NOT_FOUND);
    if (role.isSystem) throw new ApiError('Không thể xoá System Role', StatusCodes.FORBIDDEN);
    if (role._count.userRoles > 0) throw new ApiError('Role đang được sử dụng bởi user, không thể xoá', StatusCodes.BAD_REQUEST);

    await prisma.role.delete({ where: { id } });

    await createAdminLog(prisma, {
      adminId,
      action: 'role.delete',
      targetType: 'Role',
      targetId: id,
      detail: { name: role.name }
    });

    return { success: true };
  },

  getPermissions: async () => {
    const permissions = await prisma.permission.findMany();
    
    // Group permissions by 'group' field
    const grouped = permissions.reduce((acc: any, perm) => {
      const groupName = perm.group || 'other';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(perm);
      return acc;
    }, {});

    return grouped;
  },

  getRolePermissions: async (roleId: string) => {
    const rp = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: true }
    });
    return rp.map(item => item.permission);
  },

  updateRolePermissions: async (adminId: string, roleId: string, permissionIds: string[]) => {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new ApiError('Role không tồn tại', StatusCodes.NOT_FOUND);

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permId => ({
            roleId,
            permissionId: permId
          }))
        });
      }

      await createAdminLog(tx, {
        adminId,
        action: 'role.update_permissions',
        targetType: 'Role',
        targetId: roleId,
        detail: { permissionIds }
      });
    });

    return { success: true };
  }
};
