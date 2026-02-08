/**
 * Custom Target Cursor (Vanilla JS adaptation from fml-stories)
 * Creates a crosshair cursor that follows the mouse with smooth animations
 */

class TargetCursor {
  constructor() {
    this.cursor = null;
    this.dot = null;
    this.corners = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.rotation = 0;
    this.spinning = true;
    
    this.init();
  }
  
  init() {
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    // Create cursor elements
    this.createCursor();
    
    // Start animation loop
    this.animate();
    
    // Event listeners
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    window.addEventListener('mousedown', () => this.onMouseDown());
    window.addEventListener('mouseup', () => this.onMouseUp());
  }
  
  createCursor() {
    // Create container
    this.cursor = document.createElement('div');
    this.cursor.className = 'target-cursor-wrapper';
    
    // Create center dot
    this.dot = document.createElement('div');
    this.dot.className = 'target-cursor-dot';
    this.cursor.appendChild(this.dot);
    
    // Create corners
    const cornerClasses = ['corner-tl', 'corner-tr', 'corner-br', 'corner-bl'];
    cornerClasses.forEach(className => {
      const corner = document.createElement('div');
      corner.className = `target-cursor-corner ${className}`;
      this.corners.push(corner);
      this.cursor.appendChild(corner);
    });
    
    document.body.appendChild(this.cursor);
  }
  
  animate() {
    // Smooth follow
    const dx = this.mouseX - this.cursorX;
    const dy = this.mouseY - this.cursorY;
    this.cursorX += dx * 0.15;
    this.cursorY += dy * 0.15;
    
    // Spin animation
    if (this.spinning) {
      this.rotation += 0.5;
      if (this.rotation >= 360) this.rotation = 0;
    }
    
    // Apply transform
    this.cursor.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px) rotate(${this.rotation}deg)`;
    
    requestAnimationFrame(() => this.animate());
  }
  
  onMouseDown() {
    this.dot.style.transform = 'translate(-50%, -50%) scale(0.7)';
    this.cursor.style.transform += ' scale(0.9)';
  }
  
  onMouseUp() {
    this.dot.style.transform = 'translate(-50%, -50%) scale(1)';
    this.cursor.style.transform = this.cursor.style.transform.replace(' scale(0.9)', '');
  }
}

// Initialize cursor when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TargetCursor());
} else {
  new TargetCursor();
}
