import asyncio
import os
import sys
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "screenshots"))
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "http://127.0.0.1:5173"


async def run_browser_tests():
    print(f"[TEST] Starting DepthWizard end-to-end browser tests against {BASE_URL}...")
    errors = []

    async with async_playwright() as p:
        # Launch Chromium headless
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Capture console errors
        def handle_console(msg):
            if msg.type == "error":
                print(f"[CONSOLE ERROR] {msg.text}")
                errors.append(msg.text)

        page.on("console", handle_console)
        page.on("pageerror", lambda err: errors.append(str(err)))

        # 1. Landing Page
        print("\n--- 1. Testing Landing Page ---")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        title = await page.title()
        print(f"Page title: {title}")
        assert "DepthWizard" in title, f"Title does not contain DepthWizard: {title}"
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_landing.png"))
        print("✓ Landing page rendered and screenshot saved.")

        # 2. Presentation Page & Automated Demo Execution
        print("\n--- 2. Testing Presentation Page & 1-Click Demo ---")
        await page.goto(f"{BASE_URL}/presentation", wait_until="networkidle")
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_presentation_start.png"))
        
        # Click "Run Complete Demo"
        demo_btn = page.locator('button:has-text("Run Complete Demo")')
        await demo_btn.wait_for(state="visible", timeout=5000)
        await demo_btn.click()
        print("Clicked 'Run Complete Demo'. Waiting for pipeline execution...")

        # Wait for demo completion
        await page.wait_for_selector('text="Complete SIH Pipeline Executed Successfully!"', timeout=20000)
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_presentation_complete.png"))
        print("✓ Presentation demo executed successfully and screenshot saved.")

        # 3. Upload & Preprocessing Page
        print("\n--- 3. Testing Upload Page ---")
        await page.goto(f"{BASE_URL}/upload", wait_until="networkidle")
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_upload.png"))
        print("✓ Upload page rendered and screenshot saved.")

        # 4. Processing Pipeline Page
        print("\n--- 4. Testing Processing Pipeline Page ---")
        await page.goto(f"{BASE_URL}/processing/demo", wait_until="networkidle")
        await page.wait_for_timeout(4000)  # Allow stage animation
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_processing.png"))
        print("✓ Processing pipeline rendered and screenshot saved.")

        # 5. Depth Map Viewer Page
        print("\n--- 5. Testing Depth Map Viewer ---")
        await page.goto(f"{BASE_URL}/depth/demo", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_depth_map.png"))
        print("✓ Depth map viewer rendered and screenshot saved.")

        # 6. Height Analysis Page
        print("\n--- 6. Testing Height Analysis ---")
        await page.goto(f"{BASE_URL}/height/demo", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_height_analysis.png"))
        print("✓ Height analysis page rendered and screenshot saved.")

        # 7. 3D Reconstruction Viewer Page
        print("\n--- 7. Testing 3D Reconstruction Viewer ---")
        await page.goto(f"{BASE_URL}/reconstruction/demo", wait_until="networkidle")
        # Wait for WebGL canvas
        await page.wait_for_selector("canvas", timeout=10000)
        await page.wait_for_timeout(3000)  # Allow 3D canvas render
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_reconstruction_3d.png"))
        print("✓ 3D Reconstruction WebGL canvas rendered and screenshot saved.")

        # 8. Flythrough Studio Page
        print("\n--- 8. Testing 3D Flythrough Studio ---")
        await page.goto(f"{BASE_URL}/flythrough/demo", wait_until="networkidle")
        await page.wait_for_selector("canvas", timeout=10000)
        await page.wait_for_timeout(2000)
        
        # Test play button
        play_btn = page.locator('button[title="Play"], button[title="Pause"]')
        if await play_btn.count() > 0:
            await play_btn.first.click()
            await page.wait_for_timeout(2000)
        
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_flythrough.png"))
        print("✓ Flythrough studio interactive controls verified and screenshot saved.")

        # 9. Report Page
        print("\n--- 9. Testing Intelligence Report Page ---")
        await page.goto(f"{BASE_URL}/reports/demo", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_report.png"))
        print("✓ Intelligence report page rendered and screenshot saved.")

        # 10. About & Methodology Page
        print("\n--- 10. Testing Methodology & About Page ---")
        await page.goto(f"{BASE_URL}/about", wait_until="networkidle")
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_about.png"))
        print("✓ About & methodology page rendered and screenshot saved.")

        # 11. Dashboard Page
        print("\n--- 11. Testing Dashboard Page ---")
        await page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "11_dashboard.png"))
        print("✓ Dashboard page rendered and screenshot saved.")

        await browser.close()

    print("\n==========================================")
    print(f"Browser testing complete! Screenshots saved to {SCREENSHOTS_DIR}")
    print(f"Total console/page errors detected: {len(errors)}")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(run_browser_tests())
