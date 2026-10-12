import assert from 'node:assert/strict';
import { memberEntryUrl } from '../shared/member-entry.js';
const visit = {pathname:'/',search:'',hash:'',topLevel:true,user:{id:'member'}};
assert.equal(memberEntryUrl(visit),'/standalone/member-design-test.html');
for(const patch of [{user:null},{user:{id:'preview'}},{topLevel:false},{search:'?masterInline=goals'},{search:'?citadelNote=1'},{search:'?page=admin'},{search:'?code=callback'},{hash:'#access_token=callback'},{pathname:'/standalone/member-design-test.html'}]) {
  assert.equal(memberEntryUrl({...visit,...patch}),null);
}
console.log('PASS: current member entry; no guest, preview, embedded, explicit-route or auth-callback redirects.');
