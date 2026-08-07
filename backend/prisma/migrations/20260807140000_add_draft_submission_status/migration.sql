-- AlterEnum
-- Added in its own migration/transaction: Postgres will not let a newly
-- added enum value be used (e.g. as a column default) in the same
-- transaction it was added in.
ALTER TYPE "CreatorSubmissionStatus" ADD VALUE 'DRAFT';
