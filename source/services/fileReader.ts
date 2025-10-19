import { readFile as fsReadFile } from 'fs/promises';
import { parse as csvParse } from 'csv-parse/sync';

export interface FileContent {
  type: 'text' | 'json' | 'csv' | 'binary';
  content: string | any[] | Buffer;
  encoding?: string;
  metadata?: {
    rows?: number;
    columns?: string[];
    size?: number;
  };
}

export class FileReader {
  async readFile(filePath: string): Promise<FileContent> {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'json':
      case 'yaml':
      case 'yml':
        return await this.readTextFile(filePath);
      
      case 'csv':
        return await this.readCSVFile(filePath);
      
      case 'xlsx':
      case 'xls':
        return await this.readExcelFile(filePath);
      
      case 'pdf':
        return await this.readPDFFile(filePath);
      
      case 'docx':
      case 'doc':
        return await this.readDocxFile(filePath);
      
      default:
        return await this.readBinaryFile(filePath);
    }
  }

  private async readTextFile(filePath: string): Promise<FileContent> {
    try {
      const content = await fsReadFile(filePath, 'utf-8');
      const extension = filePath.split('.').pop()?.toLowerCase();
      
      if (extension === 'json') {
        try {
          const parsed = JSON.parse(content);
          return {
            type: 'json',
            content: parsed,
            encoding: 'utf-8',
          };
        } catch {
          // Se falhar o parse, retorna como texto
        }
      }
      
      return {
        type: 'text',
        content,
        encoding: 'utf-8',
        metadata: {
          size: content.length,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo de texto: ${error.message}`);
    }
  }

  private async readCSVFile(filePath: string): Promise<FileContent> {
    try {
      const content = await fsReadFile(filePath, 'utf-8');
      const records = csvParse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      
      const columns = records.length > 0 ? Object.keys(records[0]) : [];
      
      return {
        type: 'csv',
        content: records,
        encoding: 'utf-8',
        metadata: {
          rows: records.length,
          columns,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo CSV: ${error.message}`);
    }
  }

  private async readExcelFile(filePath: string): Promise<FileContent> {
    try {
      // Importação dinâmica para evitar erro se não instalado
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      
      // Pegar primeira planilha
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const data = XLSX.utils.sheet_to_json(sheet);
      const columns = data.length > 0 ? Object.keys(data[0] as any) : [];
      
      return {
        type: 'csv', // Tratamos como CSV depois da conversão
        content: data,
        metadata: {
          rows: data.length,
          columns,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo Excel: ${error.message}. Instale: npm install xlsx`);
    }
  }

  private async readPDFFile(filePath: string): Promise<FileContent> {
    try {
      // Importação dinâmica
      const pdfParse = await import('pdf-parse');
      const buffer = await fsReadFile(filePath);
      // @ts-ignore - pdf-parse não tem types oficiais
      const data = await pdfParse.default(buffer);
      
      return {
        type: 'text',
        content: data.text,
        metadata: {
          size: data.text.length,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo PDF: ${error.message}. Instale: npm install pdf-parse`);
    }
  }

  private async readDocxFile(filePath: string): Promise<FileContent> {
    try {
      // Importação dinâmica
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        type: 'text',
        content: result.value,
        metadata: {
          size: result.value.length,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo DOCX: ${error.message}. Instale: npm install mammoth`);
    }
  }

  private async readBinaryFile(filePath: string): Promise<FileContent> {
    try {
      const buffer = await fsReadFile(filePath);
      
      return {
        type: 'binary',
        content: buffer,
        metadata: {
          size: buffer.length,
        },
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo binário: ${error.message}`);
    }
  }

  async readContactsFromFile(filePath: string): Promise<Array<{ email: string; name?: string; [key: string]: any }>> {
    const fileContent = await this.readFile(filePath);
    
    if (fileContent.type === 'csv' && Array.isArray(fileContent.content)) {
      // Assumir que CSV tem colunas 'email' e 'name'
      return fileContent.content.map((row: any) => ({
        email: row.email || row.Email || row.EMAIL || '',
        name: row.name || row.Name || row.NAME || row.nome || row.Nome,
        ...row,
      })).filter((contact) => contact.email);
    }
    
    if (fileContent.type === 'json') {
      const data = fileContent.content as any;
      if (Array.isArray(data)) {
        return data;
      }
      if (data.contacts && Array.isArray(data.contacts)) {
        return data.contacts;
      }
    }
    
    throw new Error('Formato de arquivo não suportado para contatos');
  }
}

export const createFileReader = (): FileReader => {
  return new FileReader();
};
