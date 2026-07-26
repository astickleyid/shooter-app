import UIKit

/**
 * AdMobManager — VOID RIFT iOS
 *
 * Stub implementation for App Store builds until a real AdMob App ID +
 * Google Mobile Ads SPM package are configured.
 *
 * When ads are ready for production:
 * 1. Add package: https://github.com/googleads/swift-package-manager-google-mobile-ads.git
 * 2. Set GADApplicationIdentifier in Info.plist
 * 3. Restore GoogleMobileAds import + GADRewardedAd loading with production unit IDs
 *
 * JS bridge still works: preload/show call through, rewards are denied (no free credit).
 */

class AdMobManager: NSObject {

    static let shared = AdMobManager()

    private var isReady = false

    private override init() {
        super.init()
        print("[AdMob] Stub manager active — ads disabled until production SDK is wired")
    }

    func preloadRewarded() {
        isReady = false
        print("[AdMob] preloadRewarded (stub) — no ad loaded")
    }

    func showRewarded(from viewController: UIViewController?, completion: @escaping (Bool) -> Void) {
        print("[AdMob] showRewarded (stub) — no ad available")
        completion(false)
    }
}

extension Notification.Name {
    static let adLoaded = Notification.Name("AdMobAdLoaded")
}
