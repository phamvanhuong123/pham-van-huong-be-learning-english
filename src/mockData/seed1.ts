// prisma/seed/sprint1.ts
import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter })

async function main() {
    // Tạo Permissions
    const permissions = [
        { code: 'role.manage', group: 'system', description: 'Quản lý Role & Permission' },
        { code: 'user.view', group: 'user', description: 'Xem danh sách người dùng' },
        { code: 'user.ban', group: 'user', description: 'Ban/Unban tài khoản' },
        { code: 'user.manage', group: 'user', description: 'CRUD người dùng đầy đủ' },
        { code: 'exam.create', group: 'exam', description: 'Tạo đề thi' },
        { code: 'exam.publish', group: 'exam', description: 'Publish/Unpublish đề thi' },
        { code: 'exam.delete', group: 'exam', description: 'Xóa đề thi' },
        { code: 'exam.manage', group: 'exam', description: 'CRUD đề thi đầy đủ' },
        { code: 'exam.ai_generate', group: 'exam', description: 'AI tạo câu hỏi' },
        { code: 'question.manage', group: 'question', description: 'CRUD câu hỏi' },
        { code: 'subscription.approve', group: 'subscription', description: 'Duyệt Subscription' },
        { code: 'notification.broadcast', group: 'notification', description: 'Gửi thông báo hàng loạt' },
        { code: 'analytics.view_all', group: 'analytics', description: 'Xem analytics toàn hệ thống' },
        { code: 'trash.restore', group: 'trash', description: 'Khôi phục bản ghi đã xóa' },
        { code: 'admin.log.view', group: 'system', description: 'Xem Admin Activity Log' },
    ]

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm,
        })
    }

    // Tạo Roles
    const roles = [
        { name: 'SUPER_ADMIN', isSystem: true, description: 'Tối cao, quản lý Role & Permission' },
        { name: 'ADMIN', isSystem: true, description: 'Quản lý vận hành hệ thống' },
        { name: 'TEACHER', isSystem: true, description: 'Tạo và quản lý nội dung đề thi' },
        { name: 'SUPPORT', isSystem: true, description: 'Hỗ trợ người dùng' },
        { name: 'VIP', isSystem: true, description: 'Học viên premium' },
        { name: 'STANDARD', isSystem: true, description: 'Học viên thường' },
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        })
    }

    // Gán Permission cho SUPER_ADMIN (tất cả)
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } })
    const allPermissions = await prisma.permission.findMany()
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole!.id, permissionId: perm.id } },
            update: {},
            create: { roleId: superAdminRole!.id, permissionId: perm.id },
        })
    }

    // Gán Permission cho ADMIN
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    const adminPermCodes = [
        'user.view', 'user.ban', 'user.manage',
        'exam.create', 'exam.publish', 'exam.delete', 'exam.manage',
        'question.manage', 'subscription.approve',
        'notification.broadcast', 'analytics.view_all', 'trash.restore',
    ]
    const adminPerms = await prisma.permission.findMany({ where: { code: { in: adminPermCodes } } })
    for (const perm of adminPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole!.id, permissionId: perm.id } },
            update: {},
            create: { roleId: adminRole!.id, permissionId: perm.id },
        })
    }

    // Gán Permission cho TEACHER
    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } })
    const teacherPermCodes = ['exam.create', 'exam.publish', 'exam.manage', 'question.manage', 'exam.ai_generate']
    const teacherPerms = await prisma.permission.findMany({ where: { code: { in: teacherPermCodes } } })
    for (const perm of teacherPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: teacherRole!.id, permissionId: perm.id } },
            update: {},
            create: { roleId: teacherRole!.id, permissionId: perm.id },
        })
    }

    // Tạo SUPER_ADMIN account
    const superAdminUser = await prisma.user.upsert({
        where: { email: 'superadmin@toeicmaster.com' },
        update: {},
        create: {
            email: 'superadmin@toeicmaster.com',
            passwordHash: await bcrypt.hash('SuperAdmin@2026', 12),
            name: 'Super Admin',
            emailVerified: true,
            isSuperAdmin: true,
        },
    })

    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole!.id } },
        update: {},
        create: { userId: superAdminUser.id, roleId: superAdminRole!.id },
    })

    console.log('✅ Sprint 1 seed hoàn thành')
    console.log('👤 SUPER_ADMIN: superadmin@toeicmaster.com / SuperAdmin@2026')
}

main().catch(console.error).finally(() => prisma.$disconnect())