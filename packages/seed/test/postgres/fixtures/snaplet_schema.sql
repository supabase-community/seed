--
-- PostgreSQL database dump
--

-- Dumped from database version 11.19
-- Dumped by pg_dump version 15.4 (Ubuntu 15.4-2.pgdg22.04+1)

-- Started on 2023-10-31 07:59:26 Africa

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 9 (class 2615 OID 22709)
-- Name: pgboss; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgboss;


--
-- TOC entry 7 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- TOC entry 2 (class 3079 OID 22670)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4220 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 721 (class 1247 OID 22716)
-- Name: job_state; Type: TYPE; Schema: pgboss; Owner: -
--

CREATE TYPE pgboss.job_state AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'expired',
    'cancelled',
    'failed'
);


--
-- TOC entry 671 (class 1247 OID 39068)
-- Name: AccessTokenType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessTokenType" AS ENUM (
    'CLI',
    'WORKER'
);


--
-- TOC entry 760 (class 1247 OID 65028)
-- Name: AuditLogActions; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditLogActions" AS ENUM (
    'SNAPSHOT_CREATED',
    'SNAPSHOT_RESTORED_SUCCESS',
    'SNAPSHOT_RESTORED_FAILURE',
    'SNAPSHOT_DELETED',
    'SNAPSHOT_CONFIG_UPDATED',
    'PROJECT_DELETED',
    'ORGANIZATION_DELETED',
    'PREVIEW_DATABASE_DEPLOYED',
    'PREVIEW_DATABASE_CREATED',
    'PREVIEW_DATABASE_DROPPED',
    'PREVIEW_DATABASE_DESTROYED',
    'EMAIL_SENT_ORGANIZATION_CHURN',
    'EMAIL_SENT_INCOMPLETE_ONBOARDING',
    'PREVIEW_DATABASE_RESET',
    'PII_UPDATED_PREDICTIONS_OVERRIDE'
);


--
-- TOC entry 681 (class 1247 OID 62471)
-- Name: DatabaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DatabaseStatus" AS ENUM (
    'ENABLED',
    'DISABLED',
    'DELETED'
);


--
-- TOC entry 690 (class 1247 OID 18145)
-- Name: MemberRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MemberRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER'
);


--
-- TOC entry 751 (class 1247 OID 858804)
-- Name: PredictionsEngine; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PredictionsEngine" AS ENUM (
    'FINETUNED_BERT'
);


--
-- TOC entry 798 (class 1247 OID 114449)
-- Name: ReleaseChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReleaseChannel" AS ENUM (
    'PRIVATE',
    'PUBLIC',
    'BETA'
);


--
-- TOC entry 700 (class 1247 OID 17681)
-- Name: SnapshotStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SnapshotStatus" AS ENUM (
    'PENDING',
    'STARTED',
    'SUCCESS',
    'FAILURE',
    'BOOTING',
    'DELETED',
    'STARTING',
    'PURGED',
    'TIMEOUT',
    'IN_PROGRESS'
);


--
-- TOC entry 661 (class 1247 OID 430994)
-- Name: UserNotifications; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserNotifications" AS ENUM (
    'NONE',
    'EMAIL'
);


--
-- TOC entry 757 (class 1247 OID 58971)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'SUPERUSER',
    'ADMIN'
);


SET default_tablespace = '';

--
-- TOC entry 207 (class 1259 OID 22731)
-- Name: job; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.job (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retrylimit integer DEFAULT 0 NOT NULL,
    retrycount integer DEFAULT 0 NOT NULL,
    retrydelay integer DEFAULT 0 NOT NULL,
    retrybackoff boolean DEFAULT false NOT NULL,
    startafter timestamp with time zone DEFAULT now() NOT NULL,
    startedon timestamp with time zone,
    singletonkey text,
    singletonon timestamp without time zone,
    expirein interval DEFAULT '00:15:00'::interval NOT NULL,
    createdon timestamp with time zone DEFAULT now() NOT NULL,
    completedon timestamp with time zone,
    keepuntil timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    on_complete boolean DEFAULT false NOT NULL,
    output jsonb
);


--
-- TOC entry 209 (class 1259 OID 22757)
-- Name: schedule; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.schedule (
    name text NOT NULL,
    cron text NOT NULL,
    timezone text,
    data jsonb,
    options jsonb,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 206 (class 1259 OID 22710)
-- Name: version; Type: TABLE; Schema: pgboss; Owner: -
--

CREATE TABLE pgboss.version (
    version integer NOT NULL,
    maintained_on timestamp with time zone,
    cron_on timestamp with time zone
);


--
-- TOC entry 201 (class 1259 OID 18174)
-- Name: AccessToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AccessToken" (
    id text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "userAgent" text,
    type public."AccessTokenType" DEFAULT 'CLI'::public."AccessTokenType" NOT NULL,
    name text,
    hash text
);


