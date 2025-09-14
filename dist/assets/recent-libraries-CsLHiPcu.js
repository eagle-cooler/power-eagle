var f={};const E=async b=>{const{eagle:a,powersdk:c}=b;console.log("Recent Libraries plugin loaded");let n=[],u=null,s=null;v();async function v(){c.container.innerHTML=`
      <div class="recent-libraries-container max-w-5xl mx-auto p-5">
        <div class="header mb-5">
          <h1 class="text-2xl font-bold mb-2">Recent Libraries</h1>
          <p class="text-gray-600">View and manage your recent Eagle libraries</p>
        </div>
        
        <div class="controls mb-5">
          <div class="flex gap-4 items-center">
            <div class="flex-1">
              <input 
                type="text" 
                id="library-search" 
                placeholder="Filter libraries..." 
                class="input input-bordered w-full"
              >
            </div>
            <button id="refresh-libraries" class="btn btn-secondary">Refresh</button>
            <button id="clear-invalid" class="btn btn-warning">Clear Invalid</button>
          </div>
        </div>
        
        <div class="content-section">
          <div id="library-results" class="card-container space-y-2">
            <p class="loading text-center py-4">Loading libraries...</p>
          </div>
        </div>
      </div>
    `;const e=c.container.querySelector("#library-results");s=new c.visual.CardManager(e),m(),await p()}function m(){const e=c.container.querySelector("#library-search"),t=c.container.querySelector("#refresh-libraries"),r=c.container.querySelector("#clear-invalid");e&&e.addEventListener("input",o=>{const i=o.target.value.toLowerCase();u&&clearTimeout(u),u=setTimeout(()=>{g(i)},300)}),t&&t.addEventListener("click",()=>{p()}),r&&r.addEventListener("click",()=>{C()})}async function p(){try{const e=await w();n=await Promise.all(e.map(async(t,r)=>{const o=await y(t),i=t.split("/"),l=i[i.length-1].replace(".library","");return{id:`lib_${r}`,name:l,path:t,lastAccessed:new Date,status:o?"valid":"invalid"}})),d(n)}catch(e){console.error("Failed to load libraries:",e),F("Failed to load libraries")}}async function w(){try{const e=require("process"),r=`${e.env.APPDATA||(e.platform==="darwin"?e.env.HOME+"/Library/Application Support":e.env.HOME+"/.local/share")}/eagle/Settings`,i=require("fs").readFileSync(r,"utf8");return JSON.parse(i).libraryHistory||[]}catch(e){return console.error("Failed to read recent libraries:",e),[]}}async function y(e){try{return await require("fs").promises.access(e),!0}catch{return!1}}function d(e){if(s){if(s.clearCards(),e.length===0){s.addCardToContainer({id:"no-libraries",title:"No Libraries Found",content:'<p class="text-gray-500">No libraries match your search criteria.</p>',status:"info"});return}e.forEach(t=>{const r=t.status==="valid"?"success":"error",o=new Date(t.lastAccessed).toLocaleDateString();s.addCardToContainer({id:`library-${t.id}`,title:t.name,subtitle:`Last accessed: ${o}`,content:`
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600 break-all flex-1 mr-2">${t.path}</p>
            <span class="badge badge-sm ${r==="success"?"badge-success":"badge-error"}">${t.status}</span>
          </div>
        `,status:r,actions:[{id:`open-${t.id}`,text:"Open Library",onClick:()=>L(t),variant:"primary"},{id:`remove-${t.id}`,text:"Remove",onClick:()=>x(t),variant:"error"}]})})}}function g(e){if(!e.trim()){d(n);return}const t=n.filter(r=>r.name.toLowerCase().includes(e)||r.path.toLowerCase().includes(e));d(t)}async function L(e){try{a.notification.show({title:"Opening Library",description:`Opening ${e.name}...`}),await $(e.path),a.notification.show({title:"Library Opened",description:`Successfully opened ${e.name}`})}catch(t){console.error("Failed to open library:",t),a.notification.show({title:"Error",description:`Failed to open ${e.name}`})}}async function $(e){try{await c.webapi.library.switch(e),a.notification.show({title:"Library Switched",description:`Successfully switched to library at ${e}`})}catch(t){throw console.error("Failed to switch library:",t),a.notification.show({title:"Switch Failed",description:`Failed to switch to library at ${e}`}),t}}function x(e){confirm(`Remove library "${e.name}" from recent list?`)&&(n=n.filter(t=>t.id!==e.id),d(n),a.notification.show({title:"Library Removed",description:`${e.name} removed from recent libraries`}))}async function C(){const e=n.filter(t=>t.status==="invalid").length;if(e===0){a.notification.show({title:"No Invalid Libraries",description:"All libraries are valid"});return}if(confirm(`Remove ${e} invalid libraries from recent list?`))try{await S(),await p(),a.notification.show({title:"Invalid Libraries Cleared",description:`Removed ${e} invalid libraries`})}catch(t){console.error("Failed to clear invalid libraries:",t),a.notification.show({title:"Error",description:"Failed to clear invalid libraries"})}}async function S(){try{const t=`${f.APPDATA||(process.platform==="darwin"?f.HOME+"/Library/Application Support":f.HOME+"/.local/share")}/eagle/Settings`,r=require("fs"),o=r.readFileSync(t,"utf8"),i=JSON.parse(o),l=[];for(const h of i.libraryHistory)await y(h)&&l.push(h);return i.libraryHistory=l,r.writeFileSync(t,JSON.stringify(i,null,2)),l}catch(e){throw console.error("Failed to clear invalid paths:",e),e}}function F(e){s&&(s.clearCards(),s.addCardToContainer({id:"error",title:"Error",content:`<p class="text-red-600">${e}</p>`,status:"error"}))}};export{E as plugin};
