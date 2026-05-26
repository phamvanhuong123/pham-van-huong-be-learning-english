import { prisma } from '@/config/prisma';

export interface CreateAdminLogParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: any;
  ipAddress?: string;
}

/**
 * Helper để tạo AdminLog, truyền thêm instance prisma nếu đang trong transaction
 * @param prismaInstance - Instance prisma (hoặc transaction instance)
 * @param params - Dữ liệu log
 */
export const createAdminLog = async (
  prismaInstance: any = prisma,
  params: CreateAdminLogParams
) => {
  return prismaInstance.adminLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      detail: params.detail,
      ipAddress: params.ipAddress,
    },
  });
};