--
-- TOC entry 218 (class 1259 OID 65039)
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action public."AuditLogActions" NOT NULL,
    data jsonb,
    "userId" text,
    "organizationId" text NOT NULL,
    "projectId" text
);


--
-- TOC entry 226 (class 1259 OID 903706)
-- Name: AwsConsumptionHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AwsConsumptionHistory" (
    name text NOT NULL,
    "startPeriod" timestamp(3) without time zone NOT NULL,
    "endPeriod" timestamp(3) without time zone NOT NULL,
    "awsStorageBytes" bigint,
    "awsComputeTimeSeconds" bigint,
    "awsDataTransferBytes" bigint,
    "snapshotId" text,
    "projectId" text,
    "organizationId" text NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 60714)
-- Name: DatabaseProvider; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DatabaseProvider" (
    id integer NOT NULL,
    name text NOT NULL,
    domain text NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 60712)
-- Name: DatabaseProvider_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DatabaseProvider_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4221 (class 0 OID 0)
-- Dependencies: 216
-- Name: DatabaseProvider_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DatabaseProvider_id_seq" OWNED BY public."DatabaseProvider".id;


--
-- TOC entry 202 (class 1259 OID 18183)
-- Name: DbConnection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DbConnection" (
    id text NOT NULL,
    name text,
    ssl boolean DEFAULT true NOT NULL,
    "connectionUrlHash" jsonb NOT NULL,
    "organizationId" text NOT NULL,
    "databaseProviderId" integer
);


--
-- TOC entry 219 (class 1259 OID 305753)
-- Name: ExecTask; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExecTask" (
    id text NOT NULL,
    command text NOT NULL,
    env jsonb,
    "exitCode" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "projectId" text NOT NULL,
    "needsSourceDatabaseUrl" boolean DEFAULT false NOT NULL,
    progress jsonb,
    "endedAt" timestamp(3) without time zone,
    arn text,
    "accessTokenId" text,
    "lastNotifiedAt" timestamp(3) without time zone
);


--
-- TOC entry 214 (class 1259 OID 43445)
-- Name: InviteToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InviteToken" (
    token text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdByUserId" text NOT NULL,
    "usedByMemberId" integer,
    "organizationId" text,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 200 (class 1259 OID 18167)
-- Name: Member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Member" (
    role public."MemberRole" DEFAULT 'MEMBER'::public."MemberRole" NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    id integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 213 (class 1259 OID 43431)
-- Name: Member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Member_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4222 (class 0 OID 0)
-- Dependencies: 213
-- Name: Member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Member_id_seq" OWNED BY public."Member".id;


--
-- TOC entry 227 (class 1259 OID 903714)
-- Name: NeonConsumptionHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NeonConsumptionHistory" (
    name text NOT NULL,
    "startPeriod" timestamp(3) without time zone NOT NULL,
    "endPeriod" timestamp(3) without time zone NOT NULL,
    "neonDataStorageBytesHour" bigint,
    "neonSyntheticStorageSize" bigint,
    "neonDataTransferBytes" bigint,
    "neonWrittenDataBytes" bigint,
    "neonComputeTimeSeconds" bigint,
    "neonActiveTimeSeconds" bigint,
    "snapshotId" text,
    "projectId" text,
    "organizationId" text NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 656438)
-- Name: NeonProject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NeonProject" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "neonProjectId" text NOT NULL,
    "snapshotId" text,
    "connectionUrlHash" jsonb NOT NULL,
    "projectId" text NOT NULL
);


--
-- TOC entry 199 (class 1259 OID 18159)
-- Name: Organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    "pricingPlanId" integer,
    "subscriptionData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 809378)
-- Name: PredictionDataSet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PredictionDataSet" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    input text NOT NULL,
    context text NOT NULL,
    shape text NOT NULL,
    "contextSkipTraining" boolean DEFAULT false NOT NULL,
    "shapeSkipTraining" boolean DEFAULT false NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 858809)
-- Name: PredictionJob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PredictionJob" (
    id text NOT NULL,
    engine public."PredictionsEngine" DEFAULT 'FINETUNED_BERT'::public."PredictionsEngine" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endedAt" timestamp(3) without time zone,
    "rawInput" jsonb NOT NULL,
    "engineInput" jsonb NOT NULL,
    progress jsonb NOT NULL,
    "engineOptions" jsonb
);


