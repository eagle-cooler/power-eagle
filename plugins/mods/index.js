module.exports = {
    name: 'Mods',
    render: () => `
        <div class="mods">
            <h2></h2>
            <p>Version 1.0.0</p>
        </div>
    `,
    mount: (container) => {
        // Get the h2 element and set its text
        const h2 = container.querySelector('h2');
        h2.textContent = 'Mod Index';
        
        console.log('Mods plugin mounted');
    }
};
