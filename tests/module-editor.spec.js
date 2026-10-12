import {test,expect} from '@playwright/test';

for(const width of [1440,390]) test(`module editor preserves title cards and ten minutes ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.goto('/standalone/module-editor.html');
 await expect(page.locator('#cards .card')).toHaveCount(10);
 await page.locator('#add').click();
 await expect(page.locator('#cards .card')).toHaveCount(11);
 await page.locator('#cards .card').nth(1).getByRole('button',{name:'Delete',exact:true}).click();
 await page.locator('#slide-list .slide-list-item').nth(3).click();
 await page.locator('#cards .card').nth(3).getByRole('button',{name:'Insert title card after'}).click();
 await page.getByLabel('Title card text',{exact:true}).fill('Return gently');
 await expect(page.locator('#status')).toContainText('Draft saved');
 await page.reload();
 await expect(page.getByLabel('Title card text',{exact:true})).toHaveValue('Return gently');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 await page.locator('#narration-delay').fill('5');
 await page.locator('#narration-delay').press('Tab');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 await page.locator('#sound').uncheck();
 await expect.poll(()=>page.evaluate(()=>mount())).toBe(true);
 await page.evaluate(()=>seekPreview(215));
 await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent)).toBe('Return gently');
 await expect(page.locator('#timeline-focus')).toContainText('Current slide 5');
 await page.getByRole('heading',{name:'Title card 5',exact:true}).locator('..').getByRole('button',{name:'Delete',exact:true}).click();
 await expect(page.locator('#cards .card')).toHaveCount(10);
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 await expect(page.locator('#status')).toContainText('Draft saved');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('storage failure keeps editor text and reports unsaved status',async({page})=>{
 await page.goto('/standalone/module-editor.html');
 await page.locator('#slide-list .slide-list-item').first().click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Storage full','QuotaExceededError')};});
 await page.locator('#cards .card').first().getByRole('button',{name:'Insert title card after'}).click();
 await page.getByLabel('Title card text',{exact:true}).fill('Keep this unsaved title');
 await expect(page.locator('#status')).toContainText('could not be saved');
 await expect(page.getByLabel('Title card text',{exact:true})).toHaveValue('Keep this unsaved title');
 await expect(page.getByRole('button',{name:'Download backup'})).toBeEnabled();
});
