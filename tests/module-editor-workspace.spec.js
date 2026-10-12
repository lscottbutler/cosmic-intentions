import {test,expect} from '@playwright/test';

function recording() {
 const samples=8000,buffer=Buffer.alloc(44+samples*2);buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(8000,24);buffer.writeUInt32LE(16000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.sin(i/8000*440*Math.PI*2)*1000),44+i*2);return buffer;
}

for(const width of [1440,390])test(`all slides stay visible and new text synchronizes at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/standalone/module-editor.html');
 await expect(page.locator('#slide-list .slide-list-item')).toHaveCount(10);
 await page.locator('#slide-list .slide-list-item').nth(2).click();
 await page.locator('#cards .card').nth(2).getByRole('button',{name:'Insert title card after'}).click();
 await page.getByLabel('Title card text',{exact:true}).fill('New slide appears everywhere');
 await expect(page.locator('#slide-list .slide-list-item')).toHaveCount(11);
 await expect(page.locator('.slide-region:visible')).toHaveCount(11);
 await expect(page.locator('.narration-slot:visible')).toHaveCount(11);
 await expect(page.locator('.slide-region').first()).toContainText('Slide 1');
 await expect(page.locator('.slide-region').nth(1)).toContainText('Slide 2');
 await expect(page.locator('.slide-region.current-slide')).toContainText('New slide appears everywhere');
 await expect(page.locator('#slide-list .selected')).toContainText('New slide appears everywhere');
 await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent)).toBe('New slide appears everywhere');
 await expect(page.locator('.narration-slot').nth(3)).toContainText('No recording');
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 await page.locator('#slide-list .slide-list-item').nth(3).click();
 await expect(page.getByLabel('Title card text',{exact:true})).toHaveValue('New slide appears everywhere');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/editor-workspace-${width}.png`,fullPage:true});
});

test('new slide accepts actual narration, plays it and keeps it after reload',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#add').click();
 const card=page.locator('#cards .card').nth(1);
 await card.getByLabel('On-screen instruction',{exact:true}).fill('Synthetic narration test');
 await card.getByLabel('Upload narration',{exact:true}).setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:recording()});
 await expect(page.locator('.narration-slot').nth(1)).toContainText('Uploaded narration');
 await expect(page.locator('#status')).toContainText('Draft saved');
 await page.evaluate(()=>seekPreview(boundaries()[1].start));await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>cardAudio&&!cardAudio.paused&&cardAudio.currentTime>0)).toBe(true);
 await page.locator('#stop').click();await page.reload();
 await expect(page.locator('.narration-slot').nth(1)).toContainText('Uploaded narration');
 await expect(page.locator('#cards .card').nth(1).locator('audio')).toHaveAttribute('src',/^data:audio/);
 await page.locator('#slide-list .slide-list-item').nth(1).click();
 await page.locator('#cards .card').nth(1).getByRole('button',{name:'Delete',exact:true}).click();
 await expect(page.locator('.slide-region')).toHaveCount(10);await expect(page.locator('.narration-slot')).toHaveCount(10);
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
});

test('unreadable existing draft is preserved until explicit save',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('ci-module-editor-10m-v1','not-readable'));
 await page.goto('/standalone/module-editor.html');await page.locator('#title').fill('Safe recovery check');await page.locator('#title').press('Tab');
 await expect(page.locator('#status')).toContainText('Automatic saving paused');
 expect(await page.evaluate(()=>localStorage.getItem('ci-module-editor-10m-v1'))).toBe('not-readable');
});

test('playback pauses, resumes, restarts the opening and completes at ten minutes',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>running&&!paused&&elapsed>0)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent)).toBe('MEDITATIONS');
 await page.locator('#play').click();const at=await page.evaluate(()=>elapsed);await page.waitForTimeout(200);
 expect(await page.evaluate(()=>elapsed)).toBeCloseTo(at,1);
 await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>elapsed)).toBeGreaterThan(at);
 await page.locator('#restart').click();expect(await page.evaluate(()=>elapsed)).toBeLessThan(1);
 await page.evaluate(()=>seekPreview(599.9));await expect(page.locator('#progress')).toHaveText('Session complete');
 await expect(page.locator('#playhead-time')).toHaveText('10:00.0');
});

test('changed uploaded narration text cannot be played through seeking',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#add').click();const card=page.locator('#cards .card').nth(1);
 await card.getByLabel('On-screen instruction',{exact:true}).fill('Recorded wording');
 await card.getByLabel('Upload narration',{exact:true}).setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:recording()});
 await expect(page.locator('.narration-slot').nth(1)).toContainText('Uploaded narration');
 await page.locator('#cards .card').nth(1).getByLabel('On-screen instruction',{exact:true}).fill('Different wording');
 await page.evaluate(()=>seekPreview(boundaries()[1].start));await page.locator('#play').click();
 await expect(page.locator('#status')).toContainText('replace its uploaded narration');
 expect(await page.evaluate(()=>paused)).toBe(true);
});

test('typed uploaded narration duration trims playback and survives reload',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#add').click();let card=page.locator('#cards .card:visible');
 await card.getByLabel('On-screen instruction',{exact:true}).fill('Trimmed recording');
 await card.getByLabel('Upload narration',{exact:true}).setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:recording()});
 await expect(page.locator('.narration-slot').nth(1)).toContainText('Uploaded narration');
 await page.getByLabel('Narration duration (seconds)',{exact:true}).fill('0.4');await page.getByLabel('Narration duration (seconds)',{exact:true}).press('Tab');
 await expect(page.getByLabel('Slide 2 narration duration',{exact:true})).toHaveValue('0.4');
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 await expect(page.getByLabel('Slide 2 narration duration',{exact:true})).toHaveValue('0.4');
 await page.evaluate(()=>seekPreview(boundaries()[1].start));await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>cardAudio&&!cardAudio.paused)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>elapsed>boundaries()[1].start+.4&&cardAudio===null)).toBe(true);
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
});
