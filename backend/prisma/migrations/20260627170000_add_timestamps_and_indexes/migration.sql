-- Add timestamps for accurate ordering and display.
ALTER TABLE "User"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Blog"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Replace the original relation so deleting a user does not leave orphaned posts.
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_authorId_fkey";
ALTER TABLE "Blog"
ADD CONSTRAINT "Blog_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Blog_published_id_idx" ON "Blog"("published", "id");
CREATE INDEX "Blog_authorId_id_idx" ON "Blog"("authorId", "id");
