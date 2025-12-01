import UIKit
import WebKit

class GameViewController: UIViewController {
    
    private var webView: WKWebView!
    private var gameBridge: GameBridge!
    private var tutorialOverlay: TutorialOverlay?
    private var orientationManager: OrientationManager!
    
    private var hasShownTutorial: Bool {
        get { UserDefaults.standard.bool(forKey: "hasCompletedTutorial") }
        set { UserDefaults.standard.set(newValue, forKey: "hasCompletedTutorial") }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupBridge()
        setupOrientationManager()
        loadGame()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Show tutorial on first launch (with longer delay to ensure game fully loads)
        if !hasShownTutorial {
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) { [weak self] in
                print("🎓 Attempting to show tutorial...")
                self?.showTutorial()
            }
        } else {
            print("ℹ️ Tutorial already completed")
        }
    }
    
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        // Performance optimizations
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        view.addSubview(webView)
    }
    
    private func setupBridge() {
        gameBridge = GameBridge(webView: webView)
        gameBridge.onOrientationChange = { [weak self] orientation in
            self?.handleOrientationChange(orientation)
        }
    }
    
    private func setupOrientationManager() {
        orientationManager = OrientationManager(webView: webView)
    }
    
    private func loadGame() {
        guard let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "WebContent") else {
            print("❌ Could not find index.html")
            return
        }
        
        let htmlURL = URL(fileURLWithPath: htmlPath)
        let htmlDirectory = htmlURL.deletingLastPathComponent()
        
        do {
            var htmlContent = try String(contentsOf: htmlURL, encoding: .utf8)
            
            // IMPORTANT: Remove game mode selector - space mode only!
            htmlContent = removeGameModeSelector(from: htmlContent)
            
            webView.loadHTMLString(htmlContent, baseURL: htmlDirectory)
            print("✅ Game loaded successfully")
        } catch {
            print("❌ Error loading game: \(error)")
        }
    }
    
    private func removeGameModeSelector(from html: String) -> String {
        var modified = html
        
        // Hide mode selection UI
        let hideScript = """
        <script>
        window.addEventListener('DOMContentLoaded', function() {
            // Force space mode only
            if (typeof setGameMode === 'function') {
                setGameMode('space');
            }
            
            // Hide mode selector if it exists
            const modeSelector = document.querySelector('.mode-selector, #modeSelector, .game-mode-selector');
            if (modeSelector) {
                modeSelector.style.display = 'none';
            }
            
            // Auto-start with space mode
            if (typeof gameState !== 'undefined') {
                gameState.mode = 'space';
            }
        });
        </script>
        """
        
        // Insert before closing head tag
        if let headEndRange = modified.range(of: "</head>") {
            modified.insert(contentsOf: hideScript, at: headEndRange.lowerBound)
        }
        
        return modified
    }
    
    private func showTutorial() {
        tutorialOverlay = TutorialOverlay(frame: view.bounds, webView: webView)
        tutorialOverlay?.delegate = self
        
        if let tutorial = tutorialOverlay {
            view.addSubview(tutorial)
            tutorial.start()
        }
    }
    
    private func handleOrientationChange(_ orientation: UIDeviceOrientation) {
        orientationManager.updateLayout(for: orientation)
        
        // Notify web game of orientation change
        let script = """
        if (typeof handleOrientationChange === 'function') {
            handleOrientationChange('\(orientation.isLandscape ? "landscape" : "portrait")');
        }
        """
        webView.evaluateJavaScript(script, completionHandler: nil)
    }
    
    // MARK: - Orientation Support
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .all  // Support all orientations
    }
    
    override var shouldAutorotate: Bool {
        return true
    }
    
    override var prefersStatusBarHidden: Bool {
        return true  // Hide status bar for immersive gameplay
    }
    
    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        
        coordinator.animate { [weak self] _ in
            self?.orientationManager.updateLayout(for: UIDevice.current.orientation)
        }
    }
}

// MARK: - Tutorial Overlay Delegate

extension GameViewController: TutorialOverlayDelegate {
    func tutorialDidComplete() {
        hasShownTutorial = true
        tutorialOverlay?.removeFromSuperview()
        tutorialOverlay = nil
    }
    
    func tutorialDidSkip() {
        hasShownTutorial = true
        tutorialOverlay?.removeFromSuperview()
        tutorialOverlay = nil
    }
}

