import UIKit
import WebKit

protocol TutorialOverlayDelegate: AnyObject {
    func tutorialDidComplete()
    func tutorialDidSkip()
}

class TutorialOverlay: UIView {
    
    weak var delegate: TutorialOverlayDelegate?
    private weak var webView: WKWebView?
    
    private var currentStep = 0
    private var tutorialSteps: [TutorialStep] = []
    
    // Overlay components
    private let dimView = UIView()
    private let spotlightMask = CAShapeLayer()
    private let contentView = UIView()
    private let titleLabel = UILabel()
    private let messageLabel = UILabel()
    private let nextButton = UIButton(type: .system)
    private let skipButton = UIButton(type: .system)
    private let stepIndicator = UILabel()
    private let arrowLayer = CAShapeLayer()
    private let pulseLayer = CAShapeLayer()
    
    init(frame: CGRect, webView: WKWebView) {
        self.webView = webView
        super.init(frame: frame)
        setupViews()
        setupSteps()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupViews() {
        // Semi-transparent overlay with spotlight effect
        dimView.frame = bounds
        dimView.backgroundColor = UIColor.black.withAlphaComponent(0.75)
        addSubview(dimView)
        
        // Content card - compact and non-obtrusive
        contentView.backgroundColor = UIColor(red: 0.06, green: 0.06, blue: 0.08, alpha: 0.98)
        contentView.layer.cornerRadius = 16
        contentView.layer.borderWidth = 2
        contentView.layer.borderColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 1.0).cgColor
        contentView.layer.shadowColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 0.5).cgColor
        contentView.layer.shadowRadius = 20
        contentView.layer.shadowOpacity = 0.8
        contentView.layer.shadowOffset = .zero
        addSubview(contentView)
        
