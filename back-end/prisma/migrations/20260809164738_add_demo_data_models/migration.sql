-- CreateTable
CREATE TABLE `demo_state_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `stateCode` VARCHAR(10) NOT NULL,
    `stateName` VARCHAR(100) NOT NULL,
    `projectCount` INTEGER NOT NULL,
    `activityIntensity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `demo_state_metrics_stateCode_key`(`stateCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demo_chart_datasets` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `chartType` VARCHAR(30) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `demo_chart_datasets_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demo_chart_points` (
    `id` VARCHAR(191) NOT NULL,
    `datasetId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `series` VARCHAR(100) NULL,
    `value` DOUBLE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `demo_chart_points_datasetId_idx`(`datasetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demo_table_datasets` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `demo_table_datasets_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demo_table_rows` (
    `id` VARCHAR(191) NOT NULL,
    `datasetId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `demo_table_rows_datasetId_idx`(`datasetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `demo_chart_points` ADD CONSTRAINT `demo_chart_points_datasetId_fkey` FOREIGN KEY (`datasetId`) REFERENCES `demo_chart_datasets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demo_table_rows` ADD CONSTRAINT `demo_table_rows_datasetId_fkey` FOREIGN KEY (`datasetId`) REFERENCES `demo_table_datasets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
