
async function updateTheme() {
	const THEME_SUPPORT = {
		AUTO: eagle.app.isDarkColors() ? 'gray' : 'light',
		LIGHT: 'light',
		LIGHTGRAY: 'lightgray',
		GRAY: 'gray',
		DARK: 'dark',
		BLUE: 'blue',
		PURPLE: 'purple',
	};

	const theme = eagle.app.theme.toUpperCase();
	const themeName = THEME_SUPPORT[theme] ?? 'dark';
	const htmlEl = document.querySelector('html');

	htmlEl.classList.add('no-transition');
	htmlEl.setAttribute('theme', themeName);
	htmlEl.setAttribute('platform', eagle.app.platform);
	htmlEl.classList.remove('no-transition');
}

eagle.onPluginCreate(() => {
	updateTheme();
});

eagle.onThemeChanged(() => {
	updateTheme();
});


