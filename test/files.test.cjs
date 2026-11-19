const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { test } = require('node:test');
const { inflateRawSync } = require('node:zlib');
const copy = require('../src/tasks/copy');
const zip = require('../src/tasks/zip');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wpeg-files-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  fs.mkdirSync(path.join(source, 'empty'), { recursive: true });
  const binary = Buffer.from([0, 255, 128, 195, 40, 254, 0]);
  fs.writeFileSync(path.join(source, 'image.bin'), binary);
  fs.writeFileSync(path.join(source, 'text.txt'), 'Synthetic text\n');
  return { root, source, binary };
}

function entries(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert(end >= 0);
  const result = new Map();
  let offset = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < buffer.readUInt16LE(end + 10); i += 1) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
    const method = buffer.readUInt16LE(offset + 10);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    const local = buffer.readUInt32LE(offset + 42);
    assert.equal(buffer.readUInt32LE(local), 0x04034b50);
    const data = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const compressed = buffer.subarray(data, data + size);
    assert(method === 0 || method === 8);
    result.set(name, method === 8 ? inflateRawSync(compressed) : compressed);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return result;
}

for (const nodir of [true, false]) {
  test(`copy preserves binary contents and honors nodir=${nodir}`, async (t) => {
    const { root, source, binary } = fixture(t);
    const output = path.join(root, 'output');
    await pipeline(
      copy.fn(false)({
        copy_files_src: path.join(source, '**/*'),
        copy_files_src_opts: { base: source, nodir },
        copy_files_dist: output,
      }),
      new Writable({
        objectMode: true,
        write(file, encoding, done) {
          done();
        },
      })
    );
    assert.deepEqual(fs.readFileSync(path.join(output, 'image.bin')), binary);
    assert.equal(fs.readFileSync(path.join(output, 'text.txt'), 'utf8'), 'Synthetic text\n');
    assert.equal(fs.existsSync(path.join(output, 'empty')), !nodir);
  });

  test(`ZIP preserves binary entries and honors nodir=${nodir}`, async (t) => {
    const { root, source, binary } = fixture(t);
    const archive = path.join(root, 'output', 'files.zip');
    await new Promise((resolve, reject) => {
      zip.fn(false)(
        {
          zip_files: [
            { src: path.join(source, '**/*'), src_opts: { base: source, nodir }, dist: archive },
          ],
        },
        (error) => (error ? reject(error) : resolve())
      );
    });
    const files = entries(fs.readFileSync(archive));
    assert.deepEqual(
      [...files.keys()].sort(),
      nodir ? ['image.bin', 'text.txt'] : ['empty/', 'image.bin', 'text.txt']
    );
    assert.deepEqual(files.get('image.bin'), binary);
    assert.equal(files.get('text.txt').toString('utf8'), 'Synthetic text\n');
  });
}
