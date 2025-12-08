document.addEventListener('DOMContentLoaded', () => {
    // Hit Counter Logic
    const counterDisplay = document.querySelector('.counter-display');
    let count = localStorage.getItem('retroHitCounter');
    
    if (!count) {
        count = 14832; // Start with a realistic 90s number
    } else {
        count = parseInt(count) + 1;
    }
    
    localStorage.setItem('retroHitCounter', count);
    counterDisplay.textContent = count.toString().padStart(6, '0');

    // Folder Toggle Logic
    const folders = document.querySelectorAll('.folder');
    
    folders.forEach(folder => {
        folder.addEventListener('click', () => {
            const content = folder.nextElementSibling;
            if (content) {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    folder.textContent = folder.textContent.replace('[+]', '[-]');
                } else {
                    content.style.display = 'none';
                    folder.textContent = folder.textContent.replace('[-]', '[+]');
                }
            } else {
                // Handle empty folders (like Cloud in the HTML)
                if (folder.textContent.includes('[-]')) {
                    folder.textContent = folder.textContent.replace('[-]', '[+]');
                } else {
                    folder.textContent = folder.textContent.replace('[+]', '[-]');
                }
            }
        });
    });

    // Window Close Logic (just hides the content for fun)
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.closest('.content-box');
            section.style.display = 'none';
            alert('Illegal operation! Just kidding, refreshing to bring it back.');
            setTimeout(() => {
                section.style.display = 'block';
            }, 1000);
        });
    });
});
