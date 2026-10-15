/// <reference types="vite/client" />

interface ImportMetaEnv {
        // Define your environment variables here
        // For example, if you use VITE_API_URL:
        // readonly VITE_API_URL: string;

        // Add other variables as needed
}

interface ImportMeta {
        readonly env: ImportMetaEnv;
}