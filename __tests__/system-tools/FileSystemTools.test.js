/**
 * TDD Tests for File System Tools
 * Testing: FindFiles, ReadFile, ReadFolder, ReadManyFiles, WriteFile
 */
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';
describe('File System Tools - TDD', () => {
    let testDir;
    beforeEach(async () => {
        testDir = join(tmpdir(), `flui-test-${nanoid()}`);
        await mkdir(testDir, { recursive: true });
    });
    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });
    describe('FindFiles Tool', () => {
        it('should find files by pattern in directory', async () => {
            // Setup test files
            await writeFile(join(testDir, 'test1.txt'), 'content1');
            await writeFile(join(testDir, 'test2.txt'), 'content2');
            await writeFile(join(testDir, 'other.md'), 'markdown');
            // Import tool (will fail first - TDD)
            const { FindFilesTool } = await import('../../source/tools/system/FindFilesTool.js');
            const tool = new FindFilesTool();
            const result = await tool.execute({
                path: testDir,
                pattern: '*.txt',
            });
            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(2);
            expect(result.files).toEqual(expect.arrayContaining([
                expect.stringContaining('test1.txt'),
                expect.stringContaining('test2.txt'),
            ]));
        });
        it('should find files recursively', async () => {
            // Setup nested structure
            await mkdir(join(testDir, 'subdir'));
            await writeFile(join(testDir, 'root.txt'), 'root');
            await writeFile(join(testDir, 'subdir', 'nested.txt'), 'nested');
            const { FindFilesTool } = await import('../../source/tools/system/FindFilesTool.js');
            const tool = new FindFilesTool();
            const result = await tool.execute({
                path: testDir,
                pattern: '**/*.txt',
                recursive: true,
            });
            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(2);
        });
    });
    describe('ReadFile Tool', () => {
        it('should read file content', async () => {
            const testFile = join(testDir, 'test.txt');
            await writeFile(testFile, 'Hello World');
            const { ReadFileTool } = await import('../../source/tools/system/ReadFileTool.js');
            const tool = new ReadFileTool();
            const result = await tool.execute({ path: testFile });
            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello World');
            expect(result.encoding).toBe('utf-8');
        });
        it('should read binary files', async () => {
            const testFile = join(testDir, 'test.bin');
            const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
            await writeFile(testFile, buffer);
            const { ReadFileTool } = await import('../../source/tools/system/ReadFileTool.js');
            const tool = new ReadFileTool();
            const result = await tool.execute({
                path: testFile,
                encoding: 'binary',
            });
            expect(result.success).toBe(true);
            expect(result.content).toBeTruthy();
        });
    });
    describe('ReadFolder Tool', () => {
        it('should list folder contents', async () => {
            await writeFile(join(testDir, 'file1.txt'), 'content');
            await writeFile(join(testDir, 'file2.txt'), 'content');
            await mkdir(join(testDir, 'subdir'));
            const { ReadFolderTool } = await import('../../source/tools/system/ReadFolderTool.js');
            const tool = new ReadFolderTool();
            const result = await tool.execute({ path: testDir });
            expect(result.success).toBe(true);
            expect(result.entries).toHaveLength(3);
            expect(result.files).toHaveLength(2);
            expect(result.directories).toHaveLength(1);
        });
        it('should include file stats when requested', async () => {
            await writeFile(join(testDir, 'test.txt'), 'content');
            const { ReadFolderTool } = await import('../../source/tools/system/ReadFolderTool.js');
            const tool = new ReadFolderTool();
            const result = await tool.execute({
                path: testDir,
                includeStats: true,
            });
            expect(result.success).toBe(true);
            expect(result.entries[0].stats).toBeTruthy();
            expect(result.entries[0].stats.size).toBeGreaterThan(0);
        });
    });
    describe('ReadManyFiles Tool', () => {
        it('should read multiple files at once', async () => {
            const file1 = join(testDir, 'file1.txt');
            const file2 = join(testDir, 'file2.txt');
            await writeFile(file1, 'content1');
            await writeFile(file2, 'content2');
            const { ReadManyFilesTool } = await import('../../source/tools/system/ReadManyFilesTool.js');
            const tool = new ReadManyFilesTool();
            const result = await tool.execute({
                paths: [file1, file2],
            });
            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(2);
            expect(result.files[0].content).toBe('content1');
            expect(result.files[1].content).toBe('content2');
        });
        it('should handle errors for missing files', async () => {
            const file1 = join(testDir, 'exists.txt');
            const file2 = join(testDir, 'missing.txt');
            await writeFile(file1, 'content');
            const { ReadManyFilesTool } = await import('../../source/tools/system/ReadManyFilesTool.js');
            const tool = new ReadManyFilesTool();
            const result = await tool.execute({
                paths: [file1, file2],
                continueOnError: true,
            });
            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(2);
            expect(result.files[0].success).toBe(true);
            expect(result.files[1].success).toBe(false);
            expect(result.files[1].error).toBeTruthy();
        });
    });
    describe('WriteFile Tool', () => {
        it('should write content to file', async () => {
            const testFile = join(testDir, 'output.txt');
            const { WriteFileTool } = await import('../../source/tools/system/WriteFileTool.js');
            const tool = new WriteFileTool();
            const result = await tool.execute({
                path: testFile,
                content: 'Hello World',
            });
            expect(result.success).toBe(true);
            expect(result.path).toBe(testFile);
            // Verify file was written
            const fs = await import('fs/promises');
            const content = await fs.readFile(testFile, 'utf-8');
            expect(content).toBe('Hello World');
        });
        it('should create directories if needed', async () => {
            const testFile = join(testDir, 'nested', 'deep', 'file.txt');
            const { WriteFileTool } = await import('../../source/tools/system/WriteFileTool.js');
            const tool = new WriteFileTool();
            const result = await tool.execute({
                path: testFile,
                content: 'nested content',
                createDirs: true,
            });
            expect(result.success).toBe(true);
            // Verify file exists
            const fs = await import('fs/promises');
            const content = await fs.readFile(testFile, 'utf-8');
            expect(content).toBe('nested content');
        });
    });
});
//# sourceMappingURL=FileSystemTools.test.js.map