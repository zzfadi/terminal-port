// PAC-MAN Portfolio Script
document.addEventListener('DOMContentLoaded', () => {
  const dots = document.querySelectorAll('.dot');
  
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(dot.getAttribute('href'));
      target.scrollIntoView({ behavior: 'smooth' });
      
      // Temporarily change dot to pacman
      const original = dot.textContent;
      dot.textContent = 'ᗧ';
      dot.style.color = 'var(--pacman)';
      setTimeout(() => {
        dot.textContent = original;
        dot.style.color = 'var(--dot)';
      }, 500);
    });
  });
  
  // Add some random ghost appearances
  setInterval(() => {
    const sections = document.querySelectorAll('.section');
    const randomSection = sections[Math.floor(Math.random() * sections.length)];
    const ghost = document.createElement('div');
    ghost.textContent = 'ᗣ';
    ghost.style.position = 'absolute';
    ghost.style.color = 'var(--ghost)';
    ghost.style.fontSize = '2em';
    ghost.style.pointerEvents = 'none';
    ghost.style.animation = 'float 3s ease-in-out';
    randomSection.style.position = 'relative';
    randomSection.appendChild(ghost);
    setTimeout(() => ghost.remove(), 3000);
  }, 10000);
});