--
-- TOC entry 221 (class 1259 OID 656447)
-- Name: PreviewDatabase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PreviewDatabase" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text NOT NULL,
    "neonBranchId" text NOT NULL,
    "neonProjectId" text NOT NULL,
    "connectionUrlHash" jsonb NOT NULL
);


--
-- TOC entry 211 (class 1259 OID 22779)
-- Name: PricingPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PricingPlan" (
    id integer NOT NULL,
    name text NOT NULL,
    amount text NOT NULL,
    "isDefault" boolean NOT NULL,
    "storageLimit" integer NOT NULL,
    "processLimit" integer NOT NULL,
    "restoreLimit" integer NOT NULL,
    "productId" text NOT NULL
);


--
-- TOC entry 210 (class 1259 OID 22777)
-- Name: PricingPlan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PricingPlan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4223 (class 0 OID 0)
-- Dependencies: 210
-- Name: PricingPlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PricingPlan_id_seq" OWNED BY public."PricingPlan".id;


--
-- TOC entry 212 (class 1259 OID 29552)
-- Name: Project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Project" (
    name text NOT NULL,
    "organizationId" text NOT NULL,
    "dbConnectionId" text,
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dbInfo" jsonb,
    "dbInfoLastUpdate" timestamp(3) without time zone,
    deleted boolean DEFAULT false NOT NULL,
    "autoDeleteDays" integer DEFAULT 7,
    "snapshotConfig" jsonb,
    schedule jsonb,
    "runTaskOptions" jsonb,
    "hostedDbUrlId" text,
    "hostedDbRegion" text,
    "scheduleTags" text[] DEFAULT ARRAY['main'::text],
    "previewDatabaseRegion" text,
    "predictionJobId" text,
    "supabaseProjectId" text,
    "preseedPreviewDatabases" boolean DEFAULT false NOT NULL
);


--
-- TOC entry 215 (class 1259 OID 54227)
-- Name: ReleaseVersion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReleaseVersion" (
    version text NOT NULL,
    channel public."ReleaseChannel" DEFAULT 'PUBLIC'::public."ReleaseChannel" NOT NULL,
    "forceUpgrade" boolean DEFAULT false NOT NULL,
    "releaseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


--
-- TOC entry 228 (class 1259 OID 928514)
-- Name: ShapePredictionOverride; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShapePredictionOverride" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    input text NOT NULL,
    shape text NOT NULL,
    context text NOT NULL,
    "projectId" text NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 759625)
-- Name: ShapePredictionStore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShapePredictionStore" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    input text NOT NULL,
    "predictedLabel" text NOT NULL,
    confidence double precision,
    "overrideLabel" text,
    "confidenceContext" double precision,
    "overrideContext" text,
    "predictedContext" text DEFAULT 'GENERAL'::text NOT NULL,
    engine public."PredictionsEngine" DEFAULT 'FINETUNED_BERT'::public."PredictionsEngine" NOT NULL
);


--
-- TOC entry 203 (class 1259 OID 18200)
-- Name: Snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Snapshot" (
    id text NOT NULL,
    "uniqueName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "statusOld" public."SnapshotStatus" DEFAULT 'BOOTING'::public."SnapshotStatus" NOT NULL,
    "organizationId" text NOT NULL,
    "dbConnectionId" text,
    "workerIpAddress" text,
    errors text[],
    "failureCount" integer DEFAULT 0 NOT NULL,
    "projectId" text NOT NULL,
    "dbSchemaDump" text,
    logs text[],
    "restoreCount" integer DEFAULT 0 NOT NULL,
    "dbInfo" jsonb,
    "snapshotConfig" jsonb,
    runtime jsonb,
    summary jsonb,
    "createdByUserId" text,
    "execTaskId" text,
    progress jsonb,
    "notifyOnSuccess" boolean DEFAULT false,
    "deletedAt" timestamp(3) without time zone,
    "purgedAt" timestamp(3) without time zone,
    storage jsonb,
    "isScheduled" boolean DEFAULT false,
    "preseedPreviewDatabase" boolean DEFAULT false NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 872957)
-- Name: SupabaseProject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupabaseProject" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "projectId" text NOT NULL,
    "supabaseAuthCodeHash" jsonb NOT NULL,
    "supabaseRefreshToken" text,
    "supabaseAccessTokenHash" jsonb,
    "supabaseAccessTokenExpiresAt" timestamp(3) without time zone
);


