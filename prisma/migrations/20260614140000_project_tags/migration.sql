-- Add tags array column to projects table
ALTER TABLE "projects" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';
