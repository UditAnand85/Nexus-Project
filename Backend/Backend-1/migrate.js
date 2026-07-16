import postgres from 'postgres';
import { env } from './src/config/env.js';

const run = async () => {
  const queryClient = postgres(env.DATABASE_URL);
  try {
    // ── Phase 1: Existing aptitude_questions table ─────────────────────────────
    await queryClient.unsafe(`
CREATE TABLE IF NOT EXISTS "aptitude_questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"category" varchar(50) NOT NULL DEFAULT 'Quantitative',
	"question" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" varchar(1) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "aptitude_questions" ADD CONSTRAINT "aptitude_questions_job_id_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("job_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Make job_id nullable if the table already existed with NOT NULL
DO $$ BEGIN
  ALTER TABLE "aptitude_questions" ALTER COLUMN "job_id" DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN null;
  WHEN others THEN null;
END $$;

-- Add category column if missing
DO $$ BEGIN
  ALTER TABLE "aptitude_questions" ADD COLUMN "category" varchar(50) NOT NULL DEFAULT 'Quantitative';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
    `);

    // ── Phase 2: New technical_questions table ─────────────────────────────────
    await queryClient.unsafe(`
CREATE TABLE IF NOT EXISTS "technical_questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL DEFAULT 'Role-Specific',
	"question" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" varchar(1) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "technical_questions" ADD CONSTRAINT "technical_questions_job_id_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("job_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
    `);

    // ── Phase 3: Drop deprecated video_questions table ───────────────────────────
    await queryClient.unsafe(`
DROP TABLE IF EXISTS "video_questions" CASCADE;
    `);


    console.log('✅ Migration successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

run();
