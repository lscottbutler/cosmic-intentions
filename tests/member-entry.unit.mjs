import assert from 'node:assert/strict';
import { memberEntryUrl, memberToolUrl } from '../shared/member-entry.js';
const visit = {pathname:'/',search:'',hash:'',topLevel:true,user:{id:'member'}};
assert.equal(memberEntryUrl(visit),'/standalone/member-design-test.html');
for(const patch of [{user:null},{user:{id:'preview'}},{topLevel:false},{search:'?masterInline=goals'},{search:'?citadelNote=1'},{search:'?page=admin'},{search:'?code=callback'},{hash:'#access_token=callback'},{pathname:'/standalone/member-design-test.html'}]) {
  assert.equal(memberEntryUrl({...visit,...patch}),null);
}
console.log('PASS: current member entry; no guest, preview, embedded, explicit-route or auth-callback redirects.');

for (const [id,feature] of Object.entries({dashboard:'home',setup:'goals',habits:'daily-habits',dailyfocus:'favorites',notes:'thoughts',mynotes:'journal',tasknotes:'task-notes',goalworkspace:'goal-workspace',myroadmap:'action-plan',vizlibrary:'visualization',meditation:'meditation',gratitude:'gratitude',wins:'wins',cosmiclibrary:'cosmic-library',admin:'admin'})) assert.equal(memberToolUrl(id), '/standalone/member-design-test.html?feature='+feature);
assert.equal(memberToolUrl('home'),null,'welcome remains its own page');
assert.equal(memberToolUrl('unknown'),null);
console.log('PASS current destinations for welcome page navigation');
