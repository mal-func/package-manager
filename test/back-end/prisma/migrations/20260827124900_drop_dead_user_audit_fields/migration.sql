-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_updatedById_fkey`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `createdById`,
    DROP COLUMN `isActive`,
    DROP COLUMN `updatedById`;
