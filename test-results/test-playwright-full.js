const { chromium } = require('playwright');
const path = require('path');

const TEST_RESULTS_DIR = '/Users/satonodoka/Documents/job-seiri/test-results';

async function takeScreenshot(page, name) {
    const filePath = path.join(TEST_RESULTS_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved: ${filePath}`);
    return filePath;
}

async function main() {
    console.log('='.repeat(60));
    console.log('Job Seiri UI Test');
    console.log('='.repeat(60));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        // Filter out verbose logs
        if (!text.includes('React DevTools') && !text.includes('Firebase Config')) {
            console.log(`Console [${msg.type()}]: ${text.substring(0, 200)}`);
        }
    });

    const issues = [];

    try {
        // Step 1: Navigate to app
        console.log('\n=== Step 1: Navigate to localhost:3000 ===');
        await page.goto('http://localhost:3000', { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await takeScreenshot(page, 'test-01-login-page');

        console.log(`URL: ${page.url()}`);
        console.log(`Title: ${await page.title()}`);

        // Step 2: Try login with test account (create one if needed)
        console.log('\n=== Step 2: Attempt Login ===');

        const testEmail = 'test@example.com';
        const testPassword = 'testpassword123';

        // Check if login form exists
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const loginButton = page.locator('button:has-text("ログイン")');

        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            console.log('Login form detected');

            // First try to create an account
            const createAccountLink = page.locator('a:has-text("アカウントを作成"), button:has-text("アカウントを作成")');
            if (await createAccountLink.count() > 0) {
                console.log('Clicking "Create Account" link...');
                await createAccountLink.first().click();
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                await page.waitForTimeout(1000);
                await takeScreenshot(page, 'test-02-register-page');

                // Fill registration form
                const regEmailInput = page.locator('input[type="email"]');
                const regPasswordInput = page.locator('input[type="password"]');

                if (await regEmailInput.count() > 0) {
                    await regEmailInput.first().fill(testEmail);
                    await regPasswordInput.first().fill(testPassword);

                    // Try to register
                    const registerButton = page.locator('button:has-text("登録"), button:has-text("作成"), button[type="submit"]');
                    if (await registerButton.count() > 0) {
                        await registerButton.first().click();
                        await page.waitForTimeout(3000);
                        await takeScreenshot(page, 'test-03-after-register');
                    }
                }
            }

            // Check if we're still on login page or dashboard
            const currentUrl = page.url();
            console.log(`Current URL after registration attempt: ${currentUrl}`);

            // If still on login/register page, try to login
            if (await page.locator('input[type="email"]').count() > 0) {
                console.log('Still on auth page, attempting login...');

                // Go back to login if needed
                const loginLink = page.locator('a:has-text("ログイン"), button:has-text("ログインはこちら")');
                if (await loginLink.count() > 0) {
                    await loginLink.first().click();
                    await page.waitForTimeout(1000);
                }

                // Fill login form
                await page.locator('input[type="email"]').first().fill(testEmail);
                await page.locator('input[type="password"]').first().fill(testPassword);
                await takeScreenshot(page, 'test-04-login-filled');

                // Click login
                const loginBtn = page.locator('button:has-text("ログイン")');
                if (await loginBtn.count() > 0) {
                    await loginBtn.first().click();
                    await page.waitForTimeout(3000);
                    await takeScreenshot(page, 'test-05-after-login');
                }
            }
        }

        // Step 3: Check dashboard
        console.log('\n=== Step 3: Analyze Dashboard ===');
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await page.waitForTimeout(2000);

        const pageText = await page.locator('body').innerText();
        console.log('\nPage content (first 500 chars):');
        console.log(pageText.substring(0, 500));

        await takeScreenshot(page, 'test-06-dashboard');

        // Check for JobCards
        console.log('\n=== Step 4: Check JobCard Display ===');

        // Based on JobCard.tsx, cards have role="button" and specific structure
        const jobCards = page.locator('[role="button"][aria-expanded]');
        const jobCardCount = await jobCards.count();
        console.log(`JobCards found: ${jobCardCount}`);

        if (jobCardCount > 0) {
            console.log('\nAnalyzing JobCard content...');

            for (let i = 0; i < Math.min(5, jobCardCount); i++) {
                const card = jobCards.nth(i);
                const cardText = await card.innerText();
                console.log(`\n--- Card ${i + 1} ---`);
                console.log(cardText.substring(0, 300));

                // Check for expected format: "Company: Position"
                const h3 = card.locator('h3');
                if (await h3.count() > 0) {
                    const titleText = await h3.first().innerText();
                    console.log(`Title: ${titleText}`);

                    // Check format
                    if (titleText.includes('：')) {
                        console.log('Format OK: "Company : Position" format');
                    } else if (titleText === '無題' || titleText.length < 5) {
                        issues.push(`Card ${i + 1}: Title appears empty or default ("${titleText}")`);
                        console.log('WARNING: Title may be missing or default');
                    }
                }

                // Check for salary badge
                const salaryBadge = card.locator('.bg-blue-100');
                if (await salaryBadge.count() > 0) {
                    const salaryText = await salaryBadge.first().innerText();
                    console.log(`Salary: ${salaryText}`);
                } else {
                    console.log('Salary: Not displayed');
                }

                // Check for URL/domain
                const domain = card.locator('.text-slate-500.truncate');
                if (await domain.count() > 0) {
                    const domainText = await domain.first().innerText();
                    console.log(`URL domain: ${domainText}`);
                }
            }

            // Step 5: Expand cards
            console.log('\n=== Step 5: Expand JobCards ===');

            for (let i = 0; i < Math.min(3, jobCardCount); i++) {
                const card = jobCards.nth(i);
                const isExpanded = await card.getAttribute('aria-expanded');

                if (isExpanded === 'false') {
                    console.log(`Clicking card ${i + 1} to expand...`);
                    await card.click();
                    await page.waitForTimeout(500);
                }
            }

            await takeScreenshot(page, 'test-07-cards-expanded');

            // Check expanded content
            console.log('\n=== Step 6: Check Expanded Content ===');

            for (let i = 0; i < Math.min(3, jobCardCount); i++) {
                const card = jobCards.nth(i);
                const isExpanded = await card.getAttribute('aria-expanded');

                if (isExpanded === 'true') {
                    console.log(`\n--- Expanded Card ${i + 1} ---`);

                    // Check for "元ページを開く" button
                    const openButton = card.locator('a:has-text("元ページを開く")');
                    const disabledButton = card.locator('button:has-text("元ページを開く（URLなし）")');

                    if (await openButton.count() > 0) {
                        const href = await openButton.first().getAttribute('href');
                        console.log(`URL button: OK (href=${href?.substring(0, 50)}...)`);

                        // Validate URL
                        try {
                            new URL(href);
                            console.log('URL validation: OK');
                        } catch (e) {
                            issues.push(`Card ${i + 1}: Invalid URL - "${href}"`);
                            console.log(`URL validation: FAILED - ${href}`);
                        }
                    } else if (await disabledButton.count() > 0) {
                        issues.push(`Card ${i + 1}: URL is missing or invalid`);
                        console.log('URL button: DISABLED (URL missing)');
                    }

                    // Check for job description
                    const jobDescription = card.locator('h4:has-text("職務内容")');
                    if (await jobDescription.count() > 0) {
                        console.log('Job description: Found');
                    }

                    // Check for required person
                    const requiredPerson = card.locator('h4:has-text("求める人物像")');
                    if (await requiredPerson.count() > 0) {
                        console.log('Required person: Found');
                    }
                }
            }
        } else {
            // Check if there's a message about no jobs
            if (pageText.includes('まだ求人が登録されていません')) {
                console.log('Dashboard shows: No jobs registered yet');
                issues.push('No jobs in database to test');
            } else if (pageText.includes('読み込み中')) {
                console.log('Dashboard shows: Still loading...');
                // Wait more
                await page.waitForTimeout(5000);
                await takeScreenshot(page, 'test-06-dashboard-waited');
            } else if (pageText.includes('ログイン')) {
                console.log('Still on login page - authentication may have failed');
                issues.push('Could not authenticate - still on login page');
            }
        }

        // Final screenshot
        await takeScreenshot(page, 'test-08-final');

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));

        if (issues.length === 0) {
            console.log('All checks passed!');
        } else {
            console.log(`Issues found: ${issues.length}`);
            issues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }

    } catch (e) {
        console.error('\nError during test:', e.message);
        await takeScreenshot(page, 'test-error');
    } finally {
        await browser.close();
        console.log('\nBrowser closed');
    }
}

main().catch(console.error);
