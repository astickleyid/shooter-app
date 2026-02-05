/**
 * Input Manager - Handles all input methods (keyboard, mouse, touch, gamepad)
 */

/**
 * InputManager class for unified input handling
 */
export class InputManager {
  constructor() {
    // Current input state
    this.state = {
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      isAiming: false,
      fireHeld: false,
      isBoosting: false,
      mouseDown: false,
      mouseAimActive: false,
      altFireHeld: false,
      defenseHeld: false,
      ultimateQueued: false
    };

    // Keyboard state
    this.keyboard = {
      w: false,
      a: false,
      s: false,
      d: false,
      ArrowUp: false,
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
      ' ': false,
      Shift: false,
      e: false,
      E: false,
      f: false,
      F: false,
      r: false,
      R: false
    };

    // Touch controls
    this.touch = {
      moveId: null,
      moveStart: { x: 0, y: 0 },
      shootId: null,
      shootStart: { x: 0, y: 0 },
      smoothMoveX: 0,
      smoothMoveY: 0,
      smoothAimX: 0,
      smoothAimY: 0
    };

    // Control settings (will be set externally)
    this.settings = {
      deadzone: 0.12,
      moveSensitivity: 1.0,
      aimSensitivity: 1.0,
      floatingJoysticks: false,
      hapticFeedback: true
    };

    // Event listeners
    this.listeners = [];
  }

  /**
   * Initialize input manager
   * @param {HTMLCanvasElement} canvas - Game canvas element
   */
  initialize(canvas) {
    this.canvas = canvas;
    this._setupKeyboard();
    this._setupMouse(canvas);
    this._setupTouch();
  }

  /**
   * Setup keyboard event listeners
   * @private
   */
  _setupKeyboard() {
    const handleKeyDown = (e) => {
      if (Object.prototype.hasOwnProperty.call(this.keyboard, e.key)) {
        this.keyboard[e.key] = true;
        this._updateFromKeyboard();
      }
    };

    const handleKeyUp = (e) => {
      if (Object.prototype.hasOwnProperty.call(this.keyboard, e.key)) {
        this.keyboard[e.key] = false;
        this._updateFromKeyboard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    this.listeners.push(
      { element: document, event: 'keydown', handler: handleKeyDown },
      { element: document, event: 'keyup', handler: handleKeyUp }
    );
  }

  /**
   * Setup mouse event listeners
   * @private
   */
  _setupMouse(canvas) {
    if (!canvas) return;

    const handleMouseDown = (e) => {
      if (e.button === 2) {
        e.preventDefault();
        this._triggerSecondary();
        return;
      }
      this.state.mouseDown = true;
      this.state.fireHeld = true;
      this._aimFromPointer(e.clientX, e.clientY);
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        this.state.altFireHeld = false;
        return;
      }
      this.state.mouseDown = false;
      if (this.state.mouseAimActive) {
        this.state.fireHeld = false;
      }
    };

    const handleMouseMove = (e) => {
      this._aimFromPointer(e.clientX, e.clientY);
    };

    const handleContextMenu = (e) => e.preventDefault();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);

    this.listeners.push(
      { element: canvas, event: 'mousedown', handler: handleMouseDown },
      { element: canvas, event: 'mouseup', handler: handleMouseUp },
      { element: canvas, event: 'mousemove', handler: handleMouseMove },
      { element: canvas, event: 'contextmenu', handler: handleContextMenu }
    );
  }

  /**
   * Setup touch event listeners
   * @private
   */
  _setupTouch() {
    // Touch handlers will be added by the touch controls UI component
    // This provides the methods they need to call
  }

  /**
   * Update input state from keyboard
   * @private
   */
  _updateFromKeyboard() {
    // Movement
    this.state.moveX = (this.keyboard.d ? 1 : 0) - (this.keyboard.a ? 1 : 0);
    this.state.moveY = (this.keyboard.s ? 1 : 0) - (this.keyboard.w ? 1 : 0);
    const moveMag = Math.hypot(this.state.moveX, this.state.moveY);
    if (moveMag > 0) {
      this.state.moveX /= moveMag;
      this.state.moveY /= moveMag;
    }

    // Aiming with arrow keys
    const aimX = (this.keyboard.ArrowRight ? 1 : 0) - (this.keyboard.ArrowLeft ? 1 : 0);
    const aimY = (this.keyboard.ArrowDown ? 1 : 0) - (this.keyboard.ArrowUp ? 1 : 0);
    const aimMag = Math.hypot(aimX, aimY);
    if (aimMag > 0) {
      this.state.aimX = aimX / aimMag;
      this.state.aimY = aimY / aimMag;
      this.state.isAiming = true;
      this.state.fireHeld = true;
      this.state.mouseAimActive = false;
    } else if (!this.state.mouseAimActive) {
      this.state.isAiming = false;
      this.state.fireHeld = false;
    }

    // Abilities
    this.state.altFireHeld = this.keyboard.Shift || this.keyboard.e || this.keyboard.E;
    this.state.defenseHeld = this.keyboard.f || this.keyboard.F;
    this.state.isBoosting = this.keyboard[' '];
  }

  /**
   * Aim from pointer position
   * @private
   */
  _aimFromPointer(clientX, clientY) {
    if (!this.canvas || !this.player) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const dx = px - this.player.x;
    const dy = py - this.player.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    
    this.state.aimX = dx / magnitude;
    this.state.aimY = dy / magnitude;
    this.state.isAiming = true;
    this.state.mouseAimActive = true;
    this.state.fireHeld = this.state.mouseDown;
  }

  /**
   * Trigger secondary weapon
   * @private
   */
  _triggerSecondary() {
    this.state.altFireHeld = true;
    setTimeout(() => (this.state.altFireHeld = false), 150);
  }

  /**
   * Set player reference (needed for aim calculation)
   * @param {Object} player - Player entity
   */
  setPlayer(player) {
    this.player = player;
  }

  /**
   * Update control settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current input state
   * @returns {Object} Input state
   */
  getState() {
    return this.state;
  }

  /**
   * Get keyboard state
   * @returns {Object} Keyboard state
   */
  getKeyboard() {
    return this.keyboard;
  }

  /**
   * Reset all input state
   */
  reset() {
    Object.keys(this.state).forEach((k) => {
      if (typeof this.state[k] === 'boolean') this.state[k] = false;
      else this.state[k] = 0;
    });
    this.state.mouseAimActive = false;
    Object.keys(this.keyboard).forEach((k) => (this.keyboard[k] = false));
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    for (const { element, event, handler } of this.listeners) {
      element.removeEventListener(event, handler);
    }
    this.listeners = [];
  }
}
