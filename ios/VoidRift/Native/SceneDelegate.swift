import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        window = UIWindow(windowScene: windowScene)
        let gameVC = GameViewController()
        window?.rootViewController = gameVC
        window?.makeKeyAndVisible()
    }
    
    func sceneDidDisconnect(_ scene: UIScene) {}
    
    func sceneDidBecomeActive(_ scene: UIScene) {
        // Resume game if needed
    }
    
    func sceneWillResignActive(_ scene: UIScene) {
        // Pause game
        NotificationCenter.default.post(name: NSNotification.Name("PauseGame"), object: nil)
    }
    
    func sceneWillEnterForeground(_ scene: UIScene) {}
    
    func sceneDidEnterBackground(_ scene: UIScene) {
        // Save game state
        NotificationCenter.default.post(name: NSNotification.Name("SaveGame"), object: nil)
    }
}
