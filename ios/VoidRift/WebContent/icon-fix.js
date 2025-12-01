// Fix for in-game SVG icons showing as blue question marks
// This ensures all SVG icons load properly

(function() {
    console.log('🔧 Loading icon fix...');
    
    // Fix SVG icons by ensuring proper paths
    function fixIconPaths() {
        // Get all img elements with SVG sources
        const svgIcons = document.querySelectorAll('img[src$=".svg"]');
        
        svgIcons.forEach(img => {
            let currentSrc = img.src;
            
            // Fix assets/icons/ to just icons/
            if (currentSrc.includes('assets/icons/')) {
                currentSrc = currentSrc.replace('assets/icons/', 'icons/');
                console.log('🔧 Fixing icon path:', img.src, '->', currentSrc);
                img.src = currentSrc;
            }
            
            // If the path is relative and missing proper directory
            else if (!currentSrc.includes('icons/') && !currentSrc.startsWith('data:')) {
                const filename = currentSrc.split('/').pop();
                const newSrc = 'icons/' + filename;
                
                console.log('🔧 Fixing icon path:', currentSrc, '->', newSrc);
                img.src = newSrc;
            }
            
            // Add error handler
            img.onerror = function() {
                console.error('❌ Failed to load icon:', this.src);
                // Fallback to a Unicode character
                this.style.display = 'none';
                const span = document.createElement('span');
                span.textContent = '⚡'; // Fallback icon
                span.style.fontSize = '24px';
                span.style.display = 'inline-block';
                this.parentNode.insertBefore(span, this);
            };
            
            // Force reload if not loaded
            if (img.complete && img.naturalHeight === 0) {
                const src = img.src;
                img.src = '';
                img.src = src;
            }
        });
    }
    
    // Fix on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixIconPaths);
    } else {
        fixIconPaths();
    }
    
    // Also fix icons that are added dynamically
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'IMG' && node.src.endsWith('.svg')) {
                        fixIconPaths();
                    } else if (node.querySelectorAll) {
                        const imgs = node.querySelectorAll('img[src$=".svg"]');
                        if (imgs.length > 0) {
                            fixIconPaths();
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Icon fix loaded');
})();
