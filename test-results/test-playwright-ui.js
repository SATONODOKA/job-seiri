const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TEST_RESULTS_DIR = '/Users/satonodoka/Documents/job-seiri/test-results';

async function takeScreenshot(page, name) {
    const filePath = path.join(TEST_RESULTS_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved: ${filePath}`);
    return filePath;
}

async function main() {
    console.log('Starting Playwright test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));

    try {
        console.log('\n=== Step 1: Navigate to localhost:3000 ===');
        await page.goto('http://localhost:3000', { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Take initial screenshot
        await takeScreenshot(page, '01-initial-page');

        console.log(`Current URL: ${page.url()}`);
        console.log(`Page title: ${await page.title()}`);

        console.log('\n=== Step 2: Check for Login Page ===');

        // Look for login elements
        const loginButtonCount = await page.locator('button:has-text("ログイン"), button:has-text("Login"), button:has-text("Sign in")').count();
        const emailCount = await page.locator('input[type="email"], input[name="email"]').count();
        const passwordCount = await page.locator('input[type="password"], input[name="password"]').count();
        const googleCount = await page.locator('button:has-text("Google"), button:has-text("Googleでログイン")').count();

        console.log(`Login button found: ${loginButtonCount > 0}`);
        console.log(`Email input found: ${emailCount > 0}`);
        console.log(`Password input found: ${passwordCount > 0}`);
        console.log(`Google login found: ${googleCount > 0}`);

        if (googleCount > 0) {
            console.log('\nGoogle login button detected - this is a Firebase Auth login page');
            await takeScreenshot(page, '02-login-page-google-auth');
            console.log('Note: Cannot automate Google OAuth login without test credentials');
        } else if (emailCount > 0 && passwordCount > 0) {
            console.log('\nEmail/Password login form detected');
            await takeScreenshot(page, '02-login-page-email');

            const testEmail = process.env.TEST_EMAIL || '';
            const testPassword = process.env.TEST_PASSWORD || '';

            if (testEmail && testPassword) {
                console.log('Attempting login with test credentials...');
                await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
                await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);

                if (loginButtonCount > 0) {
                    await page.locator('button:has-text("ログイン"), button:has-text("Login"), button:has-text("Sign in")').first().click();
                    await page.waitForLoadState('networkidle', { timeout: 30000 });
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, '03-after-login');
                }
            } else {
                console.log('No test credentials provided (TEST_EMAIL, TEST_PASSWORD)');
            }
        } else {
            console.log('\nNo login form detected - might already be on dashboard');
        }

        console.log('\n=== Step 3: Analyze Current Page Content ===');

        // Look for JobCard elements
        const jobCardCount = await page.locator('[class*="job"], [class*="Job"], [data-testid*="job"]').count();
        console.log(`Job card elements found: ${jobCardCount}`);

        const companyCount = await page.locator('h2, h3, [class*="company"], [class*="title"]').count();
        console.log(`Potential company/title elements: ${companyCount}`);

        await takeScreenshot(page, '03-current-page-state');

        // Get all text content for analysis
        const bodyText = await page.locator('body').innerText();
        console.log('\n=== Page Text Content Preview (first 2000 chars) ===');
        console.log(bodyText.substring(0, 2000));

        console.log('\n=== Step 4: Look for JobCards with Specific Elements ===');

        const selectorsToTry = [
            'div.border',
            'div.rounded',
            'article',
            "[role='listitem']",
            'div.p-4',
            'div.shadow',
            'div.bg-white',
        ];

        for (const selector of selectorsToTry) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                console.log(`'${selector}': ${count} elements found`);
            }
        }

        console.log('\n=== Step 5: Check for Expandable Cards ===');

        const expandButtonCount = await page.locator('button:has-text("詳細"), button:has-text("展開"), button:has-text("expand"), [class*="expand"], [class*="accordion"]').count();
        console.log(`Expand buttons found: ${expandButtonCount}`);

        const clickableCount = await page.locator('div[role="button"], button[class*="card"], div.cursor-pointer').count();
        console.log(`Clickable elements found: ${clickableCount}`);

        // Try to expand cards by clicking on them
        if (expandButtonCount > 0) {
            console.log('\nAttempting to expand cards...');
            const expandButtons = page.locator('button:has-text("詳細"), button:has-text("展開"), button:has-text("expand")');
            const count = await expandButtons.count();
            for (let i = 0; i < Math.min(3, count); i++) {
                try {
                    await expandButtons.nth(i).click();
                    await page.waitForTimeout(500);
                } catch (e) {
                    console.log(`Error clicking expand button ${i}: ${e.message}`);
                }
            }
            await takeScreenshot(page, '04-cards-expanded');
        } else if (clickableCount > 0) {
            console.log('\nAttempting to click cards to expand...');
            const clickables = page.locator('div.cursor-pointer');
            const count = await clickables.count();
            let clicked = 0;
            for (let i = 0; i < Math.min(5, count); i++) {
                try {
                    const element = clickables.nth(i);
                    if (await element.isVisible()) {
                        await element.click();
                        await page.waitForTimeout(300);
                        clicked++;
                        if (clicked >= 3) break;
                    }
                } catch (e) {
                    console.log(`Error clicking element ${i}: ${e.message}`);
                }
            }
            if (clicked > 0) {
                await takeScreenshot(page, '04-after-clicking-cards');
            }
        }

        console.log('\n=== Step 6: Detailed Element Analysis ===');

        const htmlContent = await page.content();

        const patternsToCheck = [
            ['Company format (社名：)', htmlContent.includes('社名：') || htmlContent.includes('社名:')],
            ['Salary display (万円/年収)', htmlContent.includes('万円') || htmlContent.includes('年収')],
            ['URL links', htmlContent.includes('href=') && (htmlContent.includes('https://') || htmlContent.includes('http://'))],
            ['Position/role (ポジション/職種)', htmlContent.includes('ポジション') || htmlContent.includes('職種')],
        ];

        for (const [name, found] of patternsToCheck) {
            console.log(`${name}: ${found ? 'Found' : 'Not found'}`);
        }

        await takeScreenshot(page, '05-final-state');

        console.log('\n=== Test Complete ===');
        console.log(`Screenshots saved to: ${TEST_RESULTS_DIR}`);

    } catch (e) {
        console.error('Error during test:', e.message);
        await takeScreenshot(page, 'error-state');
    } finally {
        await browser.close();
        console.log('Browser closed');
    }
}

main().catch(console.error);
