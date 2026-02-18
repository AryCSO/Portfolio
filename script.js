document.addEventListener('DOMContentLoaded', function () {
    lucide.createIcons();

    const toTopButton = document.getElementById('to-top-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    function updateThemeIcon(theme) {
        if (themeIcon) {
            const iconName = theme === 'dark' ? 'sun' : 'moon';
            themeIcon.setAttribute('data-lucide', iconName);
            lucide.createIcons();
        }
    }

    if (themeToggleButton) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggleButton.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    if (toTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                toTopButton.classList.remove('opacity-0', 'translate-y-4');
            } else {
                toTopButton.classList.add('opacity-0', 'translate-y-4');
            }
        });

        toTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});