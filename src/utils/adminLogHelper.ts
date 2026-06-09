import { prisma } from '@/config/prisma';

export interface CreateAdminLogParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: any;
  ipAddress?: string;
}


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