--
-- TOC entry 204 (class 1259 OID 18219)
-- Name: Table; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Table" (
    id text NOT NULL,
    "tableName" text NOT NULL,
    status public."SnapshotStatus" DEFAULT 'PENDING'::public."SnapshotStatus" NOT NULL,
    "bucketKey" text,
    bytes text,
    "timeToDump" integer,
    "timeToSave" integer,
    "snapshotId" text NOT NULL,
    "organizationId" text NOT NULL,
    checksum text,
    "timeToCompress" integer,
    "timeToEncrypt" integer,
    rows text,
    schema text NOT NULL,
    "totalRows" text
);


--
-- TOC entry 198 (class 1259 OID 18151)
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    sub text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    notifications public."UserNotifications" DEFAULT 'EMAIL'::public."UserNotifications" NOT NULL
);


--
-- TOC entry 205 (class 1259 OID 22643)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 3934 (class 2604 OID 60717)
-- Name: DatabaseProvider id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DatabaseProvider" ALTER COLUMN id SET DEFAULT nextval('public."DatabaseProvider_id_seq"'::regclass);


--
-- TOC entry 3895 (class 2604 OID 43433)
-- Name: Member id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member" ALTER COLUMN id SET DEFAULT nextval('public."Member_id_seq"'::regclass);


--
-- TOC entry 3924 (class 2604 OID 22782)
-- Name: PricingPlan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingPlan" ALTER COLUMN id SET DEFAULT nextval('public."PricingPlan_id_seq"'::regclass);


--
-- TOC entry 3987 (class 2606 OID 22750)
-- Name: job job_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (id);


--
-- TOC entry 3993 (class 2606 OID 22766)
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (name);


--
-- TOC entry 3983 (class 2606 OID 22714)
-- Name: version version_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: -
--

ALTER TABLE ONLY pgboss.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version);


--
-- TOC entry 3964 (class 2606 OID 18182)
-- Name: AccessToken AccessToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessToken"
    ADD CONSTRAINT "AccessToken_pkey" PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 65047)
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 4046 (class 2606 OID 903713)
-- Name: AwsConsumptionHistory AwsConsumptionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AwsConsumptionHistory"
    ADD CONSTRAINT "AwsConsumptionHistory_pkey" PRIMARY KEY (name, "organizationId", "startPeriod", "endPeriod");


--
-- TOC entry 4013 (class 2606 OID 60722)
-- Name: DatabaseProvider DatabaseProvider_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DatabaseProvider"
    ADD CONSTRAINT "DatabaseProvider_pkey" PRIMARY KEY (id);


--
-- TOC entry 3969 (class 2606 OID 18191)
-- Name: DbConnection DbConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DbConnection"
    ADD CONSTRAINT "DbConnection_pkey" PRIMARY KEY (id);


--
-- TOC entry 4019 (class 2606 OID 305762)
-- Name: ExecTask ExecTask_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExecTask"
    ADD CONSTRAINT "ExecTask_pkey" PRIMARY KEY (id);


--
-- TOC entry 4005 (class 2606 OID 43453)
-- Name: InviteToken InviteToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InviteToken"
    ADD CONSTRAINT "InviteToken_pkey" PRIMARY KEY (token);


--
-- TOC entry 3959 (class 2606 OID 43435)
-- Name: Member Member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);


--
-- TOC entry 4051 (class 2606 OID 903721)
-- Name: NeonConsumptionHistory NeonConsumptionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonConsumptionHistory"
    ADD CONSTRAINT "NeonConsumptionHistory_pkey" PRIMARY KEY (name, "organizationId", "startPeriod", "endPeriod");


--
-- TOC entry 4022 (class 2606 OID 656446)
-- Name: NeonProject NeonProject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonProject"
    ADD CONSTRAINT "NeonProject_pkey" PRIMARY KEY (id);


--
-- TOC entry 3957 (class 2606 OID 18166)
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- TOC entry 4037 (class 2606 OID 809386)
-- Name: PredictionDataSet PredictionDataSet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PredictionDataSet"
    ADD CONSTRAINT "PredictionDataSet_pkey" PRIMARY KEY (id);


--
-- TOC entry 4039 (class 2606 OID 858818)
-- Name: PredictionJob PredictionJob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PredictionJob"
    ADD CONSTRAINT "PredictionJob_pkey" PRIMARY KEY (id);


--
-- TOC entry 4028 (class 2606 OID 656455)
-- Name: PreviewDatabase PreviewDatabase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PreviewDatabase"
    ADD CONSTRAINT "PreviewDatabase_pkey" PRIMARY KEY (id);


--
-- TOC entry 3995 (class 2606 OID 22787)
-- Name: PricingPlan PricingPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingPlan"
    ADD CONSTRAINT "PricingPlan_pkey" PRIMARY KEY (id);


