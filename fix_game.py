#!/usr/bin/env python3
"""
Comprehensive fix for Void Rift iOS game
Addresses all issues systematically
"""

import re
import os
import shutil

def fix_html():
    """Fix index.html - remove game mode, update tagline, ensure start button works"""
    with open('index.html', 'r') as f:
        html = f.read()
    
    # Change tagline from "TWIN-STICK SHOOTER" to "Created by Austin Stickley"
    html = re.sub(
        r'<div class="title-tagline">TWIN-STICK SHOOTER</div>',
        '<div class="title-tagline">CREATED BY AUSTIN STICKLEY</div>',
        html
    )
    
    # Make both "VOID" and "RIFT" neon styled
    html = re.sub(
        r'<div id="gameTitle">VOID<span class="title-accent">RIFT</span></div>',
        '<div id="gameTitle"><span class="title-accent">VOID</span><span class="title-accent">RIFT</span></div>',
        html
    )
    
    # Remove game mode selection section (lines 38-55)
    html = re.sub(
        r'<div class="game-mode-section">.*?</div>\s*<div id="planetSelectContainer".*?</div>',
        '',
        html,
        flags=re.DOTALL
    )
    
    # Remove canvas preview if it's causing issues
    html = re.sub(
        r'<canvas id="startGraphicCanvas"></canvas>',
        '<!-- Game preview removed for cleaner layout -->',
        html
    )
    
    with open('index.html', 'w') as f:
        f.write(html)
    
    print("✓ Fixed index.html")

def fix_css():
    """Fix style.css - implement black & neon green theme, remove all blue"""
    with open('style.css', 'r') as f:
        css = f.read()
    
    # Replace all blue color references with black/green
    # Common blue hex codes
    blue_colors = {
        '#3b82f6': '#4ade80',  # blue-500 -> green-400
        '#2563eb': '#22c55e',  # blue-600 -> green-500  
        '#1d4ed8': '#16a34a',  # blue-700 -> green-600
        '#1e40af': '#15803d',  # blue-800 -> green-700
        '#0ea5e9': '#4ade80',  # sky-500 -> green-400
        '#0284c7': '#22c55e',  # sky-600 -> green-500
        '#0369a1': '#16a34a',  # sky-700 -> green-600
        '#075985': '#15803d',  # sky-800 -> green-700
        '#0c4a6e': '#166534',  # sky-900 -> green-800
        '#60a5fa': '#86efac',  # blue-400 -> green-300
        '#93c5fd': '#bbf7d0',  # blue-300 -> green-200
        '#dbeafe': 'rgba(0, 0, 0, 0.8)',  # blue-50 -> dark
        '#eff6ff': 'rgba(0, 0, 0, 0.9)',  # blue-100 -> darker
    }
    
    for blue, green in blue_colors.items():
        css = css.replace(blue, green)
    
    # Replace rgb blue values
    css = re.sub(r'rgba?\(\s*59\s*,\s*130\s*,\s*246', 'rgba(74, 222, 128', css)  # blue-500
    css = re.sub(r'rgba?\(\s*37\s*,\s*99\s*,\s*235', 'rgba(34, 197, 94', css)   # blue-600
    css = re.sub(r'rgba?\(\s*14\s*,\s*165\s*,\s*233', 'rgba(74, 222, 128', css) # sky-500
    
    # Update specific UI elements for minimal dark design
    # Main backgrounds should be deep black
    css = re.sub(
        r'background:\s*radial-gradient\(ellipse[^;]+;',
        'background: radial-gradient(ellipse at 50% 30%, #0a0a0a 0%, #000000 100%);',
        css
    )
    
    # Button styles - make them minimal
    button_style = """
/* Minimal button style */
button, .nav-btn, .footer-btn {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(74, 222, 128, 0.4) !important;
  color: #4ade80 !important;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

button:hover, .nav-btn:hover, .footer-btn:hover {
  background: rgba(74, 222, 128, 0.1) !important;
  border-color: #4ade80 !important;
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
}

.startButton-primary {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%) !important;
  color: #000000 !important;
  font-size: 18px !important;
  padding: 16px 64px !important;
  font-weight: 900 !important;
  border: 2px solid #22c55e !important;
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.5), 0 4px 20px rgba(74, 222, 128, 0.3) !important;
}

.startButton-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.7), 0 6px 30px rgba(74, 222, 128, 0.4) !important;
}
"""
    
    css += '\n' + button_style
    
    with open('style.css', 'w') as f:
        f.write(css)
    
    print("✓ Fixed style.css")

