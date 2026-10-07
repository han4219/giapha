-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE "RelationshipType" AS ENUM ('PARENT_CHILD', 'SPOUSE');
CREATE TYPE "BranchType" AS ENUM ('PRIMARY', 'SECONDARY');
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "FamilyPersonMembershipType" AS ENUM ('LINEAGE', 'NON_LINEAGE');
CREATE TYPE "MediaOwnerType" AS ENUM ('PERSON', 'GRAVE', 'EVENT');
CREATE TYPE "MediaType" AS ENUM ('PROFILE_PHOTO', 'GALLERY', 'DOCUMENT', 'OTHER');
CREATE TYPE "GravePersonRole" AS ENUM ('OWNER', 'SPOUSE', 'FAMILY_MEMBER', 'OTHER');
CREATE TYPE "EventType" AS ENUM ('FAMILY_MEETING', 'MEMORIAL', 'GRAVE_VISIT', 'CEREMONY', 'OTHER');

-- CreateTable
CREATE TABLE "person" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(255) NOT NULL,
    "gender" "GenderType" NOT NULL DEFAULT 'UNKNOWN',
    "birth_date" DATE,
    "death_date" DATE,
    "birth_place" VARCHAR(500),
    "hometown" VARCHAR(500),
    "occupation" VARCHAR(500),
    "biography" TEXT,
    "note" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "person_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_person_dates" CHECK ("death_date" IS NULL OR "birth_date" IS NULL OR "death_date" >= "birth_date")
);

CREATE TABLE "family" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "founder_person_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_person" (
    "family_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "membership_type" "FamilyPersonMembershipType" NOT NULL,
    "generation" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_person_pkey" PRIMARY KEY ("family_id","person_id"),
    CONSTRAINT "chk_family_person_generation" CHECK (
        ("membership_type" = 'LINEAGE' AND "generation" IS NOT NULL AND "generation" >= 1)
        OR ("membership_type" = 'NON_LINEAGE' AND "generation" IS NULL)
    )
);

CREATE TABLE "relationship" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_person_id" UUID NOT NULL,
    "target_person_id" UUID NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_relationship_not_self" CHECK ("source_person_id" <> "target_person_id"),
    CONSTRAINT "chk_relationship_dates" CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" >= "start_date"),
    CONSTRAINT "chk_spouse_canonical" CHECK ("relationship_type" <> 'SPOUSE' OR "source_person_id" < "target_person_id")
);

CREATE TABLE "branch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "root_person_id" UUID NOT NULL,
    "branch_type" "BranchType" NOT NULL,
    "branch_code" VARCHAR(50) NOT NULL,
    "branch_name" VARCHAR(255) NOT NULL,
    "generation" INTEGER NOT NULL,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_branch_generation" CHECK ("generation" = 2)
);

CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_type" "MediaOwnerType" NOT NULL,
    "owner_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "file_name" VARCHAR(500),
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grave" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255),
    "cemetery" VARCHAR(500),
    "location_description" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grave_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "person_grave" (
    "person_id" UUID NOT NULL,
    "grave_id" UUID NOT NULL,
    "role" "GravePersonRole" NOT NULL DEFAULT 'OWNER',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "person_grave_pkey" PRIMARY KEY ("person_id","grave_id")
);

CREATE TABLE "family_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "event_type" "EventType" NOT NULL,
    "event_date" DATE,
    "location" VARCHAR(500),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_participant" (
    "event_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "role" VARCHAR(255),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_participant_pkey" PRIMARY KEY ("event_id","person_id")
);

-- Indexes
CREATE UNIQUE INDEX "family_founder_person_id_key" ON "family"("founder_person_id");
CREATE UNIQUE INDEX "family_person_person_id_key" ON "family_person"("person_id");
CREATE INDEX "idx_person_full_name" ON "person"("full_name");
CREATE INDEX "idx_person_full_name_trgm" ON "person" USING gin ("full_name" gin_trgm_ops);
CREATE INDEX "idx_person_not_deleted" ON "person"("full_name") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_family_person_family" ON "family_person"("family_id");
CREATE INDEX "idx_family_person_person" ON "family_person"("person_id");
CREATE INDEX "idx_family_person_generation" ON "family_person"("family_id", "generation");
CREATE INDEX "idx_family_person_membership" ON "family_person"("family_id", "membership_type");
CREATE UNIQUE INDEX "uq_relationship_pair" ON "relationship"("source_person_id", "target_person_id", "relationship_type");
CREATE INDEX "idx_relationship_source_type" ON "relationship"("source_person_id", "relationship_type");
CREATE INDEX "idx_relationship_target_type" ON "relationship"("target_person_id", "relationship_type");
CREATE UNIQUE INDEX "branch_root_person_id_key" ON "branch"("root_person_id");
CREATE UNIQUE INDEX "uq_branch_family_code" ON "branch"("family_id", "branch_code");
CREATE INDEX "idx_branch_family" ON "branch"("family_id");
CREATE INDEX "idx_branch_root_person" ON "branch"("root_person_id");
CREATE INDEX "idx_branch_generation" ON "branch"("generation");
CREATE INDEX "idx_branch_status" ON "branch"("status");
CREATE INDEX "idx_grave_cemetery" ON "grave"("cemetery");
CREATE INDEX "idx_family_event_family" ON "family_event"("family_id");
CREATE INDEX "idx_family_event_date" ON "family_event"("event_date");
CREATE INDEX "idx_event_participant_person" ON "event_participant"("person_id");

-- ForeignKeys
ALTER TABLE "family" ADD CONSTRAINT "family_founder_person_id_fkey" FOREIGN KEY ("founder_person_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "family_person" ADD CONSTRAINT "family_person_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_person" ADD CONSTRAINT "family_person_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_source_person_id_fkey" FOREIGN KEY ("source_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_target_person_id_fkey" FOREIGN KEY ("target_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "branch" ADD CONSTRAINT "branch_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch" ADD CONSTRAINT "branch_root_person_id_fkey" FOREIGN KEY ("root_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_grave" ADD CONSTRAINT "person_grave_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "person_grave" ADD CONSTRAINT "person_grave_grave_id_fkey" FOREIGN KEY ("grave_id") REFERENCES "grave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_event" ADD CONSTRAINT "family_event_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "family_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_updated_at BEFORE UPDATE ON "person" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_family_updated_at BEFORE UPDATE ON "family" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_family_person_updated_at BEFORE UPDATE ON "family_person" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_relationship_updated_at BEFORE UPDATE ON "relationship" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_branch_updated_at BEFORE UPDATE ON "branch" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_grave_updated_at BEFORE UPDATE ON "grave" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_family_event_updated_at BEFORE UPDATE ON "family_event" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
