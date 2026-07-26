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

        // AdMob message handlers
        webView.configuration.userContentController.add(self, name: "adPreloadRewarded")
        webView.configuration.userContentController.add(self, name: "adShowRewarded")

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
            // AdMob ads integration
            ads: {
                preloadRewarded: function() {
                    window.webkit.messageHandlers.adPreloadRewarded.postMessage({});
                },
                showRewarded: function() {
                    window.webkit.messageHandlers.adShowRewarded.postMessage({});
                }
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
                    // Use callback registry to avoid race conditions
                    if (!window._gcCallbacks) {
                        window._gcCallbacks = { nextId: 1, callbacks: {} };
                    }
                    const callbackId = window._gcCallbacks.nextId++;
                    window._gcCallbacks.callbacks[callbackId] = callback;
                    window.webkit.messageHandlers.gcLoadFriends.postMessage({ callbackId: callbackId });
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
            handleGameCenterLoadFriends(message.body)
        // AdMob handlers
        case "adPreloadRewarded":
            AdMobManager.shared.preloadRewarded()
        case "adShowRewarded":
            handleAdShowRewarded()
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
    
    // MARK: - AdMob Handlers

    private func handleAdShowRewarded() {
        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.webView,
                  let presenting = webView.window?.rootViewController else { return }

            AdMobManager.shared.showRewarded(from: presenting) { [weak self] rewarded in
                let js = rewarded
                    ? "window.dispatchEvent(new CustomEvent('adRewarded', {detail:{type:'coins',amount:1}}));"
                    : "window.dispatchEvent(new CustomEvent('adClosed'));"
                self?.webView?.evaluateJavaScript(js, completionHandler: nil)
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
        guard let data = body as? [String: Any] else { return }

        // JS numbers arrive as NSNumber — accept Int/Double/String
        let score: Int
        if let n = data["score"] as? Int {
            score = n
        } else if let n = data["score"] as? Double {
            score = Int(n)
        } else if let n = data["score"] as? NSNumber {
            score = n.intValue
        } else if let s = data["score"] as? String, let n = Int(s) {
            score = n
        } else {
            print("⚠️ gcSubmitScore: invalid score payload \(data)")
            return
        }

        let leaderboardID = (data["leaderboardID"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedID = (leaderboardID?.isEmpty == false) ? leaderboardID! : "com.voidrift.highscore"

        DispatchQueue.main.async {
            GameCenterManager.shared.submitScore(score, to: resolvedID)
        }
    }
    
    private func handleGameCenterReportAchievement(_ body: Any) {
        guard let data = body as? [String: Any],
              let identifier = data["identifier"] as? String else {
            return
        }

        let percentComplete: Double
        if let p = data["percentComplete"] as? Double {
            percentComplete = p
        } else if let p = data["percentComplete"] as? Int {
            percentComplete = Double(p)
        } else if let p = data["percentComplete"] as? NSNumber {
            percentComplete = p.doubleValue
        } else {
            percentComplete = 100.0
        }

        DispatchQueue.main.async {
            GameCenterManager.shared.reportAchievement(identifier: identifier, percentComplete: percentComplete)
        }
    }
    
    private func handleGameCenterShowLeaderboard(_ body: Any) {
        let data = body as? [String: Any]
        var leaderboardID = data?["leaderboardID"] as? String
        if leaderboardID == nil || leaderboardID?.isEmpty == true || leaderboardID == "null" {
            leaderboardID = "com.voidrift.highscore"
        }
        DispatchQueue.main.async {
            // If not authenticated yet, kick auth then show
            if !GameCenterManager.shared.isAuthenticated {
                GameCenterManager.shared.authenticatePlayer { [weak self] ok in
                    self?.notifyGameCenterStatus(authenticated: ok)
                    if ok {
                        GameCenterManager.shared.showLeaderboard(leaderboardID)
                    }
                }
            } else {
                GameCenterManager.shared.showLeaderboard(leaderboardID)
            }
        }
    }
    
    private func handleGameCenterShowAchievements() {
        DispatchQueue.main.async {
            if !GameCenterManager.shared.isAuthenticated {
                GameCenterManager.shared.authenticatePlayer { [weak self] ok in
                    self?.notifyGameCenterStatus(authenticated: ok)
                    if ok {
                        GameCenterManager.shared.showAchievements()
                    }
                }
            } else {
                GameCenterManager.shared.showAchievements()
            }
        }
    }
    
    private func handleGameCenterLoadFriends(_ body: Any) {
        guard let data = body as? [String: Any],
              let callbackId = data["callbackId"] as? Int else {
            return
        }
        
        GameCenterManager.shared.loadFriends { [weak self] players in
            let friends = players?.map { player in
                return [
                    "alias": player.alias,
                    "playerID": player.gamePlayerID
                ]
            } ?? []
            
            self?.notifyGameCenterFriends(friends, callbackId: callbackId)
        }
    }
    
    private func notifyGameCenterStatus(authenticated: Bool) {
        // Escape alias for JS string safety
        var playerInfo = "null"
        if authenticated, let info = GameCenterManager.shared.getPlayerInfo() {
            let alias = info.alias
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
                .replacingOccurrences(of: "\n", with: " ")
            let playerID = info.playerID
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
            playerInfo = """
            {
                "alias": "\(alias)",
                "playerID": "\(playerID)"
            }
            """
        }
        
        let script = """
        (function() {
          window.iOSBridge = window.iOSBridge || {};
          window.iOSBridge.gameCenter = window.iOSBridge.gameCenter || { isAvailable: true };
          window.iOSBridge.gameCenter.isAuthenticated = \(authenticated);
          window.iOSBridge.gameCenter.playerInfo = \(playerInfo);
          if (window.UnifiedSocial) {
            window.UnifiedSocial.isGameCenterAvailable = true;
            window.UnifiedSocial.isGameCenterAuthenticated = \(authenticated);
            if (typeof window.UnifiedSocial.updateSocialUI === 'function') {
              window.UnifiedSocial.updateSocialUI();
            }
          }
          if (typeof window.onGameCenterAuthChanged === 'function') {
            window.onGameCenterAuthChanged(\(authenticated), \(playerInfo));
          }
          window.dispatchEvent(new CustomEvent('gameCenterAuth', {
            detail: { authenticated: \(authenticated), player: \(playerInfo) }
          }));
          console.log('[GameCenter] auth=', \(authenticated));
        })();
        """
        
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    
    private func notifyGameCenterFriends(_ friends: [[String: String]], callbackId: Int) {
        let jsonData = try? JSONSerialization.data(withJSONObject: friends)
        let jsonString = jsonData.flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        
        let script = """
        if (window._gcCallbacks && window._gcCallbacks.callbacks[\(callbackId)]) {
            window._gcCallbacks.callbacks[\(callbackId)](\(jsonString));
            delete window._gcCallbacks.callbacks[\(callbackId)];
        }
        """
        
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
}
