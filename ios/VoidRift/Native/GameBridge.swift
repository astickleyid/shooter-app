import UIKit
import WebKit

class GameBridge: NSObject {
    
    private weak var webView: WKWebView?
    var onOrientationChange: ((UIDeviceOrientation) -> Void)?
    
    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        setupMessageHandlers()
        setupOrientationObserver()
    }
    
    private func setupMessageHandlers() {
        guard let webView = webView else { return }
        
        // Native message handlers
        webView.configuration.userContentController.add(self, name: "nativeHaptic")
        webView.configuration.userContentController.add(self, name: "nativeSave")
        webView.configuration.userContentController.add(self, name: "nativeLoad")
        webView.configuration.userContentController.add(self, name: "nativeShare")
        
        // Inject bridge script
        injectBridgeScript()
    }
    
    private func injectBridgeScript() {
        let bridgeScript = """
        // iOS Native Bridge
        window.iOSBridge = {
            haptic: function(style) {
                window.webkit.messageHandlers.nativeHaptic.postMessage(style);
            },
            save: function(data) {
                window.webkit.messageHandlers.nativeSave.postMessage(data);
            },
            load: function() {
                window.webkit.messageHandlers.nativeLoad.postMessage({});
            },
            share: function(data) {
                window.webkit.messageHandlers.nativeShare.postMessage(data);
            },
            getOrientation: function() {
                return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
            }
        };
        
        // Override haptic feedback for iOS
        if (typeof triggerHapticFeedback !== 'undefined') {
            const originalHaptic = triggerHapticFeedback;
            triggerHapticFeedback = function(style) {
                window.iOSBridge.haptic(style || 'medium');
                originalHaptic(style);
            };
        }
        
        console.log('✅ iOS Bridge initialized');
        """
        
        let script = WKUserScript(source: bridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        webView?.configuration.userContentController.addUserScript(script)
    }
    
    private func setupOrientationObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(orientationDidChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
    }
    
    @objc private func orientationDidChange() {
        let orientation = UIDevice.current.orientation
        onOrientationChange?(orientation)
        
        // Notify web game
        let script = """
        if (typeof window.onOrientationChange === 'function') {
            window.onOrientationChange('\(orientation.isLandscape ? "landscape" : "portrait")');
        }
        """
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - WKScriptMessageHandler

extension GameBridge: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "nativeHaptic":
            handleHaptic(message.body)
        case "nativeSave":
            handleSave(message.body)
        case "nativeLoad":
            handleLoad()
        case "nativeShare":
            handleShare(message.body)
        default:
            break
        }
    }
    
    private func handleHaptic(_ body: Any) {
        let style = body as? String ?? "medium"
        
        let generator: UIImpactFeedbackGenerator
        switch style {
        case "light":
            generator = UIImpactFeedbackGenerator(style: .light)
        case "heavy":
            generator = UIImpactFeedbackGenerator(style: .heavy)
        case "soft":
            if #available(iOS 13.0, *) {
                generator = UIImpactFeedbackGenerator(style: .soft)
            } else {
                generator = UIImpactFeedbackGenerator(style: .light)
            }
        case "rigid":
            if #available(iOS 13.0, *) {
                generator = UIImpactFeedbackGenerator(style: .rigid)
            } else {
                generator = UIImpactFeedbackGenerator(style: .heavy)
            }
        default:
            generator = UIImpactFeedbackGenerator(style: .medium)
        }
        
        generator.prepare()
        generator.impactOccurred()
    }
    
    private func handleSave(_ body: Any) {
        guard let dataString = body as? String else { return }
        UserDefaults.standard.set(dataString, forKey: "VoidRiftGameData")
        UserDefaults.standard.synchronize()
        print("✅ Game data saved")
    }
    
    private func handleLoad() {
        if let savedData = UserDefaults.standard.string(forKey: "VoidRiftGameData") {
            let script = """
            if (typeof loadGameData === 'function') {
                loadGameData(\(savedData));
            }
            """
            webView?.evaluateJavaScript(script, completionHandler: nil)
            print("✅ Game data loaded")
        }
    }
    
    private func handleShare(_ body: Any) {
        guard let shareData = body as? [String: Any],
              let text = shareData["text"] as? String else { return }
        
        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.webView else { return }
            
            let activityVC = UIActivityViewController(
                activityItems: [text],
                applicationActivities: nil
            )
            
            if let presenting = webView.window?.rootViewController {
                activityVC.popoverPresentationController?.sourceView = webView
                presenting.present(activityVC, animated: true)
            }
        }
    }
}
