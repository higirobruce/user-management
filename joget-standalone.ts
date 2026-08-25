/**
 * Runs ONLY the Joget routes over HTTP — no database, no login.
 * For local Postman testing before Postgres is set up.
 *
 *   npx ts-node -r tsconfig-paths/register joget-standalone.ts
 *   → http://localhost:3001/joget/reports
 *
 * The JWT guard is stubbed out here, so DO NOT expose this beyond localhost.
 * The real app (npm run start:dev) keeps the guard.
 */
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from './src/auth/guards/jwt-auth.guard';
import { JogetModule } from './src/joget/joget.module';

const PORT = 3001;

async function main() {
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), JogetModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  app.enableCors({ origin: true });
  await app.listen(PORT);

  console.log(`\nJoget routes (no auth) on http://localhost:${PORT}\n`);
  console.log(`  GET /joget/reports`);
  console.log(`  GET /joget/reports/:recordId`);
  console.log(`  GET /joget/reports/:recordId/file\n`);
}

main().catch((err) => {
  console.error('FAILED:', err?.message ?? err);
  process.exit(1);
});
