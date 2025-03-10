module.exports = {
    name: 'About',
    render: () => `
        <div class="about">
            <h2>Power Eagle</h2>
            <p>
                This is a plugin for power users and developers and can be easily extended to do more.
            </p>
            
        </div>
    `,
    mount: async (container) => {
        // Initialization logic here
        console.log('About plugin mounted');
        
        const aboutText = document.createElement('p');
        container.querySelector('.about').appendChild(aboutText);
        container.appendChild(document.createElement('br'));
        // Update function that will run every second
        async function updateInfo() {
            const currentLibrary = eagle.library.path;
            let selectedItem = "";
            const currentSelected = await eagle.item.getSelected();
            for (const item of currentSelected) {
                selectedItem += item.name + ", ";
            }
            
            aboutText.textContent = `Current Library: ${currentLibrary}Current Selected: ${selectedItem}`;
        }

        // Initial update
        await updateInfo();

        // Set interval to update every second
        const intervalId = setInterval(updateInfo, 1000);

        // Clean up interval when component unmounts
        return () => clearInterval(intervalId);
    }
};
