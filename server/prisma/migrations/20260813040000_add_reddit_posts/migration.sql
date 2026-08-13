-- CreateTable
CREATE TABLE "RedditPost" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subreddit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "flair" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedditPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RedditPost_isPublished_idx" ON "RedditPost"("isPublished");

-- CreateIndex
CREATE INDEX "RedditPost_postedAt_idx" ON "RedditPost"("postedAt");
