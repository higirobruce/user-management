/**
 * Standalone smoke test for the Joget proxy layer — no database, no auth.
 * Boots ONLY JogetModule and calls the service directly.
 *
 *   npx ts-node -r tsconfig-paths/register joget-smoke.ts
 *   npx ts-node -r tsconfig-paths/register joget-smoke.ts <recordId>
 *
 * Not part of the app. Delete it whenever you like.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JogetModule } from './src/joget/joget.module';
import { JogetService } from './src/joget/joget.service';
import * as fs from 'fs';

// AppModule normally supplies the global ConfigModule; stand it up here so
// the service can read .env without booting the database.
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), JogetModule],
})
class SmokeModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(SmokeModule, {
    logger: ['error', 'warn'],
  });
  const joget = app.get(JogetService);

  const recordId = process.argv[2];

  if (!recordId) {
    console.log('→ GET /joget/reports\n');
    const result = await joget.listReports();
    console.log(`total: ${result.total}  rows: ${result.data.length}`);
    console.log(`columns: ${Object.keys(result.data[0] ?? {}).join(', ')}\n`);

    const withFile = result.data.filter((r) => r.hasFile);
    console.log(`rows with a file: ${withFile.length}/${result.data.length}`);

    result.data.slice(0, 5).forEach((r) => {
      console.log(`  ${r.id}  hasFile=${r.hasFile}  file=${r.fileName ?? '-'}`);
    });

    if (withFile.length) {
      console.log(`\nNow try:  npx ts-node -r tsconfig-paths/register joget-smoke.ts ${withFile[0].id}`);
    } else {
      console.log('\nNo row exposes a file column — set JOGET_FILE_COLUMN once you know the right one.');
    }
  } else {
    console.log(`→ GET /joget/reports/${recordId}/file\n`);
    const file = await joget.getReportFile(recordId);
    const out = `/tmp/${file.fileName}`;
    fs.writeFileSync(out, file.buffer);
    console.log(`contentType: ${file.contentType}`);
    console.log(`bytes:       ${file.buffer.length}`);
    console.log(`magic:       ${file.buffer.subarray(0, 5).toString()}`);
    console.log(`saved to:    ${out}`);
  }

  await app.close();
}

main().catch((err) => {
  console.error('\nFAILED:', err?.message ?? err);
  if (err?.status) console.error('status:', err.status);
  process.exit(1);
});
