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
        setupGameCenter()
    }
    
    private func setupMessageHandlers() {
        guard let webView = webView else { return }
        
        // Native message handlers
        webView.configuration.userContentController.add(self, name: "nativeHaptic")
        webView.configuration.userContentController.add(self, name: "nativeSave")
        webView.configuration.userContentController.add(self, name: "nativeLoad")
        webView.configuration.userContentController.add(self, name: "nativeShare")
        
        // Game Center message handlers
        webView.configuration.userContentController.add(self, name: "gcAuthenticate")
        webView.configuration.userContentController.add(self, name: "gcSubmitScore")
        webView.configuration.userContentController.add(self, name: "gcReportAchievement")
        webView.configuration.userContentController.add(self, name: "gcShowLeaderboard")
        webView.configuration.userContentController.add(self, name: "gcShowAchievements")
        webView.configuration.userContentController.add(self, name: "gcLoadFriends")
        
        // Inject bridge script
        injectBridgeScript()
    }
    
    private func setupGameCenter() {
        // Authenticate with Game Center
        GameCenterManager.shared.authenticatePlayer { [weak self] success in
            self?.notifyGameCenterStatus(authenticated: success)
        }
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
            },
            // Game Center integration
            gameCenter: {
                isAvailable: true,
                isAuthenticated: false,
                playerInfo: null,
                authenticate: function() {
                    window.webkit.messageHandlers.gcAuthenticate.postMessage({});
                },
                submitScore: function(score, leaderboardID) {
                    window.webkit.messageHandlers.gcSubmitScore.postMessage({
                        score: score,
                        leaderboardID: leaderboardID || 'com.voidrift.highscore'
                    });
                },
                reportAchievement: function(identifier, percentComplete) {
                    window.webkit.messageHandlers.gcReportAchievement.postMessage({
                        identifier: identifier,
                        percentComplete: percentComplete || 100
                    });
                },
                showLeaderboard: function(leaderboardID) {
                    window.webkit.messageHandlers.gcShowLeaderboard.postMessage({
                        leaderboardID: leaderboardID || null
                    });
                },
                showAchievements: function() {
                    window.webkit.messageHandlers.gcShowAchievements.postMessage({});
                },
                loadFriends: function(callback) {
                    window._gcFriendsCallback = callback;
                    window.webkit.messageHandlers.gcLoadFriends.postMessage({});
                }
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
        // Game Center handlers
        case "gcAuthenticate":
            handleGameCenterAuthenticate()
        case "gcSubmitScore":
            handleGameCenterSubmitScore(message.body)
        case "gcReportAchievement":
            handleGameCenterReportAchievement(message.body)
        case "gcShowLeaderboard":
            handleGameCenterShowLeaderboard(message.body)
        case "gcShowAchievements":
            handleGameCenterShowAchievements()
        case "gcLoadFriends":
            handleGameCenterLoadFriends()
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
    
    // MARK: - Game Center Handlers
    
    private func handleGameCenterAuthenticate() {
        GameCenterManager.shared.authenticatePlayer { [weak self] success in
            self?.notifyGameCenterStatus(authenticated: success)
        }
    }
    
    private func handleGameCenterSubmitScore(_ body: Any) {
        guard let data = body as? [String: Any],
              let score = data["score"] as? Int,
              let leaderboardID = data["leaderboardID"] as? String else {
            return
        }
        
        GameCenterManager.shared.submitScore(score, to: leaderboardID)
    }
    
    private func handleGameCenterReportAchievement(_ body: Any) {
        guard let data = body as? [String: Any],
              let identifier = data["identifier"] as? String else {
            return
        }
        
        let percentComplete = data["percentComplete"] as? Double ?? 100.0
        GameCenterManager.shared.reportAchievement(identifier: identifier, percentComplete: percentComplete)
    }
    
    private func handleGameCenterShowLeaderboard(_ body: Any) {
        let data = body as? [String: Any]
        let leaderboardID = data?["leaderboardID"] as? String
        GameCenterManager.shared.showLeaderboard(leaderboardID)
    }
    
    private func handleGameCenterShowAchievements() {
        GameCenterManager.shared.showAchievements()
    }
    
    private func handleGameCenterLoadFriends() {
        GameCenterManager.shared.loadFriends { [weak self] players in
            let friends = players?.map { player in
                return [
                    "alias": player.alias,
                    "playerID": player.gamePlayerID
                ]
            } ?? []
            
            self?.notifyGameCenterFriends(friends)
        }
    }
    
    private func notifyGameCenterStatus(authenticated: Bool) {
        var playerInfo = "null"
        if authenticated, let info = GameCenterManager.shared.getPlayerInfo() {
            playerInfo = """
            {
                "alias": "\(info.alias)",
                "playerID": "\(info.playerID)"
            }
            """
        }
        
        let script = """
        if (window.iOSBridge && window.iOSBridge.gameCenter) {
            window.iOSBridge.gameCenter.isAuthenticated = \(authenticated);
            window.iOSBridge.gameCenter.playerInfo = \(playerInfo);
            
            // Notify the game
            if (typeof window.onGameCenterAuthChanged === 'function') {
                window.onGameCenterAuthChanged(\(authenticated), \(playerInfo));
            }
        }
        console.log('Game Center authentication status: \(authenticated)');
        """
        
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
    
    private func notifyGameCenterFriends(_ friends: [[String: String]]) {
        let jsonData = try? JSONSerialization.data(withJSONObject: friends)
        let jsonString = jsonData.flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        
        let script = """
        if (window._gcFriendsCallback) {
            window._gcFriendsCallback(\(jsonString));
            window._gcFriendsCallback = null;
        }
        """
        
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
}
