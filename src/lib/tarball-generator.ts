import archiver from 'archiver';
import { Readable } from 'stream';

/**
 * Creates a tarball (tar.gz) from project files
 * @param files Record of file paths to file contents
 * @returns Promise that resolves to a Buffer containing the tarball
 */
export async function createTarball(files: Record<string, string | Buffer>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: {
        level: 9,
      },
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    // Add files to the archive
    for (const [filePath, content] of Object.entries(files)) {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
      archive.append(buffer, { name: filePath });
    }

    archive.finalize();
  });
}

/**
 * Creates a tarball as a Readable stream (for direct upload)
 * @param files Record of file paths to file contents
 * @returns Readable stream of the tarball
 */
export function createTarballStream(files: Record<string, string | Buffer>): Readable {
  const archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 9,
    },
  });

  // Add files to the archive
  for (const [filePath, content] of Object.entries(files)) {
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    archive.append(buffer, { name: filePath });
  }

  archive.finalize();
  return archive;
}
