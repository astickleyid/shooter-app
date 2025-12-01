import UIKit
import WebKit

class OrientationManager {
    
    private weak var webView: WKWebView?
    private var currentOrientation: UIDeviceOrientation = .portrait
    
    init(webView: WKWebView) {
        self.webView = webView
        setupOrientationObserver()
        updateLayout(for: UIDevice.current.orientation)
    }
    
    private func setupOrientationObserver() {
        NotificationCenter.default.addObserver(
            forName: UIDevice.orientationDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleOrientationChange()
        }
    }
    
    private func handleOrientationChange() {
        let newOrientation = UIDevice.current.orientation
        guard newOrientation != currentOrientation else { return }
        
        currentOrientation = newOrientation
        updateLayout(for: newOrientation)
    }
    
    func updateLayout(for orientation: UIDeviceOrientation) {
        guard let webView = webView else { return }
        
        let isLandscape = orientation.isLandscape
        let isPortrait = orientation.isPortrait
        
        // Inject CSS and JavaScript to handle orientation
        let orientationScript = """
        (function() {
            const isLandscape = \(isLandscape ? "true" : "false");
            const isPortrait = \(isPortrait ? "true" : "false");
            
            // Update body class for orientation-specific CSS
            document.body.classList.remove('orientation-portrait', 'orientation-landscape');
            document.body.classList.add('orientation-' + (isLandscape ? 'landscape' : 'portrait'));
            
            // Update CSS variables for responsive layouts
            document.documentElement.style.setProperty('--is-landscape', isLandscape ? '1' : '0');
            document.documentElement.style.setProperty('--is-portrait', isPortrait ? '1' : '0');
            
            // Adjust joystick positions for orientation
            adjustControlsForOrientation(isLandscape);
            
            // Adjust HUD layout
            adjustHUDForOrientation(isLandscape);
            
            // Notify game of orientation change
            if (typeof window.onOrientationChange === 'function') {
                window.onOrientationChange(isLandscape ? 'landscape' : 'portrait');
            }
            
            console.log('📱 Orientation updated:', isLandscape ? 'landscape' : 'portrait');
        })();
        
        // Helper function to adjust controls
        function adjustControlsForOrientation(isLandscape) {
            const leftJoystick = document.querySelector('.joystick-left, #leftJoystick');
            const rightJoystick = document.querySelector('.joystick-right, #rightJoystick');
            
            if (isLandscape) {
                // Landscape: Traditional twin-stick layout
                if (leftJoystick) {
                    leftJoystick.style.left = '60px';
                    leftJoystick.style.bottom = '60px';
                    leftJoystick.style.transform = 'scale(1)';
                }
                if (rightJoystick) {
                    rightJoystick.style.right = '60px';
                    rightJoystick.style.bottom = '60px';
                    rightJoystick.style.transform = 'scale(1)';
                }
            } else {
                // Portrait: Adjusted positions to avoid overlap
                if (leftJoystick) {
                    leftJoystick.style.left = '40px';
                    leftJoystick.style.bottom = '120px';
                    leftJoystick.style.transform = 'scale(0.9)';
                }
                if (rightJoystick) {
                    rightJoystick.style.right = '40px';
                    rightJoystick.style.bottom = '120px';
                    rightJoystick.style.transform = 'scale(0.9)';
                }
            }
        }
        
        // Helper function to adjust HUD
        function adjustHUDForOrientation(isLandscape) {
            const healthBar = document.querySelector('.health-bar, #healthBar');
            const scoreDisplay = document.querySelector('.score-display, #scoreDisplay');
            const pauseButton = document.querySelector('.pause-button, #pauseButton');
            const weaponDisplay = document.querySelector('.weapon-display, #weaponDisplay');
            
            if (isLandscape) {
                // Landscape: Spread out HUD for better visibility
                if (healthBar) {
                    healthBar.style.top = '20px';
                    healthBar.style.left = '20px';
                    healthBar.style.width = '200px';
                }
                if (scoreDisplay) {
                    scoreDisplay.style.top = '20px';
                    scoreDisplay.style.left = '50%';
                    scoreDisplay.style.transform = 'translateX(-50%)';
                }
                if (pauseButton) {
                    pauseButton.style.top = '20px';
                    pauseButton.style.right = '20px';
                }
                if (weaponDisplay) {
                    weaponDisplay.style.top = '70px';
                    weaponDisplay.style.right = '20px';
                }
            } else {
                // Portrait: Compact layout to maximize play area
                if (healthBar) {
                    healthBar.style.top = '15px';
                    healthBar.style.left = '15px';
                    healthBar.style.width = '150px';
                }
                if (scoreDisplay) {
                    scoreDisplay.style.top = '15px';
                    scoreDisplay.style.right = '15px';
                    scoreDisplay.style.left = 'auto';
                    scoreDisplay.style.transform = 'none';
                }
                if (pauseButton) {
                    pauseButton.style.top = '60px';
                    pauseButton.style.right = '15px';
                }
                if (weaponDisplay) {
                    weaponDisplay.style.top = '110px';
                    weaponDisplay.style.right = '15px';
                }
            }
            
            // Ensure no overlap by checking positions
            preventUIOverlap();
        }
        
        // Prevent UI overlap
        function preventUIOverlap() {
            const elements = document.querySelectorAll('.hud-element, .ui-element, .control-element');
            const positions = new Map();
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const id = el.id || el.className;
                positions.set(id, rect);
            });
            
            // Check for overlaps and adjust if needed
            positions.forEach((rect1, id1) => {
                positions.forEach((rect2, id2) => {
                    if (id1 !== id2 && rectsOverlap(rect1, rect2)) {
                        console.warn('UI overlap detected between', id1, 'and', id2);
                        // Add small offset to prevent overlap
                        const el = document.getElementById(id2) || document.querySelector('.' + id2);
                        if (el && el.style.top) {
                            const currentTop = parseInt(el.style.top) || 0;
                            el.style.top = (currentTop + 50) + 'px';
                        }
                    }
                });
            });
        }
        
        function rectsOverlap(rect1, rect2) {
            return !(rect1.right < rect2.left ||
                    rect1.left > rect2.right ||
                    rect1.bottom < rect2.top ||
                    rect1.top > rect2.bottom);
        }
        """
        
        webView.evaluateJavaScript(orientationScript) { result, error in
            if let error = error {
                print("❌ Orientation script error: \(error)")
            } else {
                print("✅ Layout updated for \(isLandscape ? "landscape" : "portrait")")
            }
        }
        
        // Inject additional CSS for responsive design
        injectResponsiveCSS(isLandscape: isLandscape)
    }
    
