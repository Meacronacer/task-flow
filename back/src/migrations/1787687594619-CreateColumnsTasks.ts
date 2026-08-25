import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateColumnsTasks1787687594619 implements MigrationInterface {
    name = 'CreateColumnsTasks1787687594619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "columns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "position" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4ac339ccbbfed1dcd96812abbd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "time_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "started_at" TIMESTAMP NOT NULL, "ended_at" TIMESTAMP, "duration_sec" integer, CONSTRAINT "PK_8657e6aaa7035da9fc7309f385a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('todo', 'in_progress', 'review', 'done')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "column_id" uuid NOT NULL, "project_id" character varying NOT NULL, "title" character varying(255) NOT NULL, "description" text, "assignee_id" uuid, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'todo', "position" integer NOT NULL, "deadline" TIMESTAMP, "ai_summary" text, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "columns" ADD CONSTRAINT "FK_ad83764ca1d841f43830f93b787" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_logs" ADD CONSTRAINT "FK_5863acae12451e29b1414a3795c" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_logs" ADD CONSTRAINT "FK_b5e06aedfbf8f061e3e68ad154e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_986f14173dba32448f3f3abb1c4" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_986f14173dba32448f3f3abb1c4"`);
        await queryRunner.query(`ALTER TABLE "time_logs" DROP CONSTRAINT "FK_b5e06aedfbf8f061e3e68ad154e"`);
        await queryRunner.query(`ALTER TABLE "time_logs" DROP CONSTRAINT "FK_5863acae12451e29b1414a3795c"`);
        await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_ad83764ca1d841f43830f93b787"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TABLE "time_logs"`);
        await queryRunner.query(`DROP TABLE "columns"`);
    }

}
