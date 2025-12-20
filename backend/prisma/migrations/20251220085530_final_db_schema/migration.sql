/*
  Warnings:

  - You are about to drop the column `email` on the `Resource` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingAction" AS ENUM ('CREATED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'PAYMENT_RECEIVED', 'REFUND_PROCESSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED', 'MANUAL_CONFIRMATION_REQUEST', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'OTP_VERIFICATION', 'PASSWORD_RESET', 'WELCOME');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'YES_NO', 'DATE', 'NUMBER');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BOOKING_SUMMARY', 'REVENUE_REPORT', 'UTILIZATION_REPORT', 'CUSTOMER_REPORT', 'PEAK_HOURS_ANALYSIS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('STAFF_MEMBER', 'ROOM', 'EQUIPMENT', 'VEHICLE', 'OTHER');

-- AlterTable
ALTER TABLE "AppointmentType" ADD COLUMN     "bufferTimeMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "color" TEXT DEFAULT '#3B82F6',
ADD COLUMN     "confirmationMessage" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxAdvanceBookingDays" INTEGER DEFAULT 30,
ADD COLUMN     "meetingUrl" TEXT,
ADD COLUMN     "minAdvanceBookingMinutes" INTEGER DEFAULT 120;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "staffMemberId" TEXT,
ADD COLUMN     "venue" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "email",
ADD COLUMN     "capacity" INTEGER DEFAULT 1,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "resourceType" "ResourceType" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "workingHours" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TwoFactorSession" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "profileImage" TEXT,
    "title" TEXT,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizerId" TEXT NOT NULL,
    "workingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT,
    "resourceId" TEXT,
    "appointmentTypeId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT,
    "resourceId" TEXT,
    "appointmentTypeId" TEXT,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSlot" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "staffMemberId" TEXT,
    "resourceId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "bookedCapacity" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "allowCancellation" BOOLEAN NOT NULL DEFAULT true,
    "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 24,
    "refundPercentage" INTEGER NOT NULL DEFAULT 100,
    "cancellationFee" DECIMAL(10,2),
    "noShowPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "action" "BookingAction" NOT NULL,
    "oldStatus" "BookingStatus",
    "newStatus" "BookingStatus",
    "oldStartTime" TIMESTAMP(3),
    "newStartTime" TIMESTAMP(3),
    "performedBy" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "bookingId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "organizerResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "SettingType" NOT NULL DEFAULT 'STRING',
    "category" TEXT,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "filters" JSONB,
    "data" JSONB,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffMember_organizerId_isActive_idx" ON "StaffMember"("organizerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_organizerId_email_key" ON "StaffMember"("organizerId", "email");

-- CreateIndex
CREATE INDEX "WorkingHours_staffMemberId_idx" ON "WorkingHours"("staffMemberId");

-- CreateIndex
CREATE INDEX "WorkingHours_resourceId_idx" ON "WorkingHours"("resourceId");

-- CreateIndex
CREATE INDEX "WorkingHours_appointmentTypeId_idx" ON "WorkingHours"("appointmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_staffMemberId_dayOfWeek_key" ON "WorkingHours"("staffMemberId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_resourceId_dayOfWeek_key" ON "WorkingHours"("resourceId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_appointmentTypeId_dayOfWeek_key" ON "WorkingHours"("appointmentTypeId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AvailabilityException_staffMemberId_date_idx" ON "AvailabilityException"("staffMemberId", "date");

-- CreateIndex
CREATE INDEX "AvailabilityException_resourceId_date_idx" ON "AvailabilityException"("resourceId", "date");

-- CreateIndex
CREATE INDEX "AvailabilityException_appointmentTypeId_date_idx" ON "AvailabilityException"("appointmentTypeId", "date");

-- CreateIndex
CREATE INDEX "BookingSlot_appointmentTypeId_date_isAvailable_idx" ON "BookingSlot"("appointmentTypeId", "date", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSlot_appointmentTypeId_staffMemberId_startTime_key" ON "BookingSlot"("appointmentTypeId", "staffMemberId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSlot_appointmentTypeId_resourceId_startTime_key" ON "BookingSlot"("appointmentTypeId", "resourceId", "startTime");

-- CreateIndex
CREATE INDEX "Question_appointmentTypeId_order_idx" ON "Question"("appointmentTypeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_appointmentTypeId_key" ON "CancellationPolicy"("appointmentTypeId");

-- CreateIndex
CREATE INDEX "BookingHistory_bookingId_idx" ON "BookingHistory"("bookingId");

-- CreateIndex
CREATE INDEX "BookingHistory_performedBy_idx" ON "BookingHistory"("performedBy");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE INDEX "Report_generatedBy_idx" ON "Report"("generatedBy");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "AppointmentType_organizerId_isPublished_idx" ON "AppointmentType"("organizerId", "isPublished");

-- CreateIndex
CREATE INDEX "Booking_customerId_status_idx" ON "Booking"("customerId", "status");

-- CreateIndex
CREATE INDEX "Booking_staffMemberId_startTime_idx" ON "Booking"("staffMemberId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_resourceId_startTime_idx" ON "Booking"("resourceId", "startTime");

-- CreateIndex
CREATE INDEX "Resource_organizerId_isActive_idx" ON "Resource"("organizerId", "isActive");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHistory" ADD CONSTRAINT "BookingHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHistory" ADD CONSTRAINT "BookingHistory_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
