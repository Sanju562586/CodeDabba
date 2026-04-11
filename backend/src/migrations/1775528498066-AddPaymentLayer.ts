import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentLayer1775528498066 implements MigrationInterface {
    name = 'AddPaymentLayer1775528498066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hackathon_payments_paymenttype_enum" AS ENUM('REGISTRATION', 'ROUND')`);
        await queryRunner.query(`CREATE TYPE "public"."hackathon_payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "hackathon_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "teamId" uuid, "hackathonId" uuid NOT NULL, "roundId" uuid, "paymentType" "public"."hackathon_payments_paymenttype_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'INR', "status" "public"."hackathon_payments_status_enum" NOT NULL DEFAULT 'PENDING', "orderId" character varying, "transactionId" character varying, "payerId" character varying NOT NULL, "teamName" character varying, "participantCount" integer, "invoiceNumber" character varying, "receiptUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "paidAt" TIMESTAMP, CONSTRAINT "PK_33d44eb513276eaa174e29ebada" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a46b7cec40bde6af8db742a11b" ON "hackathon_payments" ("userId", "hackathonId", "roundId", "paymentType") `);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" ADD "isPaymentRequired" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" ADD "paymentAmount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" ADD "paymentDeadline" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."hackathon_rounds_paymenttype_enum" AS ENUM('ALL_TEAMS', 'QUALIFIED_ONLY')`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" ADD "paymentType" "public"."hackathon_rounds_paymenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "hackathons" ADD "isPaid" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "hackathons" ADD "registrationFee" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "hackathons" ADD "paymentDeadline" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "hackathons" ADD "currency" character varying NOT NULL DEFAULT 'INR'`);
        await queryRunner.query(`ALTER TABLE "hackathons" ADD "refundPolicy" text`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" ADD CONSTRAINT "FK_9b1eb643ffc7f809447f6e9b168" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" ADD CONSTRAINT "FK_92cf55450ebb55366622f93da15" FOREIGN KEY ("teamId") REFERENCES "hackathon_teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" ADD CONSTRAINT "FK_d2c8d4d55aa3cc113219a687504" FOREIGN KEY ("hackathonId") REFERENCES "hackathons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" ADD CONSTRAINT "FK_8f0b8880631d980efdd166baf5b" FOREIGN KEY ("roundId") REFERENCES "hackathon_rounds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hackathon_payments" DROP CONSTRAINT "FK_8f0b8880631d980efdd166baf5b"`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" DROP CONSTRAINT "FK_d2c8d4d55aa3cc113219a687504"`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" DROP CONSTRAINT "FK_92cf55450ebb55366622f93da15"`);
        await queryRunner.query(`ALTER TABLE "hackathon_payments" DROP CONSTRAINT "FK_9b1eb643ffc7f809447f6e9b168"`);
        await queryRunner.query(`ALTER TABLE "hackathons" DROP COLUMN "refundPolicy"`);
        await queryRunner.query(`ALTER TABLE "hackathons" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "hackathons" DROP COLUMN "paymentDeadline"`);
        await queryRunner.query(`ALTER TABLE "hackathons" DROP COLUMN "registrationFee"`);
        await queryRunner.query(`ALTER TABLE "hackathons" DROP COLUMN "isPaid"`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" DROP COLUMN "paymentType"`);
        await queryRunner.query(`DROP TYPE "public"."hackathon_rounds_paymenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" DROP COLUMN "paymentDeadline"`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" DROP COLUMN "paymentAmount"`);
        await queryRunner.query(`ALTER TABLE "hackathon_rounds" DROP COLUMN "isPaymentRequired"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a46b7cec40bde6af8db742a11b"`);
        await queryRunner.query(`DROP TABLE "hackathon_payments"`);
        await queryRunner.query(`DROP TYPE "public"."hackathon_payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hackathon_payments_paymenttype_enum"`);
    }

}