--
-- TOC entry 4001 (class 2606 OID 37283)
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- TOC entry 4008 (class 2606 OID 54237)
-- Name: ReleaseVersion ReleaseVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReleaseVersion"
    ADD CONSTRAINT "ReleaseVersion_pkey" PRIMARY KEY (version);


--
-- TOC entry 4055 (class 2606 OID 928522)
-- Name: ShapePredictionOverride ShapePredictionOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShapePredictionOverride"
    ADD CONSTRAINT "ShapePredictionOverride_pkey" PRIMARY KEY (id);


--
-- TOC entry 4032 (class 2606 OID 759633)
-- Name: ShapePredictionStore ShapePredictionStore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShapePredictionStore"
    ADD CONSTRAINT "ShapePredictionStore_pkey" PRIMARY KEY (id);


--
-- TOC entry 3973 (class 2606 OID 18209)
-- Name: Snapshot Snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_pkey" PRIMARY KEY (id);


--
-- TOC entry 4041 (class 2606 OID 872966)
-- Name: SupabaseProject SupabaseProject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupabaseProject"
    ADD CONSTRAINT "SupabaseProject_pkey" PRIMARY KEY (id);


--
-- TOC entry 3977 (class 2606 OID 18227)
-- Name: Table Table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_pkey" PRIMARY KEY (id);


--
-- TOC entry 3954 (class 2606 OID 18158)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 22652)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3984 (class 1259 OID 43961)
-- Name: job_fetch; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX job_fetch ON pgboss.job USING btree (name text_pattern_ops, startafter) WHERE (state < 'active'::pgboss.job_state);


--
-- TOC entry 3985 (class 1259 OID 22770)
-- Name: job_name; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE INDEX job_name ON pgboss.job USING btree (name text_pattern_ops);


--
-- TOC entry 3988 (class 1259 OID 43960)
-- Name: job_singleton_queue; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX job_singleton_queue ON pgboss.job USING btree (name, singletonkey) WHERE ((state < 'active'::pgboss.job_state) AND (singletonon IS NULL) AND (singletonkey = '__pgboss__singleton_queue'::text));


--
-- TOC entry 3989 (class 1259 OID 43959)
-- Name: job_singletonkey; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX job_singletonkey ON pgboss.job USING btree (name, singletonkey) WHERE ((state < 'completed'::pgboss.job_state) AND (singletonon IS NULL) AND (NOT (singletonkey = '__pgboss__singleton_queue'::text)));


--
-- TOC entry 3990 (class 1259 OID 22772)
-- Name: job_singletonkeyon; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX job_singletonkeyon ON pgboss.job USING btree (name, singletonon, singletonkey) WHERE (state < 'expired'::pgboss.job_state);


--
-- TOC entry 3991 (class 1259 OID 22771)
-- Name: job_singletonon; Type: INDEX; Schema: pgboss; Owner: -
--

CREATE UNIQUE INDEX job_singletonon ON pgboss.job USING btree (name, singletonon) WHERE ((state < 'expired'::pgboss.job_state) AND (singletonkey IS NULL));


--
-- TOC entry 3962 (class 1259 OID 729470)
-- Name: AccessToken_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AccessToken_hash_key" ON public."AccessToken" USING btree (hash);


--
-- TOC entry 3965 (class 1259 OID 18231)
-- Name: AccessToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessToken_userId_idx" ON public."AccessToken" USING btree ("userId");


--
-- TOC entry 4014 (class 1259 OID 798918)
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- TOC entry 4015 (class 1259 OID 65048)
-- Name: AuditLog_organizationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_organizationId_idx" ON public."AuditLog" USING btree ("organizationId");


--
-- TOC entry 4043 (class 1259 OID 903724)
-- Name: AwsConsumptionHistory_name_snapshotId_projectId_organizatio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AwsConsumptionHistory_name_snapshotId_projectId_organizatio_key" ON public."AwsConsumptionHistory" USING btree (name, "snapshotId", "projectId", "organizationId", "startPeriod", "endPeriod");


--
-- TOC entry 4044 (class 1259 OID 903723)
-- Name: AwsConsumptionHistory_organizationId_projectId_snapshotId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AwsConsumptionHistory_organizationId_projectId_snapshotId_idx" ON public."AwsConsumptionHistory" USING btree ("organizationId", "projectId", "snapshotId");


--
-- TOC entry 4047 (class 1259 OID 903722)
-- Name: AwsConsumptionHistory_startPeriod_endPeriod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AwsConsumptionHistory_startPeriod_endPeriod_idx" ON public."AwsConsumptionHistory" USING btree ("startPeriod", "endPeriod");


