module.exports = {
    name: 'About 1',
    render: () => `
        <div class="about">
            <h2>This is a test mod 1</h2>
            <p id="content"></p>
        </div>
    `,
    async mount(container, context) {
        console.log('Mounting test mod 1');
        // gets the p element with id content
        const content = container.querySelector('#content');
        // content is p
        content.textContent = context.powerEagle.version;
    },
};
