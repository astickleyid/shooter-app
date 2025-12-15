import UIKit
import GameKit

/// Manages Apple Game Center integration for achievements, leaderboards, and social features
class GameCenterManager: NSObject {
    
    static let shared = GameCenterManager()
    
    private(set) var isAuthenticated = false
    private(set) var localPlayer: GKLocalPlayer?
    
    // Completion handlers
    var onAuthenticationComplete: ((Bool) -> Void)?
    
    private override init() {
        super.init()
    }
    
    // MARK: - Authentication
    
    /// Authenticate the local player with Game Center
    func authenticatePlayer(completion: @escaping (Bool) -> Void) {
        localPlayer = GKLocalPlayer.local
        
        localPlayer?.authenticateHandler = { [weak self] viewController, error in
            guard let self = self else { return }
            
            if let viewController = viewController {
                // Present authentication view controller
                if let rootVC = self.getRootViewController() {
                    rootVC.present(viewController, animated: true)
                }
            } else if let player = self.localPlayer, player.isAuthenticated {
                // Successfully authenticated
                self.isAuthenticated = true
                self.loadPlayerInfo()
                completion(true)
                self.onAuthenticationComplete?(true)
            } else {
                // Authentication failed
                self.isAuthenticated = false
                if let error = error {
                    print("Game Center authentication failed: \(error.localizedDescription)")
                }
                completion(false)
                self.onAuthenticationComplete?(false)
            }
        }
    }
    
