-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN_COMISION_TECNICA', 'ARBITRO', 'OFICIAL_MESA');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_ROLE');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('LABORAL', 'FIN_DE_SEMANA');

-- CreateEnum
CREATE TYPE "TimeBlockCode" AS ENUM ('HORARIO_1', 'HORARIO_2');

-- CreateEnum
CREATE TYPE "AvailabilityBlock" AS ENUM ('HORARIO_1', 'HORARIO_2', 'FULL', 'NO');

-- CreateEnum
CREATE TYPE "MatchPlatform" AS ENUM ('NBN23', 'SWISH');

-- CreateEnum
CREATE TYPE "MatchTimeBlock" AS ENUM ('HORARIO_1', 'HORARIO_2', 'AMBOS');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'SUSPENDED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchRole" AS ENUM ('ARBITRO_PRINCIPAL', 'ARBITRO_1', 'ARBITRO_2', 'OFICIAL_1', 'OFICIAL_2', 'OFICIAL_3');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('DOCUMENTO', 'CREDENCIAL', 'COMUNICADO');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_ROLE',
    "data_consent" BOOLEAN NOT NULL DEFAULT false,
    "data_consent_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "time_block_configs" (
    "id" UUID NOT NULL,
    "day_type" "DayType" NOT NULL,
    "block_code" "TimeBlockCode" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_block_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "block" "AvailabilityBlock" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "platform" "MatchPlatform" NOT NULL,
    "time_block" "MatchTimeBlock" NOT NULL,
    "tournament" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "match_date_time" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "raw_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "match_role" "MatchRole" NOT NULL,
    "status" "NominationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "notified_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT,
    "content" TEXT,
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'AUTHENTICATED',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" UUID NOT NULL,
    "platform" "MatchPlatform" NOT NULL,
    "api_url" TEXT NOT NULL,
    "api_key_encrypted" TEXT,
    "webhook_secret_encrypted" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "sync_status" TEXT,
    "last_error_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "time_block_configs_day_type_block_code_key" ON "time_block_configs"("day_type", "block_code");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_user_id_date_key" ON "availabilities"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "matches_platform_external_id_key" ON "matches"("platform", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_match_id_match_role_key" ON "nominations"("match_id", "match_role");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_match_id_user_id_key" ON "nominations"("match_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_platform_key" ON "integration_configs"("platform");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
