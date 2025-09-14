const x=async p=>{const{eagle:n,powersdk:t}=p;console.log("Basic plugin loaded - SDK Demonstrations"),t.container.innerHTML=`
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

      <!-- Button Component Demo -->
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body">
          <h2 class="card-title mb-4">Button Component Demo</h2>
          <p class="mb-4">Demonstrate the new Button class functionality</p>
          <div id="button-demo-container" class="flex gap-2 flex-wrap">
            <!-- Buttons will be added here programmatically -->
          </div>
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
  `;const v=t.container.querySelector("#demo-results"),b=new t.visual.CardManager(v),c=t.container.querySelector("#eagle-demo-button");c==null||c.addEventListener("click",async()=>{await n.notification.show({title:"Eagle API Working!",description:"This notification comes from the Eagle API"})});const d=t.container.querySelector("#add-sample-card"),l=t.container.querySelector("#clear-cards");d==null||d.addEventListener("click",()=>{const e=`sample-${Date.now()}`;b.addCardToContainer({id:e,title:`Sample Card ${Math.floor(Math.random()*100)}`,subtitle:"This is a sample card with random content",content:`
        <div class="space-y-2">
          <p>This card demonstrates the CardManager functionality.</p>
          <p class="text-sm text-gray-600">Created at: ${new Date().toLocaleTimeString()}</p>
        </div>
      `,status:"primary",actions:[{id:`action-${e}`,text:"Sample Action",onClick:()=>{n.notification.show({title:"Card Action",description:"This action comes from a CardManager card!"})},variant:"primary"}]})}),l==null||l.addEventListener("click",()=>{b.clearCards(),n.notification.show({title:"Cards Cleared",description:"All demo cards have been removed"})});const u=t.container.querySelector("#save-storage"),m=t.container.querySelector("#load-storage"),o=t.container.querySelector("#storage-key"),s=t.container.querySelector("#storage-value"),g=t.container.querySelector("#storage-display");u==null||u.addEventListener("click",()=>{const e=o==null?void 0:o.value,a=s==null?void 0:s.value;e&&a&&(t.storage.set(e,a),n.notification.show({title:"Storage Saved",description:`Saved "${e}" = "${a}"`}),o.value="",s.value="")}),m==null||m.addEventListener("click",()=>{const e=o==null?void 0:o.value;if(e){const a=t.storage.get(e);a!==null?(g.textContent=`"${e}" = "${a}"`,s.value=a):g.textContent=`"${e}" not found`}});const i=t.container.querySelector("#button-demo-container"),y=new t.visual.Button({text:"Primary Button",variant:"primary",onClick:()=>{n.notification.show({title:"Primary Button",description:"You clicked the primary button!"})}}),h=new t.visual.Button({text:"Secondary",variant:"secondary",size:"sm",onClick:()=>{n.notification.show({title:"Secondary Button",description:"Small secondary button clicked!"})}}),C=new t.visual.Button({text:"Success",variant:"success",onClick:()=>{n.notification.show({title:"Success!",description:"This is a success notification"})}}),r=new t.visual.Button({text:"Enable Feature",variant:"warning",onClick:()=>{const a=r.getElement().textContent==="Disable Feature";r.setText(a?"Enable Feature":"Disable Feature"),r.setVariant(a?"warning":"error"),n.notification.show({title:a?"Feature Disabled":"Feature Enabled",description:`Feature is now ${a?"disabled":"enabled"}`})}});i&&(i.appendChild(y.getElement()),i.appendChild(h.getElement()),i.appendChild(C.getElement()),i.appendChild(r.getElement()))};export{x as plugin};
