// Import the defineConfig function from Vite, which provides type assistance and structured configuration.
import { defineConfig } from 'vite'

// Import the React plugin for Vite to enable React-specific features such as fast refresh.
import react from '@vitejs/plugin-react'

// Export the configuration using defineConfig, which helps with type inference and ensures the config follows Vite's standards.
export default defineConfig({
  // Plugins array where we include the React plugin.
  plugins: [
    react() // Activate the React plugin with its default configuration.
  ],
  // Server configuration options that apply to the Vite development server.
  server: {
    // allowedHosts defines an array of hostnames that are permitted to access the dev server.
    allowedHosts: [
      'localhost',         // Allow access from the local machine.
      '163.172.111.148',   // Allow access via your VPS IP address.
      'tetriseed.xyz',     // Allow access through your custom domain.
      'www.tetriseed.xyz'  // Allow access through the www subdomain.
    ],
    // Proxy configuration to forward API calls to another server.
    proxy: {
      '/api': { // Any request starting with /api will be proxied.
        target: 'http://localhost:5172', // The backend server to which the API calls are forwarded.
        changeOrigin: true, // Modify the origin header to match the target, ensuring compatibility with the backend server.
      }
    }
  }
})
