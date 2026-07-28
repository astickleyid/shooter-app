import StoreKit

/**
 * IAPManager — VOID RIFT iOS
 *
 * Native StoreKit 2 purchase + restore for the "Remove Ads" non-consumable
 * IAP. Bridged to the web layer's `IAPManager` (hangar-ui.js), which posts
 * to the `iapPurchase`/`iapRestore` message handlers and listens for the
 * `iapPurchased` / `iapFailed` / `iapRestored` / `iapRestoreFailed` window
 * events dispatched back by GameBridge.
 *
 * SETUP REQUIRED before App Store submission:
 * 1. Create the "Remove Ads" non-consumable IAP in App Store Connect with
 *    product ID `com.voidrift.game.removeads` (must match `removeAdsProductID`
 *    below and `IAPManager.PRODUCT_ID` in hangar-ui.js).
 * 2. Test against a StoreKit Configuration file or a Sandbox tester account.
 */

enum IAPPurchaseResult {
    case success
    case cancelled
    case failed(String)
}

enum IAPRestoreResult {
    case success([String])
    case failed(String)
}

class IAPManager: NSObject {

    static let shared = IAPManager()

    static let removeAdsProductID = "com.voidrift.game.removeads"

    private var updatesTask: Task<Void, Never>?

    private override init() {
        super.init()
        // StoreKit 2 requires observing Transaction.updates even for a single
        // non-consumable — this catches transactions that complete outside an
        // explicit purchase() call (e.g. resolved after an app relaunch).
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                await self?.finish(transactionResult: result)
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    private func finish(transactionResult: VerificationResult<Transaction>) async {
        guard case .verified(let transaction) = transactionResult else { return }
        await transaction.finish()
    }

    func purchase(productId: String) async -> IAPPurchaseResult {
        do {
            let products = try await Product.products(for: [productId])
            guard let product = products.first else {
                return .failed("Product not found: \(productId)")
            }

            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    await transaction.finish()
                    return .success
                case .unverified:
                    return .failed("Transaction could not be verified")
                }
            case .userCancelled:
                return .cancelled
            case .pending:
                return .failed("Purchase is pending approval")
            @unknown default:
                return .failed("Unknown purchase result")
            }
        } catch {
            return .failed(error.localizedDescription)
        }
    }

    func restore() async -> IAPRestoreResult {
        do {
            try await AppStore.sync()
        } catch {
            return .failed(error.localizedDescription)
        }

        var restoredIds: [String] = []
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            restoredIds.append(transaction.productID)
        }
        return .success(restoredIds)
    }
}
