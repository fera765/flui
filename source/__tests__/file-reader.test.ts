import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createFileReader } from '../services/fileReader';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

describe('File Reader Tests', () => {
  let testDir: string;
  let fileReader: ReturnType<typeof createFileReader>;

  beforeEach(async () => {
    testDir = join(tmpdir(), 'flui-test-files', nanoid());
    await mkdir(testDir, { recursive: true });
    fileReader = createFileReader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Text Files', () => {
    it('should read TXT file', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello World!';
      await writeFile(filePath, content);

      const result = await fileReader.readFile(filePath);

      expect(result.type).toBe('text');
      expect(result.content).toBe(content);
      expect(result.encoding).toBe('utf-8');
    });

    it('should read JSON file', async () => {
      const filePath = join(testDir, 'test.json');
      const data = { name: 'Test', value: 123 };
      await writeFile(filePath, JSON.stringify(data));

      const result = await fileReader.readFile(filePath);

      expect(result.type).toBe('json');
      expect(result.content).toEqual(data);
    });
  });

  describe('CSV Files', () => {
    it('should read CSV file', async () => {
      const filePath = join(testDir, 'contacts.csv');
      const csvContent = `email,name
john@example.com,John Doe
jane@example.com,Jane Smith`;
      await writeFile(filePath, csvContent);

      const result = await fileReader.readFile(filePath);

      expect(result.type).toBe('csv');
      expect(Array.isArray(result.content)).toBe(true);
      expect((result.content as any[]).length).toBe(2);
      expect(result.metadata?.rows).toBe(2);
      expect(result.metadata?.columns).toContain('email');
      expect(result.metadata?.columns).toContain('name');
    });

    it('should extract contacts from CSV', async () => {
      const filePath = join(testDir, 'contacts.csv');
      const csvContent = `email,name
john@example.com,John Doe
jane@example.com,Jane Smith`;
      await writeFile(filePath, csvContent);

      const contacts = await fileReader.readContactsFromFile(filePath);

      expect(contacts.length).toBe(2);
      expect(contacts[0].email).toBe('john@example.com');
      expect(contacts[0].name).toBe('John Doe');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent file', async () => {
      const filePath = join(testDir, 'non-existent.txt');

      await expect(fileReader.readFile(filePath)).rejects.toThrow();
    });
  });
});
