/**
 * Mock implementation of conf module for testing
 */

class MockConf {
  private store = new Map<string, any>();
  public path: string;
  
  constructor(options?: any) {
    this.path = options?.cwd 
      ? `${options.cwd}/${options.configName || 'config'}.json` 
      : '/tmp/test-config.json';
  }
  
  get(key: string, defaultValue?: any) {
    return this.store.has(key) ? this.store.get(key) : defaultValue;
  }
  
  set(key: string, value: any) {
    this.store.set(key, value);
  }
  
  delete(key: string) {
    this.store.delete(key);
  }
  
  clear() {
    this.store.clear();
  }
  
  has(key: string) {
    return this.store.has(key);
  }
}

export default MockConf;