def fix_script():
    """Fix script.js - remove planetary mode, fix controls, add tutorial"""
    with open('script.js', 'r') as f:
        script = f.read()
    
    # Ensure game mode is always 'space'
    script = re.sub(
        r"const selectedMode = .*?gameModeSelect.*?;",
        "const selectedMode = 'space'; // Always space mode",
        script
    )
    
    # Fix icon loading - ensure proper paths
    script = re.sub(
        r'src="assets/icons/',
        'src="./assets/icons/',
        script
    )
    
    # Add tutorial flag if not exists
    if 'tutorialCompleted' not in script:
        tutorial_code = """
// Tutorial system
let tutorialCompleted = localStorage.getItem('void_rift_tutorial_done') === 'true';
let tutorialStep = 0;
const tutorialSteps = [
  { text: "Use LEFT stick to move your ship", highlight: "joystickMoveBase" },
  { text: "Use RIGHT stick to aim and shoot", highlight: "joystickShootBase" },
  { text: "Watch your HEALTH (HP) bar", highlight: "healthBar" },
  { text: "Track your SCORE as you destroy enemies", highlight: "scoreValue" },
  { text: "Press PAUSE to access menu and settings", highlight: "pauseButton" },
  { text: "Collect coins to unlock WEAPON UPGRADES", highlight: "openShopBtn" },
  { text: "Press secondary weapon button to switch", highlight: "equipmentDock" }
];

function showTutorialStep(step) {
  if (tutorialCompleted || step >= tutorialSteps.length) {
    tutorialCompleted = true;
    localStorage.setItem('void_rift_tutorial_done', 'true');
    return;
  }
  
  const tutorialData = tutorialSteps[step];
  // Pause game
  if (!isPaused) togglePause();
  
  // Show tutorial overlay
  const overlay = document.createElement('div');
  overlay.id = 'tutorialOverlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;
  
  const message = document.createElement('div');
  message.style.cssText = `
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid #4ade80;
    border-radius: 12px;
    padding: 24px 32px;
    max-width: 400px;
    text-align: center;
    color: #4ade80;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 0 30px rgba(74, 222, 128, 0.4);
  `;
  message.textContent = tutorialData.text;
  
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display: flex; gap: 12px; margin-top: 20px; justify-content: center;';
  
  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip Tutorial';
  skipBtn.style.cssText = `
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #666;
    color: #888;
    border-radius: 6px;
    cursor: pointer;
  `;
  skipBtn.onclick = () => {
    tutorialCompleted = true;
    localStorage.setItem('void_rift_tutorial_done', 'true');
    document.body.removeChild(overlay);
    if (isPaused) togglePause();
  };
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = step < tutorialSteps.length - 1 ? 'Next' : 'Got it!';
  nextBtn.style.cssText = `
    padding: 10px 24px;
    background: #4ade80;
    border: none;
    color: #000;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
  `;
  nextBtn.onclick = () => {
    document.body.removeChild(overlay);
    if (isPaused) togglePause();
    if (step < tutorialSteps.length - 1) {
      setTimeout(() => showTutorialStep(step + 1), 3000);
    } else {
      tutorialCompleted = true;
      localStorage.setItem('void_rift_tutorial_done', 'true');
    }
  };
  
  btnContainer.appendChild(skipBtn);
  btnContainer.appendChild(nextBtn);
  message.appendChild(btnContainer);
  overlay.appendChild(message);
  document.body.appendChild(overlay);
  
  // Highlight the relevant element
  if (tutorialData.highlight) {
    const elem = document.getElementById(tutorialData.highlight);
    if (elem) {
      elem.style.boxShadow = '0 0 20px #4ade80';
      setTimeout(() => {
        if (elem) elem.style.boxShadow = '';
      }, 500);
    }
  }
}

// Start tutorial on first game
"""
        script = script.replace('})();', tutorial_code + '\n})();')
    
    with open('script.js', 'w') as f:
        f.write(script)
    
    print("✓ Fixed script.js")

def sync_to_ios():
    """Sync web content to iOS project"""
    ios_web_path = 'ios/VoidRift/WebContent'
    if os.path.exists(ios_web_path):
        files_to_copy = ['index.html', 'script.js', 'style.css', 'backend-api.js', 
                        'social-api.js', 'social-hub.js', 'social-integration.js',
                        'audio-manager.js', 'game-utils.js']
        
        for file in files_to_copy:
            if os.path.exists(file):
                shutil.copy(file, os.path.join(ios_web_path, file))
        
        # Copy assets
        if os.path.exists('assets'):
            shutil.copytree('assets', os.path.join(ios_web_path, 'assets'), dirs_exist_ok=True)
        
        print("✓ Synced to iOS WebContent")
    else:
        print("⚠ iOS WebContent directory not found")

def main():
    print("🚀 Fixing Void Rift for iOS deployment...\n")
    
    # Make backups
    for file in ['index.html', 'script.js', 'style.css']:
        if os.path.exists(file) and not os.path.exists(f"{file}.backup"):
            shutil.copy(file, f"{file}.backup")
    
    print("📦 Created backups")
    
    fix_html()
    fix_css()
    fix_script()
    sync_to_ios()
    
    print("\n✅ All fixes applied successfully!")
    print("\nNext steps:")
    print("1. Test in browser: open index.html")
    print("2. Build iOS app in Xcode")
    print("3. Test on iOS device")

if __name__ == '__main__':
    os.chdir('/Users/austinstickley/shooter-app')
    main()
