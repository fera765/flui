/**
 * EditText Tool - Replace text in files
 * Executes only in automation sandbox
 */

import { readFile, writeFile } from 'fs/promises';

export interface EditTextParams {
  path: string;
  find: string;
  replace: string;
  regex?: boolean;
  replaceAll?: boolean;
  caseInsensitive?: boolean;
}

export interface EditTextResult {
  success: boolean;
  replacements?: number;
  preview?: string;
  error?: string;
}

export class EditTextTool {
  async execute(params: EditTextParams): Promise<EditTextResult> {
    try {
      const content = await readFile(params.path, 'utf-8');
      
      let newContent: string;
      let replacements = 0;

      if (params.regex) {
        const flags = params.replaceAll
          ? (params.caseInsensitive ? 'gi' : 'g')
          : (params.caseInsensitive ? 'i' : '');
        
        const pattern = new RegExp(params.find, flags);
        
        newContent = content.replace(pattern, (match) => {
          replacements++;
          return params.replace;
        });
      } else {
        if (params.replaceAll) {
          const searchStr = params.caseInsensitive 
            ? params.find.toLowerCase()
            : params.find;
          
          let tempContent = content;
          let index = params.caseInsensitive
            ? tempContent.toLowerCase().indexOf(searchStr)
            : tempContent.indexOf(params.find);

          newContent = content;
          
          while (index !== -1) {
            newContent = newContent.substring(0, index) + 
                        params.replace + 
                        newContent.substring(index + params.find.length);
            
            replacements++;
            
            tempContent = newContent;
            const searchFrom = index + params.replace.length;
            
            index = params.caseInsensitive
              ? tempContent.toLowerCase().indexOf(searchStr, searchFrom)
              : tempContent.indexOf(params.find, searchFrom);
          }
        } else {
          const index = params.caseInsensitive
            ? content.toLowerCase().indexOf(params.find.toLowerCase())
            : content.indexOf(params.find);
          
          if (index !== -1) {
            newContent = content.substring(0, index) + 
                        params.replace + 
                        content.substring(index + params.find.length);
            replacements = 1;
          } else {
            newContent = content;
          }
        }
      }

      await writeFile(params.path, newContent, 'utf-8');

      return {
        success: true,
        replacements,
        preview: newContent.substring(0, 200),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