        // Title
        titleLabel.font = UIFont.boldSystemFont(ofSize: 18)
        titleLabel.textColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 1.0)
        titleLabel.textAlignment = .center
        titleLabel.numberOfLines = 0
        contentView.addSubview(titleLabel)
        
        // Message
        messageLabel.font = UIFont.systemFont(ofSize: 15)
        messageLabel.textColor = .white
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 0
        contentView.addSubview(messageLabel)
        
        // Step indicator
        stepIndicator.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        stepIndicator.textColor = UIColor.white.withAlphaComponent(0.6)
        stepIndicator.textAlignment = .center
        contentView.addSubview(stepIndicator)
        
        // Next button
        nextButton.setTitle("Next", for: .normal)
        nextButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16)
        nextButton.setTitleColor(.black, for: .normal)
        nextButton.backgroundColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 1.0)
        nextButton.layer.cornerRadius = 8
        nextButton.addTarget(self, action: #selector(nextTapped), for: .touchUpInside)
        contentView.addSubview(nextButton)
        
        // Skip button
        skipButton.setTitle("Skip Tutorial", for: .normal)
        skipButton.titleLabel?.font = UIFont.systemFont(ofSize: 13)
        skipButton.setTitleColor(UIColor.white.withAlphaComponent(0.5), for: .normal)
        skipButton.addTarget(self, action: #selector(skipTapped), for: .touchUpInside)
        contentView.addSubview(skipButton)
        
        layoutViews()
    }
    
    private func layoutViews() {
        let padding: CGFloat = 16
        let contentWidth: CGFloat = min(bounds.width - 40, 350)
        let contentHeight: CGFloat = 200
        
        // Position at bottom for better visibility
        contentView.frame = CGRect(
            x: (bounds.width - contentWidth) / 2,
            y: bounds.height - contentHeight - 40,
            width: contentWidth,
            height: contentHeight
        )
        
        stepIndicator.frame = CGRect(x: padding, y: padding, width: contentWidth - 2 * padding, height: 18)
        titleLabel.frame = CGRect(x: padding, y: 40, width: contentWidth - 2 * padding, height: 50)
        messageLabel.frame = CGRect(x: padding, y: 95, width: contentWidth - 2 * padding, height: 60)
        nextButton.frame = CGRect(x: padding, y: contentHeight - 65, width: contentWidth - 2 * padding, height: 40)
        skipButton.frame = CGRect(x: padding, y: contentHeight - 22, width: contentWidth - 2 * padding, height: 20)
    }
    
    private func setupSteps() {
        // Steps now reference actual game elements
        tutorialSteps = [
            TutorialStep(
                title: "Welcome to Void Rift!",
                message: "Let's learn how to play. We'll highlight the actual controls as we go.",
                highlightElement: nil,
                arrowDirection: nil
            ),
            TutorialStep(
                title: "Movement Joystick",
                message: "This is your movement control. Touch and drag to move your ship.",
                highlightElement: ".joystick-left, #leftJoystick, #joystickMoveBase",
                arrowDirection: .pointingTo
            ),
            TutorialStep(
                title: "Shooting Joystick",
                message: "Use this to aim and fire. Touch and drag in any direction to shoot.",
                highlightElement: ".joystick-right, #rightJoystick, #joystickShootBase",
                arrowDirection: .pointingTo
            ),
            TutorialStep(
                title: "Health Bar",
                message: "Keep an eye on this! When it reaches zero, game over.",
                highlightElement: "#healthBar, .health-bar, #playerHealth",
                arrowDirection: .pointingDown
            ),
            TutorialStep(
                title: "Score & Level",
                message: "Your current score and level are displayed here.",
                highlightElement: "#score, .score-display, #scoreDisplay",
                arrowDirection: .pointingDown
            ),
            TutorialStep(
                title: "Pause Button",
                message: "Tap here to pause, access settings, or change controls.",
                highlightElement: "#pauseBtn, .pause-button, #pauseButton",
                arrowDirection: .pointingDown
            ),
            TutorialStep(
                title: "Weapon Display",
                message: "Shows your current weapon and ammo. Collect power-ups to upgrade!",
                highlightElement: "#weaponDisplay, .weapon-display, #currentWeapon",
                arrowDirection: .pointingTo
            ),
            TutorialStep(
                title: "You're Ready!",
                message: "You know the basics! Time to dominate the void. Good luck, pilot!",
                highlightElement: nil,
                arrowDirection: nil
            )
        ]
    }
    
    func start() {
        currentStep = 0
        showStep(currentStep)
        
        // Animate in
        alpha = 0
        UIView.animate(withDuration: 0.3) {
            self.alpha = 1
        }
    }
    
    private func showStep(_ step: Int) {
        guard step < tutorialSteps.count else {
            complete()
            return
        }
        
        let tutorialStep = tutorialSteps[step]
        
        titleLabel.text = tutorialStep.title
        messageLabel.text = tutorialStep.message
        stepIndicator.text = "Step \(step + 1) of \(tutorialSteps.count)"
        
        // Update button text for last step
        if step == tutorialSteps.count - 1 {
            nextButton.setTitle("Let's Play!", for: .normal)
        } else {
            nextButton.setTitle("Next", for: .normal)
        }
        
        // Highlight actual game element
        if let elementSelector = tutorialStep.highlightElement {
            highlightGameElement(selector: elementSelector, direction: tutorialStep.arrowDirection)
        } else {
            clearHighlight()
        }
        
        // Animate transition
        contentView.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        contentView.alpha = 0
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
            self.contentView.transform = .identity
            self.contentView.alpha = 1
        }
    }
    
    private func highlightGameElement(selector: String, direction: ArrowDirection?) {
        guard let webView = webView else { return }
        
        // JavaScript to get element position and highlight it
        let script = """
        (function() {
            const element = document.querySelector('\(selector)');
            if (!element) return null;
            
            const rect = element.getBoundingClientRect();
            
            // Add pulsing highlight to element
            element.style.position = 'relative';
            element.style.zIndex = '99999';
            element.style.outline = '3px solid #4ade80';
            element.style.outlineOffset = '4px';
            element.style.boxShadow = '0 0 0 8px rgba(74, 222, 128, 0.3), 0 0 30px rgba(74, 222, 128, 0.6)';
            element.style.borderRadius = '12px';
            element.style.animation = 'tutorialPulse 2s ease-in-out infinite';
            
            // Add pulsing animation if not exists
            if (!document.getElementById('tutorial-pulse-style')) {
                const style = document.createElement('style');
                style.id = 'tutorial-pulse-style';
                style.textContent = `
                    @keyframes tutorialPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height
            };
        })();
        """
        
        webView.evaluateJavaScript(script) { [weak self] result, error in
            guard let self = self,
                  let dict = result as? [String: CGFloat],
                  let x = dict["x"],
                  let y = dict["y"] else { return }
            
            // Draw arrow pointing to element
            if let direction = direction {
                self.drawArrow(to: CGPoint(x: x, y: y), direction: direction)
            }
        }
    }
    
    private func clearHighlight() {
        guard let webView = webView else { return }
        
        let script = """
        (function() {
            document.querySelectorAll('*').forEach(el => {
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.boxShadow = '';
                el.style.animation = '';
            });
            const style = document.getElementById('tutorial-pulse-style');
            if (style) style.remove();
        })();
        """
        
        webView.evaluateJavaScript(script, completionHandler: nil)
        
        // Clear arrow
        arrowLayer.removeFromSuperlayer()
        pulseLayer.removeFromSuperlayer()
    }
    
    private func drawArrow(to point: CGPoint, direction: ArrowDirection) {
        arrowLayer.removeFromSuperlayer()
        pulseLayer.removeFromSuperlayer()
        
        let arrowPath = UIBezierPath()
        let arrowSize: CGFloat = 30
        
        // Calculate arrow position based on direction
        var arrowPoint = point
        switch direction {
        case .pointingDown:
            arrowPoint.y -= 60
        case .pointingUp:
            arrowPoint.y += 60
        case .pointingLeft:
            arrowPoint.x += 60
        case .pointingRight:
            arrowPoint.x -= 60
        case .pointingTo:
            // Calculate best direction
            if point.y < bounds.height / 2 {
                arrowPoint.y -= 60
            } else {
                arrowPoint.y += 60
            }
        }
        
        // Draw arrow shape
        arrowPath.move(to: CGPoint(x: arrowPoint.x, y: arrowPoint.y - arrowSize))
        arrowPath.addLine(to: CGPoint(x: arrowPoint.x - arrowSize/2, y: arrowPoint.y))
        arrowPath.addLine(to: CGPoint(x: arrowPoint.x + arrowSize/2, y: arrowPoint.y))
        arrowPath.close()
        
        arrowLayer.path = arrowPath.cgPath
        arrowLayer.fillColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 1.0).cgColor
        arrowLayer.shadowColor = UIColor(red: 0.29, green: 0.97, blue: 0.50, alpha: 0.8).cgColor
        arrowLayer.shadowRadius = 10
        arrowLayer.shadowOpacity = 1.0
        arrowLayer.shadowOffset = .zero
        
        layer.addSublayer(arrowLayer)
        
        // Pulsing animation
        let pulse = CABasicAnimation(keyPath: "transform.scale")
        pulse.duration = 1.0
        pulse.fromValue = 1.0
        pulse.toValue = 1.2
        pulse.autoreverses = true
        pulse.repeatCount = .infinity
        arrowLayer.add(pulse, forKey: "pulse")
    }
    
    @objc private func nextTapped() {
        currentStep += 1
        showStep(currentStep)
        
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }
    
    @objc private func skipTapped() {
        let alert = UIAlertController(
            title: "Skip Tutorial?",
            message: "Are you sure? You can always access help from the pause menu.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Continue Tutorial", style: .cancel))
        alert.addAction(UIAlertAction(title: "Skip", style: .destructive) { [weak self] _ in
            self?.skip()
        })
        
        if let presenting = window?.rootViewController {
            presenting.present(alert, animated: true)
        }
    }
    
    private func complete() {
        clearHighlight()
        UIView.animate(withDuration: 0.3, animations: {
            self.alpha = 0
        }) { _ in
            self.delegate?.tutorialDidComplete()
        }
    }
    
    private func skip() {
        clearHighlight()
        UIView.animate(withDuration: 0.3, animations: {
            self.alpha = 0
        }) { _ in
            self.delegate?.tutorialDidSkip()
        }
    }
}

// MARK: - Tutorial Step Model

struct TutorialStep {
    let title: String
    let message: String
    let highlightElement: String? // CSS selector
    let arrowDirection: ArrowDirection?
}

enum ArrowDirection {
    case pointingUp
    case pointingDown
    case pointingLeft
    case pointingRight
    case pointingTo // Auto-calculate best direction
}
