import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile(fileURLToPath(new URL('.env', import.meta.url)));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const go = process.env.SIMPRO_GO_EXE || 'go';
const backend = spawn(go, ['run', './cmd/api'], {
  cwd: new URL('./', import.meta.url),
  stdio: 'inherit',
});

backend.on('error', (error) => {
  console.error(error.code === 'ENOENT'
    ? 'Go tidak ditemukan. Tambahkan Go 1.25+ ke PATH atau isi SIMPRO_GO_EXE di backend/.env.'
    : `Gagal menjalankan Go (${error.code || error.name}).`);
  process.exitCode = 1;
});

backend.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
