// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/playwright-html' }]],
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'node index.js',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 30000,
    },
});