--
-- TOC entry 4011 (class 1259 OID 60723)
-- Name: DatabaseProvider_domain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DatabaseProvider_domain_key" ON public."DatabaseProvider" USING btree (domain);


--
-- TOC entry 3966 (class 1259 OID 18232)
-- Name: DbConnection_id_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DbConnection_id_organizationId_key" ON public."DbConnection" USING btree (id, "organizationId");


--
-- TOC entry 3967 (class 1259 OID 18234)
-- Name: DbConnection_organizationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DbConnection_organizationId_idx" ON public."DbConnection" USING btree ("organizationId");


--
-- TOC entry 4006 (class 1259 OID 43454)
-- Name: InviteToken_usedByMemberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InviteToken_usedByMemberId_key" ON public."InviteToken" USING btree ("usedByMemberId");


--
-- TOC entry 3960 (class 1259 OID 18230)
-- Name: Member_userId_organizationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Member_userId_organizationId_idx" ON public."Member" USING btree ("userId", "organizationId");


--
-- TOC entry 3961 (class 1259 OID 18229)
-- Name: Member_userId_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Member_userId_organizationId_key" ON public."Member" USING btree ("userId", "organizationId");


--
-- TOC entry 4048 (class 1259 OID 903727)
-- Name: NeonConsumptionHistory_name_snapshotId_projectId_organizati_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NeonConsumptionHistory_name_snapshotId_projectId_organizati_key" ON public."NeonConsumptionHistory" USING btree (name, "snapshotId", "projectId", "organizationId", "startPeriod", "endPeriod");


--
-- TOC entry 4049 (class 1259 OID 903726)
-- Name: NeonConsumptionHistory_organizationId_projectId_snapshotId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NeonConsumptionHistory_organizationId_projectId_snapshotId_idx" ON public."NeonConsumptionHistory" USING btree ("organizationId", "projectId", "snapshotId");


--
-- TOC entry 4052 (class 1259 OID 903725)
-- Name: NeonConsumptionHistory_startPeriod_endPeriod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NeonConsumptionHistory_startPeriod_endPeriod_idx" ON public."NeonConsumptionHistory" USING btree ("startPeriod", "endPeriod");


--
-- TOC entry 4020 (class 1259 OID 656456)
-- Name: NeonProject_neonProjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NeonProject_neonProjectId_key" ON public."NeonProject" USING btree ("neonProjectId");


--
-- TOC entry 4023 (class 1259 OID 656457)
-- Name: NeonProject_snapshotId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NeonProject_snapshotId_key" ON public."NeonProject" USING btree ("snapshotId");


--
-- TOC entry 4033 (class 1259 OID 809388)
-- Name: PredictionDataSet_input_context_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PredictionDataSet_input_context_idx" ON public."PredictionDataSet" USING btree (input, context);


--
-- TOC entry 4034 (class 1259 OID 809387)
-- Name: PredictionDataSet_input_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PredictionDataSet_input_key" ON public."PredictionDataSet" USING btree (input);


--
-- TOC entry 4035 (class 1259 OID 809389)
-- Name: PredictionDataSet_input_shape_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PredictionDataSet_input_shape_idx" ON public."PredictionDataSet" USING btree (input, shape);


--
-- TOC entry 4024 (class 1259 OID 656458)
-- Name: PreviewDatabase_neonProjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PreviewDatabase_neonProjectId_idx" ON public."PreviewDatabase" USING btree ("neonProjectId");


--
-- TOC entry 4025 (class 1259 OID 656460)
-- Name: PreviewDatabase_neonProjectId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PreviewDatabase_neonProjectId_name_key" ON public."PreviewDatabase" USING btree ("neonProjectId", name);


--
-- TOC entry 4026 (class 1259 OID 656459)
-- Name: PreviewDatabase_neonProjectId_neonBranchId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PreviewDatabase_neonProjectId_neonBranchId_key" ON public."PreviewDatabase" USING btree ("neonProjectId", "neonBranchId");


--
-- TOC entry 3996 (class 1259 OID 38616)
-- Name: PricingPlan_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PricingPlan_productId_key" ON public."PricingPlan" USING btree ("productId");


--
-- TOC entry 3997 (class 1259 OID 166490)
-- Name: Project_hostedDbUrlId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Project_hostedDbUrlId_key" ON public."Project" USING btree ("hostedDbUrlId");


--
-- TOC entry 3998 (class 1259 OID 37294)
-- Name: Project_organizationId_dbConnectionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Project_organizationId_dbConnectionId_key" ON public."Project" USING btree ("organizationId", "dbConnectionId");