    private func injectResponsiveCSS(isLandscape: Bool) {
        guard let webView = webView else { return }
        
        let cssScript = """
        (function() {
            // Remove existing responsive style if present
            const existingStyle = document.getElementById('ios-responsive-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Create new style element
            const style = document.createElement('style');
            style.id = 'ios-responsive-style';
            style.textContent = `
                /* iOS Responsive Styles */
                body.orientation-portrait {
                    --joystick-size: 100px;
                    --hud-scale: 0.9;
                    --button-spacing: 10px;
                }
                
                body.orientation-landscape {
                    --joystick-size: 110px;
                    --hud-scale: 1.0;
                    --button-spacing: 15px;
                }
                
                /* Prevent UI overlap */
                .hud-element, .ui-element {
                    z-index: 1000;
                    pointer-events: auto;
                }
                
                /* Ensure controls are accessible */
                .joystick-container {
                    z-index: 999;
                    pointer-events: auto;
                }
                
                /* Responsive canvas sizing */
                canvas {
                    max-width: 100%;
                    max-height: 100%;
                }
                
                /* Portrait-specific adjustments */
                body.orientation-portrait .game-container {
                    padding-top: 80px;
                    padding-bottom: 180px;
                }
                
                body.orientation-portrait .weapon-selector {
                    max-width: 90%;
                    margin: 0 auto;
                }
                
                /* Landscape-specific adjustments */
                body.orientation-landscape .game-container {
                    padding-top: 70px;
                    padding-bottom: 140px;
                    padding-left: 150px;
                    padding-right: 150px;
                }
                
                /* Smooth transitions */
                .joystick-left, .joystick-right,
                .health-bar, .score-display,
                .pause-button, .weapon-display {
                    transition: all 0.3s ease-out;
                }
            `;
            
            document.head.appendChild(style);
            console.log('✅ Responsive CSS injected');
        })();
        """
        
        webView.evaluateJavaScript(cssScript, completionHandler: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
