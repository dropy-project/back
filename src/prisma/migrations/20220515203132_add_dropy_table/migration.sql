-- CreateTable
CREATE TABLE "Dropy" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Dropy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "Dropy_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
