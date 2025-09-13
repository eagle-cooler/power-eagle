const h=async u=>{const{eagle:i,powersdk:v}=u,{storage:g,container:t,CardManager:p}=v;console.log("Basic plugin loaded - SDK Demonstrations"),t.innerHTML=`
    <div class="basic-demo-container max-w-6xl mx-auto p-6">
      <div class="header mb-6">
        <h1 class="text-3xl font-bold mb-2">Power Eagle SDK Demo</h1>
        <p class="text-gray-600">Demonstrating Eagle API, CardManager, and Storage</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Eagle API Demo -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Eagle API Demo</h2>
            <p class="mb-4">Test Eagle notifications and basic functionality</p>
            <button class="btn btn-primary" id="eagle-demo-button">
              Show Eagle Notification
            </button>
          </div>
        </div>

        <!-- CardManager Demo -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">CardManager Demo</h2>
            <p class="mb-4">Demonstrate card layout functionality</p>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" id="add-sample-card">Add Card</button>
              <button class="btn btn-warning btn-sm" id="clear-cards">Clear</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Storage Demo -->
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body">
          <h2 class="card-title mb-4">Storage Demo</h2>
          <div class="flex gap-2 mb-4">
            <input type="text" id="storage-key" placeholder="Key" class="input input-bordered input-sm">
            <input type="text" id="storage-value" placeholder="Value" class="input input-bordered input-sm">
            <button class="btn btn-primary btn-sm" id="save-storage">Save</button>
            <button class="btn btn-secondary btn-sm" id="load-storage">Load</button>
          </div>
          <div id="storage-display" class="text-sm text-gray-600"></div>
        </div>
      </div>
      
      <!-- Card Results -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Card Results</h3>
        <div id="demo-results" class="card-container">
          <p class="text-center py-8 text-gray-500">Click "Add Card" to see CardManager in action</p>
        </div>
      </div>
    </div>
  `;const y=t.querySelector("#demo-results"),m=new p(y),d=t.querySelector("#eagle-demo-button");d==null||d.addEventListener("click",async()=>{await i.notification.show({title:"Eagle API Working!",description:"This notification comes from the Eagle API"})});const n=t.querySelector("#add-sample-card"),r=t.querySelector("#clear-cards");n==null||n.addEventListener("click",()=>{const a=`sample-${Date.now()}`;m.addCardToContainer({id:a,title:`Sample Card ${Math.floor(Math.random()*100)}`,subtitle:"This is a sample card with random content",content:`
        <div class="space-y-2">
          <p>This card demonstrates the CardManager functionality.</p>
          <p class="text-sm text-gray-600">Created at: ${new Date().toLocaleTimeString()}</p>
        </div>
      `,status:"primary",actions:[{id:`action-${a}`,text:"Sample Action",onClick:()=>{i.notification.show({title:"Card Action",description:"This action comes from a CardManager card!"})},variant:"primary"}]})}),r==null||r.addEventListener("click",()=>{m.clearCards(),i.notification.show({title:"Cards Cleared",description:"All demo cards have been removed"})});const c=t.querySelector("#save-storage"),l=t.querySelector("#load-storage"),e=t.querySelector("#storage-key"),o=t.querySelector("#storage-value"),b=t.querySelector("#storage-display");c==null||c.addEventListener("click",()=>{const a=e==null?void 0:e.value,s=o==null?void 0:o.value;a&&s&&(g.set(a,s),i.notification.show({title:"Storage Saved",description:`Saved "${a}" = "${s}"`}),e.value="",o.value="")}),l==null||l.addEventListener("click",()=>{const a=e==null?void 0:e.value;if(a){const s=g.get(a);s!==null?(b.textContent=`"${a}" = "${s}"`,o.value=s):b.textContent=`"${a}" not found`}})};export{h as plugin};
