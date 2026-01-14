#!/usr/bin/env python3
"""
Playwright test script for job-seiri application.
Tests login flow, dashboard, and JobCard display.
"""

from playwright.sync_api import sync_playwright
import os
import time
import sys

# Test results directory
TEST_RESULTS_DIR = "/Users/satonodoka/Documents/job-seiri/test-results"

def take_screenshot(page, name):
    """Take a screenshot and save it to test-results directory."""
    path = os.path.join(TEST_RESULTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"Screenshot saved: {path}")
    return path

def main():
    print("Starting Playwright test...")
    print(f"Python version: {sys.version}")

    with sync_playwright() as p:
        print("Launching browser...")
        try:
            browser = p.chromium.launch(headless=True)
            print("Browser launched successfully")
        except Exception as e:
            print(f"Error launching browser: {e}")
            # Try with firefox as fallback
            print("Trying Firefox...")
            try:
                browser = p.firefox.launch(headless=True)
                print("Firefox launched successfully")
            except Exception as e2:
                print(f"Error launching Firefox: {e2}")
                return

        try:
            context = browser.new_context(viewport={"width": 1280, "height": 900})
            page = context.new_page()

            # Enable console logging
            page.on("console", lambda msg: print(f"Console [{msg.type}]: {msg.text}"))

            print("\n=== Step 1: Navigate to localhost:3000 ===")
            page.goto("http://localhost:3000", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)

            # Take initial screenshot
            take_screenshot(page, "01-initial-page")

            # Check current URL and page title
            print(f"Current URL: {page.url}")
            print(f"Page title: {page.title()}")

            # Check if we're on a login page
            page_content = page.content()

            print("\n=== Step 2: Check for Login Page ===")

            # Look for login elements
            login_button = page.locator('button:has-text("ログイン"), button:has-text("Login"), button:has-text("Sign in")')
            email_input = page.locator('input[type="email"], input[name="email"]')
            password_input = page.locator('input[type="password"], input[name="password"]')
            google_login = page.locator('button:has-text("Google"), button:has-text("Googleでログイン")')

            login_button_count = login_button.count()
            email_count = email_input.count()
            password_count = password_input.count()
            google_count = google_login.count()

            print(f"Login button found: {login_button_count > 0}")
            print(f"Email input found: {email_count > 0}")
            print(f"Password input found: {password_count > 0}")
            print(f"Google login found: {google_count > 0}")

            if google_count > 0:
                print("\nGoogle login button detected - this is a Firebase Auth login page")
                take_screenshot(page, "02-login-page-google-auth")
                print("Note: Cannot automate Google OAuth login without test credentials")
            elif email_count > 0 and password_count > 0:
                print("\nEmail/Password login form detected")
                take_screenshot(page, "02-login-page-email")

                # Try to login with test credentials (if available)
                test_email = os.environ.get("TEST_EMAIL", "")
                test_password = os.environ.get("TEST_PASSWORD", "")

                if test_email and test_password:
                    print(f"Attempting login with test credentials...")
                    email_input.first.fill(test_email)
                    password_input.first.fill(test_password)

                    if login_button_count > 0:
                        login_button.first.click()
                        page.wait_for_load_state("networkidle", timeout=30000)
                        time.sleep(2)
                        take_screenshot(page, "03-after-login")
                else:
                    print("No test credentials provided (TEST_EMAIL, TEST_PASSWORD)")
            else:
                print("\nNo login form detected - might already be on dashboard")

            print("\n=== Step 3: Analyze Current Page Content ===")

            # Look for JobCard elements
            job_cards = page.locator('[class*="job"], [class*="Job"], [data-testid*="job"]')
            job_card_count = job_cards.count()
            print(f"Job card elements found: {job_card_count}")

            # Look for company names
            company_elements = page.locator('h2, h3, [class*="company"], [class*="title"]')
            company_count = company_elements.count()
            print(f"Potential company/title elements: {company_count}")

            # Take screenshot of current state
            take_screenshot(page, "03-current-page-state")

            # Get all text content for analysis
            body_text = page.locator("body").inner_text()
            print(f"\n=== Page Text Content Preview (first 2000 chars) ===")
            print(body_text[:2000] if len(body_text) > 2000 else body_text)

            print("\n=== Step 4: Look for JobCards with Specific Elements ===")

            # Try different selectors for job cards
            selectors_to_try = [
                "div.border",
                "div.rounded",
                "article",
                "[role='listitem']",
                "div.p-4",
                "div.shadow",
                "div.bg-white",
            ]

            for selector in selectors_to_try:
                elements = page.locator(selector)
                count = elements.count()
                if count > 0:
                    print(f"'{selector}': {count} elements found")

            print("\n=== Step 5: Check for Expandable Cards ===")

            # Look for expand/collapse buttons
            expand_buttons = page.locator('button:has-text("詳細"), button:has-text("展開"), button:has-text("expand"), [class*="expand"], [class*="accordion"]')
            expand_count = expand_buttons.count()
            print(f"Expand buttons found: {expand_count}")

            # Look for clickable card headers
            clickable_headers = page.locator('div[role="button"], button[class*="card"], div.cursor-pointer')
            clickable_count = clickable_headers.count()
            print(f"Clickable elements found: {clickable_count}")

            # If we found expandable elements, try clicking them
            if expand_count > 0:
                print("\nAttempting to expand cards...")
                for i in range(min(3, expand_count)):
                    try:
                        expand_buttons.nth(i).click()
                        time.sleep(0.5)
                    except Exception as e:
                        print(f"Error clicking expand button {i}: {e}")

                take_screenshot(page, "04-cards-expanded")
            elif clickable_count > 0:
                print("\nAttempting to click cards to expand...")
                clicked = 0
                for i in range(min(5, clickable_count)):
                    try:
                        element = clickable_headers.nth(i)
                        if element.is_visible():
                            element.click()
                            time.sleep(0.3)
                            clicked += 1
                            if clicked >= 3:
                                break
                    except Exception as e:
                        print(f"Error clicking element {i}: {e}")

                if clicked > 0:
                    take_screenshot(page, "04-after-clicking-cards")

            print("\n=== Step 6: Detailed Element Analysis ===")

            html_content = page.content()

            patterns_to_check = [
                ("Company format", "社名：" in html_content or "社名:" in html_content),
                ("Salary display", "万円" in html_content or "年収" in html_content),
                ("URL links", "href=" in html_content and ("https://" in html_content or "http://" in html_content)),
                ("Position/role", "ポジション" in html_content or "職種" in html_content),
            ]

            for name, found in patterns_to_check:
                print(f"{name}: {'Found' if found else 'Not found'}")

            # Final screenshot
            take_screenshot(page, "05-final-state")

            print("\n=== Test Complete ===")
            print(f"Screenshots saved to: {TEST_RESULTS_DIR}")

        except Exception as e:
            print(f"Error during test: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
            print("Browser closed")

if __name__ == "__main__":
    main()
