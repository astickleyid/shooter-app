import UIKit
import GoogleMobileAds

/**
 * AdMobManager — VOID RIFT iOS
 *
 * Manages rewarded ads via Google Mobile Ads SDK.
 *
 * SETUP REQUIRED before App Store submission:
 * 1. GoogleMobileAds is already wired up as a Swift Package dependency
 *    (see project.pbxproj) and GADApplicationIdentifier is set in Info.plist.
 * 2. Replace the test GADApplicationIdentifier in Info.plist with your real
 *    AdMob App ID from https://admob.google.com/.
 * 3. Replace the ad unit ID below with your real rewarded ad unit ID.
 *
 * Test IDs (use during development — REPLACE before App Store submission):
 *   App ID:  ca-app-pub-3940256099942544~1458002511
 *   Ad Unit: ca-app-pub-3940256099942544/1712485313
 */

class AdMobManager: NSObject {

    static let shared = AdMobManager()

    // MARK: - Configuration
    // Replace with your real rewarded ad unit ID from https://admob.google.com/
    private let rewardedAdUnitID = "ca-app-pub-3940256099942544/1712485313" // TEST ID

    // MARK: - State
    private var rewardedAd: RewardedAd?
    private var rewardCallback: ((Bool) -> Void)?

    // MARK: - Init
    private override init() {
        super.init()
        // Initialize the Mobile Ads SDK
        MobileAds.shared.start(completionHandler: nil)
    }

    // MARK: - Preload
    func preloadRewarded() {
        guard rewardedAd == nil else { return } // Already loaded

        let request = Request()
        RewardedAd.load(with: rewardedAdUnitID, request: request) { [weak self] ad, error in
            if let error = error {
                print("[AdMob] Failed to load rewarded ad: \(error.localizedDescription)")
                return
            }
            self?.rewardedAd = ad
            self?.rewardedAd?.fullScreenContentDelegate = self
            print("[AdMob] Rewarded ad loaded ✅")

            // Notify JS that ad is ready
            NotificationCenter.default.post(name: .adLoaded, object: nil)
        }
    }

    // MARK: - Show
    func showRewarded(from viewController: UIViewController?, completion: @escaping (Bool) -> Void) {
        guard let ad = rewardedAd, let vc = viewController else {
            print("[AdMob] Ad not ready or no view controller")
            completion(false)
            return
        }

        self.rewardCallback = completion

        ad.present(from: vc) {
            print("[AdMob] Reward earned ✅")
            completion(true)
        }

        // Clear the ad reference after presenting — a new one will be preloaded on dismiss
        self.rewardedAd = nil
    }
}

// MARK: - FullScreenContentDelegate
extension AdMobManager: FullScreenContentDelegate {

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        print("[AdMob] Ad dismissed")
        // Preload next ad
        rewardedAd = nil
        preloadRewarded()
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        print("[AdMob] Ad failed to present: \(error.localizedDescription)")
        rewardCallback?(false)
        rewardCallback = nil
        rewardedAd = nil
        preloadRewarded()
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let adLoaded = Notification.Name("AdMobAdLoaded")
}
