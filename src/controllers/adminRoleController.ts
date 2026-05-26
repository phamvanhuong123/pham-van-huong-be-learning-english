import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminRoleService } from '@/services/adminRoleService';

export const adminRoleController = {
  getRoles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminRoleService.getRoles();
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  createRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const data = await adminRoleService.createRole(adminId, req.body);
      res.status(StatusCodes.CREATED).json({ message: 'Tạo Role thành công', data });
    } catch (error) {
      next(error);
    }
  },

  updateRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const { description } = req.body;
      const data = await adminRoleService.updateRole(adminId, id, description);
      res.status(StatusCodes.OK).json({ message: 'Cập nhật Role thành công', data });
    } catch (error) {
      next(error);
    }
  },

  deleteRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      await adminRoleService.deleteRole(adminId, id);
      res.status(StatusCodes.OK).json({ message: 'Xoá Role thành công' });
    } catch (error) {
      next(error);
    }
  },

  getPermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminRoleService.getPermissions();
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  getRolePermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const data = await adminRoleService.getRolePermissions(id);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  updateRolePermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const { permissionIds } = req.body;
      await adminRoleService.updateRolePermissions(adminId, id, permissionIds);
      res.status(StatusCodes.OK).json({ message: 'Cập nhật phân quyền thành công' });
    } catch (error) {
      next(error);
    }
  }
};
