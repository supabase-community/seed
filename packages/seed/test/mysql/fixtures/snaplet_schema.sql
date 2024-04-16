SET foreign_key_checks = 0;
CREATE TABLE AccessToken (
    id VARCHAR(255) NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    userId VARCHAR(255) NOT NULL,
    userAgent VARCHAR(255),
    type ENUM('CLI', 'WORKER') NOT NULL DEFAULT 'CLI',
    name VARCHAR(255),
    hash VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE AuditLog (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action ENUM('SNAPSHOT_CREATED', 'SNAPSHOT_RESTORED_SUCCESS', 'SNAPSHOT_RESTORED_FAILURE', 'SNAPSHOT_DELETED', 'SNAPSHOT_CONFIG_UPDATED', 'PROJECT_DELETED', 'ORGANIZATION_DELETED', 'PREVIEW_DATABASE_DEPLOYED', 'PREVIEW_DATABASE_CREATED', 'PREVIEW_DATABASE_DROPPED', 'PREVIEW_DATABASE_DESTROYED', 'EMAIL_SENT_ORGANIZATION_CHURN', 'EMAIL_SENT_INCOMPLETE_ONBOARDING', 'PREVIEW_DATABASE_RESET', 'PII_UPDATED_PREDICTIONS_OVERRIDE') NOT NULL,
    data JSON,
    userId VARCHAR(255),
    organizationId VARCHAR(255) NOT NULL,
    projectId VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE AwsConsumptionHistory (
    name VARCHAR(255) NOT NULL,
    startPeriod TIMESTAMP NOT NULL,
    endPeriod TIMESTAMP NOT NULL,
    awsStorageBytes BIGINT,
    awsComputeTimeSeconds BIGINT,
    awsDataTransferBytes BIGINT,
    snapshotId VARCHAR(255),
    projectId VARCHAR(255),
    organizationId VARCHAR(255) NOT NULL,
    PRIMARY KEY (name, organizationId, startPeriod, endPeriod),
    FOREIGN KEY (snapshotId) REFERENCES Snapshot(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE DatabaseProvider (
    id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE DbConnection (
    id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    ssl BOOLEAN NOT NULL DEFAULT TRUE,
    connectionUrlHash JSON NOT NULL,
    organizationId VARCHAR(255) NOT NULL,
    databaseProviderId INT,
    PRIMARY KEY (id),
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (databaseProviderId) REFERENCES DatabaseProvider(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ExecTask (
    id VARCHAR(255) NOT NULL,
    command TEXT NOT NULL,
    env JSON,
    exitCode INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    projectId VARCHAR(255) NOT NULL,
    needsSourceDatabaseUrl BOOLEAN NOT NULL DEFAULT FALSE,
    progress JSON,
    endedAt TIMESTAMP,
    arn VARCHAR(255),
    accessTokenId VARCHAR(255),
    lastNotifiedAt TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (accessTokenId) REFERENCES AccessToken(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE InviteToken (
    token VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    createdByUserId VARCHAR(255) NOT NULL,
    usedByMemberId INT,
    organizationId VARCHAR(255),
    expiresAt TIMESTAMP NOT NULL,
    PRIMARY KEY (token),
    FOREIGN KEY (createdByUserId) REFERENCES User(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (usedByMemberId) REFERENCES Member(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Member (
    role ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    organizationId VARCHAR(255) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    id INT AUTO_INCREMENT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (userId) REFERENCES User(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE NeonConsumptionHistory (
    name VARCHAR(255) NOT NULL,
    startPeriod TIMESTAMP NOT NULL,
    endPeriod TIMESTAMP NOT NULL,
    neonDataStorageBytesHour BIGINT,
    neonSyntheticStorageSize BIGINT,
    neonDataTransferBytes BIGINT,
    neonWrittenDataBytes BIGINT,
    neonComputeTimeSeconds BIGINT,
    neonActiveTimeSeconds BIGINT,
    snapshotId VARCHAR(255),
    projectId VARCHAR(255),
    organizationId VARCHAR(255) NOT NULL,
    PRIMARY KEY (name, organizationId, startPeriod, endPeriod),
    FOREIGN KEY (snapshotId) REFERENCES Snapshot(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE NeonProject (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    neonProjectId VARCHAR(255) NOT NULL,
    snapshotId VARCHAR(255),
    connectionUrlHash JSON NOT NULL,
    projectId VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (neonProjectId) REFERENCES NeonProject(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (snapshotId) REFERENCES Snapshot(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Organization (
    id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    pricingPlanId INT,
    subscriptionData JSON,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    FOREIGN KEY (pricingPlanId) REFERENCES PricingPlan(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE PredictionDataSet (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    input TEXT NOT NULL,
    context TEXT NOT NULL,
    shape TEXT NOT NULL,
    contextSkipTraining BOOLEAN NOT NULL DEFAULT FALSE,
    shapeSkipTraining BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
);

CREATE TABLE PredictionJob (
    id VARCHAR(255) NOT NULL,
    engine ENUM('FINETUNED_BERT') NOT NULL DEFAULT 'FINETUNED_BERT',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    endedAt TIMESTAMP,
    rawInput JSON NOT NULL,
    engineInput JSON NOT NULL,
    progress JSON NOT NULL,
    engineOptions JSON,
    PRIMARY KEY (id)
);

CREATE TABLE PreviewDatabase (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    name VARCHAR(255) NOT NULL,
    neonBranchId VARCHAR(255) NOT NULL,
    neonProjectId VARCHAR(255) NOT NULL,
    connectionUrlHash JSON NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (neonBranchId) REFERENCES NeonProject(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (neonProjectId) REFERENCES NeonProject(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE PricingPlan (
    id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount TEXT NOT NULL,
    isDefault BOOLEAN NOT NULL,
    storageLimit INT NOT NULL,
    processLimit INT NOT NULL,
    restoreLimit INT NOT NULL,
    productId VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Project (
    name VARCHAR(255) NOT NULL,
    organizationId VARCHAR(255) NOT NULL,
    dbConnectionId VARCHAR(255),
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    dbInfo JSON,
    dbInfoLastUpdate TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    autoDeleteDays INT DEFAULT 7,
    snapshotConfig JSON,
    schedule JSON,
    runTaskOptions JSON,
    hostedDbUrlId VARCHAR(255),
    hostedDbRegion VARCHAR(255),
    scheduleTags TEXT,
    previewDatabaseRegion VARCHAR(255),
    predictionJobId VARCHAR(255),
    supabaseProjectId VARCHAR(255),
    preseedPreviewDatabases BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (dbConnectionId) REFERENCES DbConnection(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (hostedDbUrlId) REFERENCES DbConnection(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (predictionJobId) REFERENCES PredictionJob(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (supabaseProjectId) REFERENCES SupabaseProject(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ReleaseVersion (
    version VARCHAR(255) NOT NULL,
    channel ENUM('PRIVATE', 'PUBLIC', 'BETA') NOT NULL DEFAULT 'PUBLIC',
    forceUpgrade BOOLEAN NOT NULL DEFAULT FALSE,
    releaseDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    userId VARCHAR(255),
    PRIMARY KEY (version),
    FOREIGN KEY (userId) REFERENCES User(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ShapePredictionOverride (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    input TEXT NOT NULL,
    shape TEXT NOT NULL,
    context TEXT NOT NULL,
    projectId VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE ShapePredictionStore (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    input TEXT NOT NULL,
    predictedLabel TEXT NOT NULL,
    confidence DOUBLE,
    overrideLabel TEXT,
    confidenceContext DOUBLE,
    overrideContext TEXT,
    predictedContext TEXT NOT NULL DEFAULT 'GENERAL',
    engine ENUM('FINETUNED_BERT') NOT NULL DEFAULT 'FINETUNED_BERT',
    PRIMARY KEY (id)
);

CREATE TABLE Snapshot (
    id VARCHAR(255) NOT NULL,
    uniqueName VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    statusOld ENUM('PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'BOOTING', 'DELETED', 'STARTING', 'PURGED', 'TIMEOUT', 'IN_PROGRESS') NOT NULL DEFAULT 'BOOTING',
    organizationId VARCHAR(255) NOT NULL,
    dbConnectionId VARCHAR(255),
    workerIpAddress VARCHAR(255),
    errors TEXT,
    failureCount INT NOT NULL DEFAULT 0,
    projectId VARCHAR(255) NOT NULL,
    dbSchemaDump TEXT,
    logs TEXT,
    restoreCount INT NOT NULL DEFAULT 0,
    dbInfo JSON,
    snapshotConfig JSON,
    runtime JSON,
    summary JSON,
    createdByUserId VARCHAR(255),
    execTaskId VARCHAR(255),
    progress JSON,
    notifyOnSuccess BOOLEAN NOT NULL DEFAULT FALSE,
    deletedAt TIMESTAMP,
    purgedAt TIMESTAMP,
    storage JSON,
    isScheduled BOOLEAN NOT NULL DEFAULT FALSE,
    preseedPreviewDatabase BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (dbConnectionId) REFERENCES DbConnection(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (execTaskId) REFERENCES ExecTask(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (createdByUserId) REFERENCES User(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE SupabaseProject (
    id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    projectId VARCHAR(255) NOT NULL,
    supabaseAuthCodeHash JSON NOT NULL,
    supabaseRefreshToken VARCHAR(255),
    supabaseAccessTokenHash JSON,
    supabaseAccessTokenExpiresAt TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (projectId) REFERENCES Project(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Table (
    id VARCHAR(255) NOT NULL,
    tableName VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'BOOTING', 'DELETED', 'STARTING', 'PURGED', 'TIMEOUT', 'IN_PROGRESS') NOT NULL DEFAULT 'PENDING',
    bucketKey VARCHAR(255),
    bytes TEXT,
    timeToDump INT,
    timeToSave INT,
    snapshotId VARCHAR(255) NOT NULL,
    organizationId VARCHAR(255) NOT NULL,
    checksum TEXT,
    timeToCompress INT,
    timeToEncrypt INT,
    rows TEXT,
    schema TEXT NOT NULL,
    totalRows TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (snapshotId) REFERENCES Snapshot(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (organizationId) REFERENCES Organization(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE User (
    id VARCHAR(255) NOT NULL,
    sub VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    role ENUM('USER', 'SUPERUSER', 'ADMIN') NOT NULL DEFAULT 'USER',
    notifications ENUM('NONE', 'EMAIL') NOT NULL DEFAULT 'EMAIL',
    PRIMARY KEY (id)
);

CREATE TABLE _prisma_migrations (
    id VARCHAR(36) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_steps_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
SET foreign_key_checks = 1;