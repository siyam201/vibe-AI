import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileEntry {
  file: string;
  data: string;
}

// Default Vite + React + TypeScript project files
const getDefaultProjectFiles = (appName: string) => ({
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'package.json': JSON.stringify({
    name: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview"
    },
    dependencies: {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.30.1",
      "zustand": "^4.5.0"
    },
    devDependencies: {
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.0",
      "typescript": "^5.5.0",
      "vite": "^5.4.0"
    }
  }, null, 2),
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})`,
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] }
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  }, null, 2),
  'tsconfig.node.json': JSON.stringify({
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: "ESNext",
      moduleResolution: "bundler",
      allowSyntheticDefaultImports: true,
      strict: true
    },
    include: ["vite.config.ts"]
  }, null, 2),
  'src/vite-env.d.ts': `/// <reference types="vite/client" />`,
  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
  'src/App.tsx': `import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App`,
  'src/routes/index.tsx': `import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}`,
  'src/pages/Home.tsx': `export default function Home() {
  return (
    <div className="container">
      <h1>Welcome</h1>
      <p>Your app is ready!</p>
    </div>
  )
}`,
  'src/styles/index.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0a0a0a;
  color: #fafafa;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}`,
  'src/store/index.ts': `import { create } from 'zustand'

interface AppState {
  count: number
  increment: () => void
}

export const useStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))`,
  'src/types/index.ts': `export interface User {
  id: string
  name: string
  email: string
}`,
  'src/hooks/useApp.ts': `import { useStore } from '../store'

export function useApp() {
  const { count, increment } = useStore()
  return { count, increment }
}`,
  'src/lib/utils.ts': `export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}`,
  'src/services/api.ts': `const API_URL = import.meta.env.VITE_API_URL || ''

export async function fetchData<T>(endpoint: string): Promise<T> {
  const res = await fetch(\`\${API_URL}\${endpoint}\`)
  if (!res.ok) throw new Error('Fetch failed')
  return res.json()
}`,
  'src/utils/helpers.ts': `export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date)
}`,
  'src/components/common/.gitkeep': '',
  'src/components/layout/.gitkeep': '',
  'src/components/auth/.gitkeep': '',
  'public/vite.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#41d1ff" d="M15.9 1.1 1.4 4.2l2.5 21.3L15.9 31l12-5.5 2.5-21.3z"/></svg>`,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN');

    if (!VERCEL_TOKEN) {
      throw new Error('VERCEL_TOKEN is not configured');
    }

    const body = await req.json();
    const { appName, htmlContent, files: inputFiles, useDefaultStructure = true } = body;

    if (!appName) {
      throw new Error('appName is required');
    }

    console.log(`Deploying app: ${appName}`);

    const safeProjectName = appName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    const deployFiles: FileEntry[] = [];

    // Start with default structure if requested
    if (useDefaultStructure) {
      const defaultFiles = getDefaultProjectFiles(appName);
      for (const [filePath, content] of Object.entries(defaultFiles)) {
        deployFiles.push({ file: filePath, data: content });
      }
      console.log(`Added ${Object.keys(defaultFiles).length} default project files`);
    }

    // Override/add with input files
    if (inputFiles && typeof inputFiles === 'object') {
      console.log(`Processing ${Object.keys(inputFiles).length} custom files...`);
      
      for (const [filePath, content] of Object.entries(inputFiles)) {
        if (typeof content === 'string') {
          const normalizedPath = filePath.replace(/^\/+/, '');
          // Remove existing file with same path
          const existingIdx = deployFiles.findIndex(f => f.file === normalizedPath);
          if (existingIdx !== -1) {
            deployFiles.splice(existingIdx, 1);
          }
          deployFiles.push({ file: normalizedPath, data: content });
          console.log(`Added/Updated file: ${normalizedPath}`);
        }
      }
    } else if (htmlContent && !useDefaultStructure) {
      // Fallback for simple HTML deployment
      const fullHtml = htmlContent.includes('<!DOCTYPE') 
        ? htmlContent 
        : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;

      deployFiles.push({ file: 'index.html', data: fullHtml });
    }

    // Ensure vercel.json for SPA routing
    const hasVercelConfig = deployFiles.some(f => f.file === 'vercel.json');
    if (!hasVercelConfig) {
      deployFiles.push({
        file: 'vercel.json',
        data: JSON.stringify({
          version: 2,
          buildCommand: "npm run build",
          outputDirectory: "dist",
          framework: "vite",
          rewrites: [{ source: '/(.*)', destination: '/index.html' }],
        }, null, 2),
      });
    }

    console.log(`Total files to deploy: ${deployFiles.length}`);

    const deployUrl = 'https://api.vercel.com/v13/deployments';

    console.log('Sending deployment request to Vercel...');

    const deployResponse = await fetch(deployUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeProjectName,
        files: deployFiles,
        projectSettings: {
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
        },
        target: 'production',
      }),
    });

    const deployData = await deployResponse.json();

    if (!deployResponse.ok) {
      console.error('Vercel API Error:', JSON.stringify(deployData));
      throw new Error(deployData.error?.message || 'Failed to deploy to Vercel');
    }

    console.log('Deployment successful:', deployData.url);

    return new Response(JSON.stringify({
      success: true,
      url: `https://${deployData.url}`,
      deploymentId: deployData.id,
      projectName: safeProjectName,
      readyState: deployData.readyState,
      filesCount: deployFiles.length,
      structure: useDefaultStructure ? 'vite-react-ts' : 'custom',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Vercel Deploy Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
