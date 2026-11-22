-- CreateTable
CREATE TABLE "LibraryGame" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "summary" TEXT,
    "coverUrl" TEXT,
    "backdropUrl" TEXT,
    "screenshots" TEXT[],
    "genres" TEXT[],
    "themes" TEXT[],
    "similarIgdbIds" INTEGER[],
    "rating" DOUBLE PRECISION,
    "notes" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantToPlay" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "summary" TEXT,
    "coverUrl" TEXT,
    "backdropUrl" TEXT,
    "screenshots" TEXT[],
    "genres" TEXT[],
    "themes" TEXT[],
    "similarIgdbIds" INTEGER[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WantToPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistGame" (
    "playlistId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistGame_pkey" PRIMARY KEY ("playlistId","gameId")
);

-- CreateTable
CREATE TABLE "DismissedGame" (
    "igdbId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedGame_pkey" PRIMARY KEY ("igdbId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibraryGame_igdbId_key" ON "LibraryGame"("igdbId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryGame_slug_key" ON "LibraryGame"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WantToPlay_igdbId_key" ON "WantToPlay"("igdbId");

-- CreateIndex
CREATE UNIQUE INDEX "WantToPlay_slug_key" ON "WantToPlay"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_slug_key" ON "Playlist"("slug");

-- AddForeignKey
ALTER TABLE "PlaylistGame" ADD CONSTRAINT "PlaylistGame_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistGame" ADD CONSTRAINT "PlaylistGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "LibraryGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
