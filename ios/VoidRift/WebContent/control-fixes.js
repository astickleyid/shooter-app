/* ====================================== */
/* VOID RIFT - CONTROL FIXES */
/* ====================================== */

// This script fixes:
// 1. Radial menu visibility when holding secondary button
// 2. Floating joystick visibility on touch
// 3. Secondary button positioning

(function() {
  'use strict';
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initControlFixes);
  } else {
    initControlFixes();
  }
  
  function initControlFixes() {
    console.log('Initializing control fixes...');
    
    // Fix radial menu visibility
    fixRadialMenuVisibility();
    
    // Fix floating joystick visibility
    fixFloatingJoystickVisibility();
    
    // Add secondary button hold-to-expand functionality
    addSecondaryButtonHoldLogic();
  }
  
  function fixRadialMenuVisibility() {
    const radialMenu = document.getElementById('radialMenu');
    if (!radialMenu) {
      console.warn('Radial menu not found');
      return;
    }
    
    // Override display style to ensure it starts hidden but ready
    radialMenu.style.display = 'flex';
    radialMenu.style.opacity = '0';
    radialMenu.style.pointerEvents = 'none';
    
    // Add observer to watch for class changes
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          const classList = radialMenu.classList;
          
          if (classList.contains('opening') || classList.contains('active')) {
            radialMenu.classList.add('active');
            console.log('Radial menu activated');
          } else if (classList.contains('closing')) {
            radialMenu.classList.remove('active');
          }
        }
      });
    });
    
    observer.observe(radialMenu, { attributes: true });
    
    console.log('Radial menu visibility fixed');
  }
  
  function fixFloatingJoystickVisibility() {
    const shootJoystick = document.getElementById('joystickShootBase');
    const rightTouchZone = document.getElementById('rightTouchZone');
    
    if (!shootJoystick || !rightTouchZone) {
      console.warn('Shoot joystick or right touch zone not found');
      return;
    }
    
    // Ensure shoot joystick starts with proper styles
    shootJoystick.style.opacity = '0';
    shootJoystick.style.display = 'block';
    shootJoystick.style.pointerEvents = 'none';
    
    // Track touch state
    let shootTouchActive = false;
    
    // Add touchstart listener to show joystick
    rightTouchZone.addEventListener('touchstart', function(e) {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        
        // Position joystick at touch point
        shootJoystick.style.left = touch.clientX + 'px';
        shootJoystick.style.top = touch.clientY + 'px';
        shootJoystick.style.transform = 'translate(-50%, -50%)';
        shootJoystick.style.opacity = '0.7';
        shootJoystick.classList.add('active');
        
        shootTouchActive = true;
        console.log('Shoot joystick activated at:', touch.clientX, touch.clientY);
      }
    }, { passive: true });
    
    // Hide on touch end
    rightTouchZone.addEventListener('touchend', function() {
      shootJoystick.style.opacity = '0';
      shootJoystick.classList.remove('active');
      shootTouchActive = false;
      console.log('Shoot joystick deactivated');
    }, { passive: true });
    
    // Also handle touchcancel
    rightTouchZone.addEventListener('touchcancel', function() {
      shootJoystick.style.opacity = '0';
      shootJoystick.classList.remove('active');
      shootTouchActive = false;
    }, { passive: true });
    
    console.log('Floating joystick visibility fixed');
  }
  
  function addSecondaryButtonHoldLogic() {
    const secondarySlot = document.querySelector('.equip-slot[data-slot="secondary"]');
    const radialMenu = document.getElementById('radialMenu');
    
    if (!secondarySlot || !radialMenu) {
      console.warn('Secondary slot or radial menu not found');
      return;
    }
    
    let holdTimer = null;
    let isHolding = false;
    const HOLD_DURATION = 300; // ms
    
    function showRadialMenu() {
      radialMenu.classList.add('active');
      isHolding = true;
      console.log('Radial menu shown via hold');
      
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
    
    function hideRadialMenu() {
      radialMenu.classList.remove('active');
      isHolding = false;
      console.log('Radial menu hidden');
    }
    
    // Touch events
    secondarySlot.addEventListener('touchstart', function(e) {
      e.preventDefault();
      
      holdTimer = setTimeout(showRadialMenu, HOLD_DURATION);
      console.log('Secondary button touch started');
    }, { passive: false });
    
    secondarySlot.addEventListener('touchend', function(e) {
      e.preventDefault();
      
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      
      // If was holding, hide menu and potentially select weapon
      if (isHolding) {
        hideRadialMenu();
      } else {
        // Quick tap - cycle to next weapon
        console.log('Quick tap detected - cycle weapon');
      }
    }, { passive: false });
    
    secondarySlot.addEventListener('touchcancel', function() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      hideRadialMenu();
    }, { passive: true });
    
    // Mouse events for testing on desktop
    secondarySlot.addEventListener('mousedown', function(e) {
      e.preventDefault();
      holdTimer = setTimeout(showRadialMenu, HOLD_DURATION);
    });
    
    secondarySlot.addEventListener('mouseup', function(e) {
      e.preventDefault();
      
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      
      if (isHolding) {
        hideRadialMenu();
      }
    });
    
    secondarySlot.addEventListener('mouseleave', function() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      hideRadialMenu();
    });
    
    // Add touch handler for radial menu items
    const radialItems = radialMenu.querySelectorAll('.radial-item');
    radialItems.forEach(function(item, index) {
      item.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Radial item selected:', index);
        hideRadialMenu();
        
        // Highlight selected item
        radialItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Update secondary button icon
        const icon = item.querySelector('img');
        const secondaryIcon = document.getElementById('secondaryWeaponIcon');
        if (icon && secondaryIcon) {
          secondaryIcon.src = icon.src;
          secondaryIcon.alt = icon.alt;
        }
      }, { passive: false });
    });
    
    console.log('Secondary button hold logic added');
  }
  
})();