--
-- TOC entry 3999 (class 1259 OID 29559)
-- Name: Project_organizationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Project_organizationId_idx" ON public."Project" USING btree ("organizationId");


--
-- TOC entry 4002 (class 1259 OID 858819)
-- Name: Project_predictionJobId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Project_predictionJobId_key" ON public."Project" USING btree ("predictionJobId");


--
-- TOC entry 4003 (class 1259 OID 872968)
-- Name: Project_supabaseProjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Project_supabaseProjectId_key" ON public."Project" USING btree ("supabaseProjectId");


--
-- TOC entry 4009 (class 1259 OID 54238)
-- Name: ReleaseVersion_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReleaseVersion_userId_key" ON public."ReleaseVersion" USING btree ("userId");


--
-- TOC entry 4010 (class 1259 OID 54239)
-- Name: ReleaseVersion_version_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReleaseVersion_version_userId_key" ON public."ReleaseVersion" USING btree (version, "userId");


--
-- TOC entry 4053 (class 1259 OID 928523)
-- Name: ShapePredictionOverride_input_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShapePredictionOverride_input_key" ON public."ShapePredictionOverride" USING btree (input);


--
-- TOC entry 4056 (class 1259 OID 963984)
-- Name: ShapePredictionOverride_projectId_input_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShapePredictionOverride_projectId_input_key" ON public."ShapePredictionOverride" USING btree ("projectId", input);


--
-- TOC entry 4029 (class 1259 OID 930447)
-- Name: ShapePredictionStore_input_engine_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShapePredictionStore_input_engine_key" ON public."ShapePredictionStore" USING btree (input, engine);


--
-- TOC entry 4030 (class 1259 OID 792365)
-- Name: ShapePredictionStore_input_predictedLabel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ShapePredictionStore_input_predictedLabel_idx" ON public."ShapePredictionStore" USING btree (input, "predictedLabel");


--
-- TOC entry 3970 (class 1259 OID 18238)
-- Name: Snapshot_dbConnectionId_uniqueName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Snapshot_dbConnectionId_uniqueName_key" ON public."Snapshot" USING btree ("dbConnectionId", "uniqueName");


--
-- TOC entry 3971 (class 1259 OID 18237)
-- Name: Snapshot_id_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Snapshot_id_organizationId_key" ON public."Snapshot" USING btree (id, "organizationId");


--
-- TOC entry 3974 (class 1259 OID 963810)
-- Name: Snapshot_uniqueName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Snapshot_uniqueName_key" ON public."Snapshot" USING btree ("uniqueName");


--
-- TOC entry 4042 (class 1259 OID 872967)
-- Name: SupabaseProject_projectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SupabaseProject_projectId_key" ON public."SupabaseProject" USING btree ("projectId");


--
-- TOC entry 3975 (class 1259 OID 18239)
-- Name: Table_id_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Table_id_organizationId_key" ON public."Table" USING btree (id, "organizationId");


--
-- TOC entry 3978 (class 1259 OID 52228)
-- Name: Table_schema_tableName_snapshotId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Table_schema_tableName_snapshotId_key" ON public."Table" USING btree (schema, "tableName", "snapshotId");


--
-- TOC entry 3979 (class 1259 OID 235400)
-- Name: Table_snapshotId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Table_snapshotId_idx" ON public."Table" USING btree ("snapshotId");


--
-- TOC entry 3952 (class 1259 OID 18530)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 3955 (class 1259 OID 18228)
-- Name: User_sub_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_sub_key" ON public."User" USING btree (sub);


--
-- TOC entry 4060 (class 2606 OID 58991)
-- Name: AccessToken AccessToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessToken"
    ADD CONSTRAINT "AccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4079 (class 2606 OID 65054)
-- Name: AuditLog AuditLog_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4080 (class 2606 OID 724609)
-- Name: AuditLog AuditLog_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4081 (class 2606 OID 65049)
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4087 (class 2606 OID 903738)
-- Name: AwsConsumptionHistory AwsConsumptionHistory_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AwsConsumptionHistory"
    ADD CONSTRAINT "AwsConsumptionHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4088 (class 2606 OID 903733)
-- Name: AwsConsumptionHistory AwsConsumptionHistory_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AwsConsumptionHistory"
    ADD CONSTRAINT "AwsConsumptionHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4089 (class 2606 OID 903728)
-- Name: AwsConsumptionHistory AwsConsumptionHistory_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AwsConsumptionHistory"
    ADD CONSTRAINT "AwsConsumptionHistory_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4061 (class 2606 OID 63262)
