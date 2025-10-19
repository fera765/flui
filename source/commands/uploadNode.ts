/**
 * FLUI Upload Node Command
 * 
 * Uploads a custom node package to FLUI
 * Usage: flui --upload-node <path-to-zip>
 */

import { readFile } from 'fs/promises';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { createHash } from 'crypto';

interface UploadNodeOptions {
  packagePath: string;
  apiUrl?: string;
}

export async function uploadNode(options: UploadNodeOptions): Promise<void> {
  const { packagePath, apiUrl = 'http://localhost:3001' } = options;

  console.log(`\n📤 Uploading custom node package...\n`);
  console.log(`📦 Package: ${packagePath}`);

  try {
    // Calcular checksum
    console.log('🔐 Calculating checksum...');
    const fileBuffer = await readFile(packagePath);
    const checksum = createHash('sha256').update(fileBuffer).digest('hex');
    console.log(`✅ Checksum: ${checksum}`);

    // Criar form data
    const form = new FormData();
    form.append('package', createReadStream(packagePath));
    form.append('checksum', checksum);

    // Upload
    console.log('\n📡 Uploading to FLUI server...');
    
    const response = await fetch(`${apiUrl}/api/custom-nodes/upload`, {
      method: 'POST',
      body: form as any,
      // @ts-ignore
      headers: form.getHeaders(),
    });

    const result: any = await response.json();

    if (result.success) {
      console.log('\n✅ Upload successful!\n');
      console.log(`🔑 Fingerprint: ${result.fingerprint}`);
      console.log(`📌 Version: ${result.newVersion}`);
      
      if (result.isUpdate) {
        console.log(`🔄 Updated from: ${result.previousVersion}`);
      } else {
        console.log(`🆕 New node installed`);
      }
      
      console.log(`\n${result.message}`);
      console.log('\n🎉 Your custom node is now available in FLUI!\n');
    } else {
      console.error('\n❌ Upload failed!\n');
      console.error(`Message: ${result.message}`);
      
      if (result.errors && result.errors.length > 0) {
        console.error('\nErrors:');
        result.errors.forEach((err: string) => {
          console.error(`  - ${err}`);
        });
      }
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Upload failed with error:\n');
    console.error(error.message);
    process.exit(1);
  }
}
