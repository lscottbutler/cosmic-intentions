let bridge;
export async function recordMeditation(seconds,session){
 if(!bridge){bridge=document.createElement('iframe');bridge.hidden=true;bridge.title='Private session tracking';bridge.src='/?usageBridge=1';document.body.append(bridge);}
 for(let i=0;i<100;i++){if(bridge.contentWindow?.CIUsage)return bridge.contentWindow.CIUsage.complete(seconds,session);await new Promise(r=>setTimeout(r,100));}
 throw Error('Your session could not be saved.');
}
