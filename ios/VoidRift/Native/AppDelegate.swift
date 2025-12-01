import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure app launch
        configureAppearance()
        return true
    }
    
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    private func configureAppearance() {
        // Status bar appearance should be managed per scene/view controller on iOS 13+.
        // For example, override prefersStatusBarHidden in your root view controller or use a hosting controller.
        
        // Prevents automatic dimming
        UIApplication.shared.isIdleTimerDisabled = true
    }
}
