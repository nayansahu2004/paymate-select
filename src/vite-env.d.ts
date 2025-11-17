interface ImportMetaEnv {
    readonly VITE_API_BASE: string;
    readonly VITE_APP_BASE_URL?: string;
    // add other VITE_... vars you use, readonly
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }