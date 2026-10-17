import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser', workers:1, timeout:30000,
  use:{baseURL:process.env.E2E_BASE_URL || 'http://localhost:8889', headless:true},
});
