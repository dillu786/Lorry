import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

enum AuditActionType {
  GRANT,
  REVOKE,
  ROLE_CREATE,
  ROLE_UPDATE,
  ROLE_DELETE,
}

async function main() {
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const adminUser = await prisma.admin.upsert({
    where: { email: 'admin@returnlorry.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'admin@returnlorry.com',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      isActive: true,
      updatedAt: new Date(),
    },
  })

  const categories = [
    { name: 'Dashboard', description: 'Dashboard related permissions', icon: 'layout-dashboard', displayOrder: 1 },
    { name: 'Rides', description: 'Ride management permissions', icon: 'car', displayOrder: 2 },
    { name: 'Users', description: 'User management permissions', icon: 'users', displayOrder: 3 },
    { name: 'Drivers', description: 'Driver management permissions', icon: 'car', displayOrder: 4 },
    { name: 'Owners', description: 'Vehicle owner management permissions', icon: 'user-cog', displayOrder: 5 },
    { name: 'Documents', description: 'Document management permissions', icon: 'file-text', displayOrder: 6 },
    { name: 'Settings', description: 'System settings permissions', icon: 'settings', displayOrder: 7 },
  ]

  const createdCategories = await Promise.all(
    categories.map((category) =>
      prisma.permissionCategory.upsert({
        where: { name: category.name },
        update: category,
        create: {
          id: crypto.randomUUID(),
          ...category,
        },
      })
    )
  )

  const permissionsData = [
    // Dashboard permissions
    {
      name: "View Dashboard",
      code: "dashboard:view",
      description: "Can view the dashboard",
      categoryName: "Dashboard",
    },
    {
      name: "View Analytics",
      code: "dashboard:view_analytics",
      description: "Can view analytics data",
      categoryName: "Dashboard",
    },
    {
      name: "Export Reports",
      code: "dashboard:export",
      description: "Can export dashboard reports",
      categoryName: "Dashboard",
    },

    // Rides permissions
    { name: "View Rides", code: "rides:view", description: "Can view all rides", categoryName: "Rides" },
    { name: "Create Rides", code: "rides:create", description: "Can create new rides", categoryName: "Rides" },
    { name: "Edit Rides", code: "rides:edit", description: "Can edit ride details", categoryName: "Rides" },
    { name: "Delete Rides", code: "rides:delete", description: "Can delete rides", categoryName: "Rides" },
    { name: "Assign Drivers", code: "rides:assign", description: "Can assign drivers to rides", categoryName: "Rides" },
    { name: "Cancel Rides", code: "rides:cancel", description: "Can cancel rides", categoryName: "Rides" },

    // Users permissions
    { name: "View Users", code: "users:view", description: "Can view all users", categoryName: "Users" },
    { name: "Create Users", code: "users:create", description: "Can create new users", categoryName: "Users" },
    { name: "Edit Users", code: "users:edit", description: "Can edit user details", categoryName: "Users" },
    { name: "Delete Users", code: "users:delete", description: "Can delete users", categoryName: "Users" },
    { name: "Block Users", code: "users:block", description: "Can block users", categoryName: "Users" },

    // Drivers permissions
    { name: "View Drivers", code: "drivers:view", description: "Can view all drivers", categoryName: "Drivers" },
    { name: "Create Drivers", code: "drivers:create", description: "Can create new drivers", categoryName: "Drivers" },
    { name: "Edit Drivers", code: "drivers:edit", description: "Can edit driver details", categoryName: "Drivers" },
    { name: "Delete Drivers", code: "drivers:delete", description: "Can delete drivers", categoryName: "Drivers" },
    {
      name: "Approve Drivers",
      code: "drivers:approve",
      description: "Can approve driver applications",
      categoryName: "Drivers",
    },
    { name: "Suspend Drivers", code: "drivers:suspend", description: "Can suspend drivers", categoryName: "Drivers" },

    // Owners permissions
    { name: "View Owners", code: "owners:view", description: "Can view all owners", categoryName: "Owners" },
    { name: "Create Owners", code: "owners:create", description: "Can create new owners", categoryName: "Owners" },
    { name: "Edit Owners", code: "owners:edit", description: "Can edit owner details", categoryName: "Owners" },
    { name: "Delete Owners", code: "owners:delete", description: "Can delete owners", categoryName: "Owners" },
    {
      name: "Approve Owners",
      code: "owners:approve",
      description: "Can approve owner applications",
      categoryName: "Owners",
    },

    // Documents permissions
    {
      name: "View Documents",
      code: "documents:view",
      description: "Can view all documents",
      categoryName: "Documents",
    },
    {
      name: "Upload Documents",
      code: "documents:upload",
      description: "Can upload new documents",
      categoryName: "Documents",
    },
    {
      name: "Verify Documents",
      code: "documents:verify",
      description: "Can verify documents",
      categoryName: "Documents",
    },
    {
      name: "Reject Documents",
      code: "documents:reject",
      description: "Can reject documents",
      categoryName: "Documents",
    },
    {
      name: "Delete Documents",
      code: "documents:delete",
      description: "Can delete documents",
      categoryName: "Documents",
    },

    // Settings permissions
    { name: "View Settings", code: "settings:view", description: "Can view system settings", categoryName: "Settings" },
    { name: "Edit Settings", code: "settings:edit", description: "Can edit system settings", categoryName: "Settings" },
    {
      name: "Manage Access Control",
      code: "settings:access_control",
      description: "Can manage roles and permissions",
      categoryName: "Settings",
    },
    {
      name: "View System Logs",
      code: "settings:system_logs",
      description: "Can view system logs",
      categoryName: "Settings",
    },
  ]

  for (const perm of permissionsData) {
    const category = createdCategories.find((c) => c.name === perm.categoryName)
    if (!category) continue

    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        description: perm.description,
        categoryId: category.id,
      },
      create: {
        id: crypto.randomUUID(),
        name: perm.name,
        code: perm.code,
        description: perm.description,
        categoryId: category.id,
      },
    })
  }

  const roles = [
    { name: 'Super Admin', description: 'Full access to all system features', isSystemRole: true },
    { name: 'Admin', description: 'Access to most system features except critical settings', isSystemRole: true },
    { name: 'Manager', description: 'Can manage users, drivers, and view reports', isSystemRole: true },
    { name: 'Support', description: 'Can view and respond to user inquiries', isSystemRole: true },
    { name: 'Viewer', description: 'Read-only access to dashboards and reports', isSystemRole: true },
  ]

  const createdRoles = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {
          description: role.description,
          isSystemRole: role.isSystemRole,
          createdById: adminUser.id,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          ...role,
          createdById: adminUser.id,
          updatedAt: new Date(),
        },
      })
    )
  )

  const allPermissions = await prisma.permission.findMany()

  const roleMap = Object.fromEntries(createdRoles.map((r) => [r.name, r]))

  const assignPermissions = async (roleName: string, filterFn: (p: any) => boolean) => {
    const role = roleMap[roleName]
    if (!role) return

    for (const permission of allPermissions) {
      if (filterFn(permission)) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            id: crypto.randomUUID(),
            roleId: role.id,
            permissionId: permission.id,
          },
        })
      }
    }
  }

  await assignPermissions('Super Admin', () => true)

  await assignPermissions(
    'Admin',
    (perm) => !perm.code.includes(':delete') && perm.code !== 'settings:system_logs'
  )

  const managerPerms = new Set([
    'dashboard:view',
    'dashboard:view_analytics',
    'rides:view',
    'rides:create',
    'rides:edit',
    'rides:assign',
    'rides:cancel',
    'users:view',
    'users:edit',
    'drivers:view',
    'drivers:edit',
    'owners:view',
    'documents:view',
    'documents:verify',
  ])
  await assignPermissions('Manager', (perm) => managerPerms.has(perm.code))

  const supportPerms = new Set([
    'dashboard:view',
    'rides:view',
    'users:view',
    'drivers:view',
    'documents:view',
  ])
  await assignPermissions('Support', (perm) => supportPerms.has(perm.code))

  const viewerPerms = new Set([
    'dashboard:view',
    'rides:view',
    'users:view',
    'drivers:view',
    'owners:view',
    'documents:view',
  ])
  await assignPermissions('Viewer', (perm) => viewerPerms.has(perm.code))

  // Assign Super Admin role to admin
  const superAdmin = roleMap['Super Admin']
  await prisma.userRole.upsert({
    where: {
      adminId_roleId: {
        adminId: adminUser.id,
        roleId: superAdmin.id,
      },
    },
    update: {},
    create: {
      id: crypto.randomUUID(),
      adminId: adminUser.id,
      roleId: superAdmin.id,
      assignedById: adminUser.id,
    },
  })

  await prisma.permissionAuditLog.create({
    data: {
      id: crypto.randomUUID(),
      actionType: AuditActionType.ROLE_CREATE as any,
      adminId: adminUser.id,
      roleId: superAdmin.id,
      details: 'Initialized Super Admin role with all permissions',
    },
  })

  console.log('✅ Database seeded successfully')
}

main()
  .catch((err) => {
    console.error('❌ Error while seeding:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