-- Name: DbConnection DbConnection_databaseProviderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DbConnection"
    ADD CONSTRAINT "DbConnection_databaseProviderId_fkey" FOREIGN KEY ("databaseProviderId") REFERENCES public."DatabaseProvider"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4062 (class 2606 OID 59001)
-- Name: DbConnection DbConnection_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DbConnection"
    ADD CONSTRAINT "DbConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4082 (class 2606 OID 790868)
-- Name: ExecTask ExecTask_accessTokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExecTask"
    ADD CONSTRAINT "ExecTask_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES public."AccessToken"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4083 (class 2606 OID 305768)
-- Name: ExecTask ExecTask_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExecTask"
    ADD CONSTRAINT "ExecTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4075 (class 2606 OID 58976)
-- Name: InviteToken InviteToken_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InviteToken"
    ADD CONSTRAINT "InviteToken_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4076 (class 2606 OID 43465)
-- Name: InviteToken InviteToken_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InviteToken"
    ADD CONSTRAINT "InviteToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4077 (class 2606 OID 43460)
-- Name: InviteToken InviteToken_usedByMemberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InviteToken"
    ADD CONSTRAINT "InviteToken_usedByMemberId_fkey" FOREIGN KEY ("usedByMemberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4058 (class 2606 OID 58981)
-- Name: Member Member_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4059 (class 2606 OID 58986)
-- Name: Member Member_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4090 (class 2606 OID 903753)
-- Name: NeonConsumptionHistory NeonConsumptionHistory_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonConsumptionHistory"
    ADD CONSTRAINT "NeonConsumptionHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4091 (class 2606 OID 903748)
-- Name: NeonConsumptionHistory NeonConsumptionHistory_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonConsumptionHistory"
    ADD CONSTRAINT "NeonConsumptionHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4092 (class 2606 OID 903743)
-- Name: NeonConsumptionHistory NeonConsumptionHistory_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonConsumptionHistory"
    ADD CONSTRAINT "NeonConsumptionHistory_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4084 (class 2606 OID 932007)
-- Name: NeonProject NeonProject_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonProject"
    ADD CONSTRAINT "NeonProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4085 (class 2606 OID 932002)
-- Name: NeonProject NeonProject_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NeonProject"
    ADD CONSTRAINT "NeonProject_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4057 (class 2606 OID 51497)
-- Name: Organization Organization_pricingPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES public."PricingPlan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4086 (class 2606 OID 656466)
-- Name: PreviewDatabase PreviewDatabase_neonProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PreviewDatabase"
    ADD CONSTRAINT "PreviewDatabase_neonProjectId_fkey" FOREIGN KEY ("neonProjectId") REFERENCES public."NeonProject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4070 (class 2606 OID 29565)
-- Name: Project Project_dbConnectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES public."DbConnection"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4071 (class 2606 OID 166491)
-- Name: Project Project_hostedDbUrlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_hostedDbUrlId_fkey" FOREIGN KEY ("hostedDbUrlId") REFERENCES public."DbConnection"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4072 (class 2606 OID 58996)
-- Name: Project Project_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4073 (class 2606 OID 858820)
-- Name: Project Project_predictionJobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_predictionJobId_fkey" FOREIGN KEY ("predictionJobId") REFERENCES public."PredictionJob"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4074 (class 2606 OID 872969)
-- Name: Project Project_supabaseProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_supabaseProjectId_fkey" FOREIGN KEY ("supabaseProjectId") REFERENCES public."SupabaseProject"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4078 (class 2606 OID 54240)
-- Name: ReleaseVersion ReleaseVersion_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReleaseVersion"
    ADD CONSTRAINT "ReleaseVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4093 (class 2606 OID 928525)
-- Name: ShapePredictionOverride ShapePredictionOverride_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShapePredictionOverride"
    ADD CONSTRAINT "ShapePredictionOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4063 (class 2606 OID 122229)
-- Name: Snapshot Snapshot_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4064 (class 2606 OID 18275)
-- Name: Snapshot Snapshot_dbConnectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES public."DbConnection"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4065 (class 2606 OID 366787)
-- Name: Snapshot Snapshot_execTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_execTaskId_fkey" FOREIGN KEY ("execTaskId") REFERENCES public."ExecTask"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4066 (class 2606 OID 59011)
-- Name: Snapshot Snapshot_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4067 (class 2606 OID 120381)
-- Name: Snapshot Snapshot_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4068 (class 2606 OID 59021)
-- Name: Table Table_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4069 (class 2606 OID 59016)
-- Name: Table Table_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2023-10-31 07:59:27 Africa

--
-- PostgreSQL database dump complete
--
