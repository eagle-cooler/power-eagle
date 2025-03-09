module.exports = {
    name: 'About',
    render: () => `
        <div class="about">
            <h2>About This Plugin</h2>
            <p>Version 1.0.0</p>
        </div>
    `,
    mount: (container) => {
        // Initialization logic here
        console.log('About plugin mounted');
    }
};