    private func loadPlayerInfo() {
        guard let player = localPlayer else { return }
        
        print("✅ Game Center authenticated: \(player.alias)")
        
        // Optionally load player photo
        player.loadPhoto(for: .normal) { image, error in
            if let error = error {
                print("Failed to load player photo: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Leaderboards
    
    /// Submit score to Game Center leaderboard
    /// - Parameters:
    ///   - score: The score to submit
    ///   - leaderboardID: The leaderboard identifier (e.g., "com.voidrift.highscore")
    func submitScore(_ score: Int, to leaderboardID: String, completion: ((Bool) -> Void)? = nil) {
        guard isAuthenticated, let player = localPlayer else {
            print("⚠️ Cannot submit score: Not authenticated with Game Center")
            completion?(false)
            return
        }
        
        GKLeaderboard.submitScore(score, context: 0, player: player, leaderboardIDs: [leaderboardID]) { error in
            if let error = error {
                print("❌ Failed to submit score: \(error.localizedDescription)")
                completion?(false)
            } else {
                print("✅ Score submitted to Game Center: \(score)")
                completion?(true)
            }
        }
    }
    
    /// Show Game Center leaderboard UI
    func showLeaderboard(_ leaderboardID: String? = nil) {
        guard isAuthenticated else {
            print("⚠️ Cannot show leaderboard: Not authenticated")
            return
        }
        
        let vc = GKGameCenterViewController(state: .leaderboards)
        vc.gameCenterDelegate = self
        
        if let leaderboardID = leaderboardID {
            vc.leaderboardIdentifier = leaderboardID
        }
        
        getRootViewController()?.present(vc, animated: true)
    }
    
    /// Load leaderboard scores
    func loadLeaderboardScores(leaderboardID: String, completion: @escaping ([GKLeaderboard.Entry]?) -> Void) {
        guard isAuthenticated else {
            completion(nil)
            return
        }
        
        GKLeaderboard.loadLeaderboards(IDs: [leaderboardID]) { leaderboards, error in
            if let error = error {
                print("❌ Failed to load leaderboard: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let leaderboard = leaderboards?.first else {
                completion(nil)
                return
            }
            
            leaderboard.loadEntries(for: .global, timeScope: .allTime, range: NSRange(location: 1, length: 25)) { local, entries, count, error in
                if let error = error {
                    print("❌ Failed to load entries: \(error.localizedDescription)")
                    completion(nil)
                } else {
                    completion(entries)
                }
            }
        }
    }
    
    // MARK: - Achievements
    
    /// Report achievement progress to Game Center
    /// - Parameters:
    ///   - identifier: Achievement identifier (e.g., "com.voidrift.achievement.firstblood")
    ///   - percentComplete: Percentage complete (0-100)
    func reportAchievement(identifier: String, percentComplete: Double, completion: ((Bool) -> Void)? = nil) {
        guard isAuthenticated else {
            completion?(false)
            return
        }
        
        let achievement = GKAchievement(identifier: identifier)
        achievement.percentComplete = percentComplete
        achievement.showsCompletionBanner = percentComplete >= 100.0
        
        GKAchievement.report([achievement]) { error in
            if let error = error {
                print("❌ Failed to report achievement: \(error.localizedDescription)")
                completion?(false)
            } else {
                print("✅ Achievement reported: \(identifier) - \(percentComplete)%")
                completion?(true)
            }
        }
    }
    
    /// Show Game Center achievements UI
    func showAchievements() {
        guard isAuthenticated else {
            print("⚠️ Cannot show achievements: Not authenticated")
            return
        }
        
        let vc = GKGameCenterViewController(state: .achievements)
        vc.gameCenterDelegate = self
        getRootViewController()?.present(vc, animated: true)
    }
    
    /// Load all achievements
    func loadAchievements(completion: @escaping ([GKAchievement]?) -> Void) {
        guard isAuthenticated else {
            completion(nil)
            return
        }
        
        GKAchievement.loadAchievements { achievements, error in
            if let error = error {
                print("❌ Failed to load achievements: \(error.localizedDescription)")
                completion(nil)
            } else {
                completion(achievements)
            }
        }
    }
    
    /// Reset all achievements (for testing only)
    func resetAchievements(completion: ((Bool) -> Void)? = nil) {
        guard isAuthenticated else {
            completion?(false)
            return
        }
        
        GKAchievement.resetAchievements { error in
            if let error = error {
                print("❌ Failed to reset achievements: \(error.localizedDescription)")
                completion?(false)
            } else {
                print("✅ All achievements reset")
                completion?(true)
            }
        }
    }
    
    // MARK: - Friends & Social
    
    /// Load Game Center friends
    func loadFriends(completion: @escaping ([GKPlayer]?) -> Void) {
        guard isAuthenticated, let player = localPlayer else {
            completion(nil)
            return
        }
        
        player.loadFriends { friends, error in
            if let error = error {
                print("❌ Failed to load friends: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let friendIDs = friends else {
                completion([])
                return
            }
            
            // Note: GKPlayer.loadPlayers(forIdentifiers:) is deprecated in iOS 14.5+
            // but we support iOS 14.0+, so we use this for compatibility
            if #available(iOS 14.5, *) {
                // Use the modern API on iOS 14.5+
                Task {
                    do {
                        let players = try await GKPlayer.loadPlayers(forIdentifiers: friendIDs)
                        completion(players)
                    } catch {
                        print("❌ Failed to load friend players: \(error.localizedDescription)")
                        completion(nil)
                    }
                }
            } else {
                // Fallback for iOS 14.0 - 14.4
                GKPlayer.loadPlayers(forIdentifiers: friendIDs) { players, error in
                    if let error = error {
                        print("❌ Failed to load friend players: \(error.localizedDescription)")
                        completion(nil)
                    } else {
                        completion(players)
                    }
                }
            }
        }
    }
    
    /// Show Game Center friend request UI
    func showFriendRequest() {
        guard isAuthenticated else {
            print("⚠️ Cannot show friend request: Not authenticated")
            return
        }
        
        // Note: Friend requests are handled through Game Center app on iOS 14+
        let alert = UIAlertController(
            title: "Add Friends",
            message: "Add friends through the Game Center app to see them in VOID RIFT!",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        getRootViewController()?.present(alert, animated: true)
    }
    
    // MARK: - Player Info
    
    /// Get local player info for display
    func getPlayerInfo() -> (alias: String, playerID: String)? {
        guard isAuthenticated, let player = localPlayer else {
            return nil
        }
        return (player.alias, player.gamePlayerID)
    }
    
    // MARK: - Helpers
    
    private func getRootViewController() -> UIViewController? {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController
    }
}

// MARK: - GKGameCenterControllerDelegate

extension GameCenterManager: GKGameCenterControllerDelegate {
    func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
