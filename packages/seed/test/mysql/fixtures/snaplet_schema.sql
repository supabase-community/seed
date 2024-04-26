-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `sub` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `role` ENUM('USER', 'ADMIN', 'SUPERUSER') NOT NULL DEFAULT 'USER',
    `notifications` ENUM('NONE', 'EMAIL') NOT NULL DEFAULT 'EMAIL',

    UNIQUE INDEX `User_sub_key`(`sub`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subscriptionData` JSON NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `pricingPlanId` INTEGER NULL,
    `paddleSubscriptionId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InviteToken` (
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `usedByMemberId` INTEGER NULL,
    `organizationId` VARCHAR(191) NULL,

    UNIQUE INDEX `InviteToken_usedByMemberId_key`(`usedByMemberId`),
    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PricingPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `paddleProductId` VARCHAR(191) NULL,
    `paddleDefaultPriceId` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NULL,
    `defaultUsageLimits` JSON NULL,

    UNIQUE INDEX `PricingPlan_paddleProductId_key`(`paddleProductId`),
    UNIQUE INDEX `PricingPlan_isDefault_key`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaddleSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `priceId` VARCHAR(191) NOT NULL,
    `subscriptionInfos` JSON NOT NULL,
    `usageLimits` JSON NULL,

    UNIQUE INDEX `PaddleSubscription_subscriptionId_key`(`subscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `Member_userId_organizationId_idx`(`userId`, `organizationId`),
    UNIQUE INDEX `Member_userId_organizationId_key`(`userId`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessToken` (
    `id` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userAgent` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `hash` VARCHAR(191) NULL,
    `type` ENUM('CLI', 'WORKER') NOT NULL DEFAULT 'CLI',
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AccessToken_hash_key`(`hash`),
    INDEX `AccessToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dbInfo` JSON NULL,
    `dbInfoLastUpdate` DATETIME(3) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `autoDeleteDays` INTEGER NULL DEFAULT 7,
    `snapshotConfig` JSON NULL,
    `schedule` JSON NULL,
    `preseedPreviewDatabases` BOOLEAN NOT NULL DEFAULT false,
    `organizationId` VARCHAR(191) NOT NULL,
    `dbConnectionId` VARCHAR(191) NULL,
    `hostedDbUrlId` VARCHAR(191) NULL,
    `hostedDbRegion` VARCHAR(191) NULL,
    `previewDatabaseRegion` VARCHAR(191) NULL,
    `runTaskOptions` JSON NULL,
    `description` VARCHAR(191) NULL,
    `predictionJobId` VARCHAR(191) NULL,
    `supabaseProjectId` VARCHAR(191) NULL,

    UNIQUE INDEX `Project_supabaseProjectId_key`(`supabaseProjectId`),
    INDEX `Project_organizationId_idx`(`organizationId`),
    UNIQUE INDEX `Project_organizationId_dbConnectionId_key`(`organizationId`, `dbConnectionId`),
    UNIQUE INDEX `Project_hostedDbUrlId_key`(`hostedDbUrlId`),
    UNIQUE INDEX `Project_predictionJobId_key`(`predictionJobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DatabaseProvider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `DatabaseProvider_domain_key`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DbConnection` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `ssl` BOOLEAN NOT NULL DEFAULT true,
    `connectionUrlHash` JSON NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `databaseProviderId` INTEGER NULL,

    INDEX `DbConnection_organizationId_idx`(`organizationId`),
    UNIQUE INDEX `DbConnection_id_organizationId_key`(`id`, `organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Snapshot` (
    `id` VARCHAR(191) NOT NULL,
    `uniqueName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `purgedAt` DATETIME(3) NULL,
    `statusOld` ENUM('BOOTING', 'STARTING', 'STARTED', 'SUCCESS', 'FAILURE', 'TIMEOUT', 'DELETED', 'PURGED', 'PENDING', 'IN_PROGRESS') NOT NULL DEFAULT 'BOOTING',
    `restoreCount` INTEGER NOT NULL DEFAULT 0,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `dbInfo` JSON NULL,
    `snapshotConfig` JSON NULL,
    `runtime` JSON NULL,
    `summary` JSON NULL,
    `progress` JSON NULL,
    `storage` JSON NULL,
    `notifyOnSuccess` BOOLEAN NULL DEFAULT false,
    `isScheduled` BOOLEAN NULL DEFAULT false,
    `preseedPreviewDatabase` BOOLEAN NOT NULL DEFAULT false,
    `projectId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `execTaskId` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `dbConnectionId` VARCHAR(191) NULL,
    `workerIpAddress` VARCHAR(191) NULL,
    `dbSchemaDump` TEXT NULL,

    UNIQUE INDEX `Snapshot_id_organizationId_key`(`id`, `organizationId`),
    UNIQUE INDEX `Snapshot_dbConnectionId_uniqueName_key`(`dbConnectionId`, `uniqueName`),
    UNIQUE INDEX `Snapshot_uniqueName_key`(`uniqueName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AwsConsumptionHistory` (
    `name` VARCHAR(191) NOT NULL,
    `startPeriod` DATETIME(3) NOT NULL,
    `endPeriod` DATETIME(3) NOT NULL,
    `awsStorageBytes` BIGINT NULL,
    `awsComputeTimeSeconds` BIGINT NULL,
    `awsDataTransferBytes` BIGINT NULL,
    `snapshotId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    INDEX `AwsConsumptionHistory_startPeriod_endPeriod_idx`(`startPeriod`, `endPeriod`),
    INDEX `AwsConsumptionHistory_organizationId_projectId_snapshotId_idx`(`organizationId`, `projectId`, `snapshotId`),
    UNIQUE INDEX `AwsConsumptionHistory_name_snapshotId_projectId_organization_key`(`name`, `snapshotId`, `projectId`, `organizationId`, `startPeriod`, `endPeriod`),
    PRIMARY KEY (`name`, `organizationId`, `startPeriod`, `endPeriod`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NeonConsumptionHistory` (
    `name` VARCHAR(191) NOT NULL,
    `startPeriod` DATETIME(3) NOT NULL,
    `endPeriod` DATETIME(3) NOT NULL,
    `neonDataStorageBytesHour` BIGINT NULL,
    `neonSyntheticStorageSize` BIGINT NULL,
    `neonDataTransferBytes` BIGINT NULL,
    `neonWrittenDataBytes` BIGINT NULL,
    `neonComputeTimeSeconds` BIGINT NULL,
    `neonActiveTimeSeconds` BIGINT NULL,
    `snapshotId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    INDEX `NeonConsumptionHistory_startPeriod_endPeriod_idx`(`startPeriod`, `endPeriod`),
    INDEX `NeonConsumptionHistory_organizationId_projectId_snapshotId_idx`(`organizationId`, `projectId`, `snapshotId`),
    UNIQUE INDEX `NeonConsumptionHistory_name_snapshotId_projectId_organizatio_key`(`name`, `snapshotId`, `projectId`, `organizationId`, `startPeriod`, `endPeriod`),
    PRIMARY KEY (`name`, `organizationId`, `startPeriod`, `endPeriod`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NeonProject` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `neonProjectId` VARCHAR(191) NOT NULL,
    `connectionUrlHash` JSON NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `snapshotId` VARCHAR(191) NULL,
    `status` ENUM('IN_PROGRESS', 'FAILURE', 'SUCCESS') NOT NULL DEFAULT 'IN_PROGRESS',

    UNIQUE INDEX `NeonProject_neonProjectId_key`(`neonProjectId`),
    UNIQUE INDEX `NeonProject_snapshotId_key`(`snapshotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupabaseProject` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectId` VARCHAR(191) NOT NULL,
    `supabaseAuthCodeHash` JSON NOT NULL,
    `supabaseRefreshToken` VARCHAR(191) NULL,
    `supabaseAccessTokenHash` JSON NULL,
    `supabaseAccessTokenExpiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `SupabaseProject_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PreviewDatabase` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `neonBranchId` VARCHAR(191) NULL,
    `connectionUrlHash` JSON NULL,
    `neonProjectId` VARCHAR(191) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'FAILURE', 'SUCCESS') NOT NULL DEFAULT 'IN_PROGRESS',

    INDEX `PreviewDatabase_neonProjectId_idx`(`neonProjectId`),
    UNIQUE INDEX `PreviewDatabase_neonProjectId_neonBranchId_key`(`neonProjectId`, `neonBranchId`),
    UNIQUE INDEX `PreviewDatabase_neonProjectId_name_key`(`neonProjectId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Table` (
    `id` VARCHAR(191) NOT NULL,
    `tableName` VARCHAR(191) NOT NULL,
    `schema` VARCHAR(191) NOT NULL,
    `status` ENUM('BOOTING', 'STARTING', 'STARTED', 'SUCCESS', 'FAILURE', 'TIMEOUT', 'DELETED', 'PURGED', 'PENDING', 'IN_PROGRESS') NOT NULL DEFAULT 'PENDING',
    `bucketKey` VARCHAR(191) NULL,
    `rows` VARCHAR(191) NULL,
    `totalRows` VARCHAR(191) NULL,
    `bytes` VARCHAR(191) NULL,
    `timeToDump` INTEGER NULL,
    `timeToCompress` INTEGER NULL,
    `timeToEncrypt` INTEGER NULL,
    `timeToSave` INTEGER NULL,
    `checksum` VARCHAR(191) NULL,
    `snapshotId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    INDEX `Table_snapshotId_idx`(`snapshotId`),
    UNIQUE INDEX `Table_id_organizationId_key`(`id`, `organizationId`),
    UNIQUE INDEX `Table_schema_tableName_snapshotId_key`(`schema`, `tableName`, `snapshotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseVersion` (
    `version` VARCHAR(191) NOT NULL,
    `channel` ENUM('PRIVATE', 'PUBLIC', 'BETA') NOT NULL DEFAULT 'PUBLIC',
    `forceUpgrade` BOOLEAN NOT NULL DEFAULT false,
    `releaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `ReleaseVersion_userId_key`(`userId`),
    UNIQUE INDEX `ReleaseVersion_version_userId_key`(`version`, `userId`),
    PRIMARY KEY (`version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` ENUM('SNAPSHOT_CREATED', 'SNAPSHOT_RESTORED_SUCCESS', 'SNAPSHOT_RESTORED_FAILURE', 'SNAPSHOT_DELETED', 'SNAPSHOT_CONFIG_UPDATED', 'PROJECT_DELETED', 'ORGANIZATION_DELETED', 'PREVIEW_DATABASE_DEPLOYED', 'PREVIEW_DATABASE_CREATED', 'PREVIEW_DATABASE_RESET', 'PREVIEW_DATABASE_DROPPED', 'PREVIEW_DATABASE_DESTROYED', 'EMAIL_SENT_ORGANIZATION_CHURN', 'EMAIL_SENT_INCOMPLETE_ONBOARDING', 'PII_UPDATED_PREDICTIONS_OVERRIDE') NOT NULL,
    `data` JSON NULL,
    `userId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,

    INDEX `AuditLog_organizationId_idx`(`organizationId`),
    INDEX `AuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExecTask` (
    `id` VARCHAR(191) NOT NULL,
    `arn` VARCHAR(191) NULL,
    `command` VARCHAR(191) NOT NULL,
    `env` JSON NULL,
    `exitCode` INTEGER NULL,
    `progress` JSON NULL,
    `needsSourceDatabaseUrl` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `lastNotifiedAt` DATETIME(3) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `accessTokenId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PredictionJob` (
    `id` VARCHAR(191) NOT NULL,
    `engine` ENUM('FINETUNED_BERT', 'FINETUNED_DISTI_BERT', 'GPT4_1106_PREVIEW_CUSTOM_PROMPT_V1', 'GPT3_TURBO_1106_CUSTOM_PROMPT_V1', 'FINETUNED_DISTI_BERT_SEED_ONLY') NOT NULL DEFAULT 'FINETUNED_BERT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,
    `rawInput` JSON NOT NULL,
    `engineInput` JSON NOT NULL,
    `progress` JSON NOT NULL,
    `engineOptions` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShapePredictionStore` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `predictedLabel` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NULL,
    `overrideLabel` VARCHAR(191) NULL,
    `predictedContext` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `confidenceContext` DOUBLE NULL,
    `overrideContext` VARCHAR(191) NULL,
    `engine` ENUM('FINETUNED_BERT', 'FINETUNED_DISTI_BERT', 'GPT4_1106_PREVIEW_CUSTOM_PROMPT_V1', 'GPT3_TURBO_1106_CUSTOM_PROMPT_V1', 'FINETUNED_DISTI_BERT_SEED_ONLY') NOT NULL DEFAULT 'FINETUNED_BERT',
    `predictionReviewStatus` ENUM('UNREVIEWED', 'PENDING_HUMAN_REVIEW', 'HUMAN_REVIEWED', 'LLM_REVIEWED') NOT NULL DEFAULT 'UNREVIEWED',

    INDEX `ShapePredictionStore_input_predictedLabel_idx`(`input`, `predictedLabel`),
    UNIQUE INDEX `ShapePredictionStore_input_engine_key`(`input`, `engine`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PredictionDataSet` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `context` VARCHAR(191) NOT NULL,
    `shape` VARCHAR(191) NOT NULL,
    `shapeSkipTraining` BOOLEAN NOT NULL DEFAULT false,
    `contextSkipTraining` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `PredictionDataSet_input_key`(`input`),
    INDEX `PredictionDataSet_input_context_idx`(`input`, `context`),
    INDEX `PredictionDataSet_input_shape_idx`(`input`, `shape`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeedTrainingDataSet` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `shape` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `SeedTrainingDataSet_input_key`(`input`),
    INDEX `SeedTrainingDataSet_input_shape_idx`(`input`, `shape`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeedShape` (
    `shape` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `SeedShape_shape_key`(`shape`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShapePredictionOverride` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `shape` VARCHAR(191) NOT NULL,
    `context` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ShapePredictionOverride_input_key`(`input`),
    UNIQUE INDEX `ShapePredictionOverride_projectId_input_key`(`projectId`, `input`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeedDataSet` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `shape` VARCHAR(191) NULL,
    `predictionId` VARCHAR(191) NULL,

    UNIQUE INDEX `SeedDataSet_input_projectId_key`(`input`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataGenerationJob` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `dataDescription` VARCHAR(191) NULL,
    `requestedSampleSize` INTEGER NOT NULL,
    `modelProvider` ENUM('OPENAI', 'GOOGLE') NOT NULL DEFAULT 'OPENAI',
    `modelName` VARCHAR(191) NOT NULL DEFAULT 'gpt-3.5-turbo-0125',
    `temperature` DOUBLE NOT NULL DEFAULT 0.9,
    `seed` INTEGER NOT NULL DEFAULT 42,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILURE') NOT NULL DEFAULT 'PENDING',
    `progressCurrent` INTEGER NOT NULL DEFAULT 0,
    `progressTotal` INTEGER NOT NULL DEFAULT 0,
    `seedDataSetId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_pricingPlanId_fkey` FOREIGN KEY (`pricingPlanId`) REFERENCES `PricingPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_paddleSubscriptionId_fkey` FOREIGN KEY (`paddleSubscriptionId`) REFERENCES `PaddleSubscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteToken` ADD CONSTRAINT `InviteToken_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteToken` ADD CONSTRAINT `InviteToken_usedByMemberId_fkey` FOREIGN KEY (`usedByMemberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteToken` ADD CONSTRAINT `InviteToken_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_dbConnectionId_fkey` FOREIGN KEY (`dbConnectionId`) REFERENCES `DbConnection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_hostedDbUrlId_fkey` FOREIGN KEY (`hostedDbUrlId`) REFERENCES `DbConnection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_predictionJobId_fkey` FOREIGN KEY (`predictionJobId`) REFERENCES `PredictionJob`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_supabaseProjectId_fkey` FOREIGN KEY (`supabaseProjectId`) REFERENCES `SupabaseProject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DbConnection` ADD CONSTRAINT `DbConnection_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DbConnection` ADD CONSTRAINT `DbConnection_databaseProviderId_fkey` FOREIGN KEY (`databaseProviderId`) REFERENCES `DatabaseProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snapshot` ADD CONSTRAINT `Snapshot_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snapshot` ADD CONSTRAINT `Snapshot_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snapshot` ADD CONSTRAINT `Snapshot_execTaskId_fkey` FOREIGN KEY (`execTaskId`) REFERENCES `ExecTask`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snapshot` ADD CONSTRAINT `Snapshot_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snapshot` ADD CONSTRAINT `Snapshot_dbConnectionId_fkey` FOREIGN KEY (`dbConnectionId`) REFERENCES `DbConnection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwsConsumptionHistory` ADD CONSTRAINT `AwsConsumptionHistory_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `Snapshot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwsConsumptionHistory` ADD CONSTRAINT `AwsConsumptionHistory_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwsConsumptionHistory` ADD CONSTRAINT `AwsConsumptionHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeonConsumptionHistory` ADD CONSTRAINT `NeonConsumptionHistory_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `Snapshot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeonConsumptionHistory` ADD CONSTRAINT `NeonConsumptionHistory_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeonConsumptionHistory` ADD CONSTRAINT `NeonConsumptionHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeonProject` ADD CONSTRAINT `NeonProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeonProject` ADD CONSTRAINT `NeonProject_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `Snapshot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreviewDatabase` ADD CONSTRAINT `PreviewDatabase_neonProjectId_fkey` FOREIGN KEY (`neonProjectId`) REFERENCES `NeonProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Table` ADD CONSTRAINT `Table_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `Snapshot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Table` ADD CONSTRAINT `Table_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseVersion` ADD CONSTRAINT `ReleaseVersion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExecTask` ADD CONSTRAINT `ExecTask_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExecTask` ADD CONSTRAINT `ExecTask_accessTokenId_fkey` FOREIGN KEY (`accessTokenId`) REFERENCES `AccessToken`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeedTrainingDataSet` ADD CONSTRAINT `SeedTrainingDataSet_shape_fkey` FOREIGN KEY (`shape`) REFERENCES `SeedShape`(`shape`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShapePredictionOverride` ADD CONSTRAINT `ShapePredictionOverride_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeedDataSet` ADD CONSTRAINT `SeedDataSet_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeedDataSet` ADD CONSTRAINT `SeedDataSet_shape_fkey` FOREIGN KEY (`shape`) REFERENCES `SeedShape`(`shape`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeedDataSet` ADD CONSTRAINT `SeedDataSet_predictionId_fkey` FOREIGN KEY (`predictionId`) REFERENCES `ShapePredictionStore`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataGenerationJob` ADD CONSTRAINT `DataGenerationJob_seedDataSetId_fkey` FOREIGN KEY (`seedDataSetId`) REFERENCES `SeedDataSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
