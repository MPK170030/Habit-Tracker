-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastNotificationDate" TEXT,
ADD COLUMN "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "notificationTime" TEXT,
ADD COLUMN "timezone" TEXT;
