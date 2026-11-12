import { test, expect } from '@playwright/test';
for (const width of [1040,390]) test(`Hide and restore goals without deleting ${width}`, async ({page},testInfo) => {
  await page.setViewportSize({width,height:1000});
  const writes=[];
  await page.route('**/*.supabase.co/**',route=>{
    if(route.request().method()!=='GET'&&route.request().method()!=='OPTIONS')writes.push(route.request().method()+" "+new URL(route.request().url()).pathname);
    return route.fulfill({contentType:'application/json',body:'[]'});
  });
  await page.goto('/standalone/member-design-test.html?feature=goals');
  const frame=page.frameLocator('#ci-review-frame').frameLocator('#experienceFrame');
  const cards=frame.locator('#pbIntentionList details');
  await expect(cards).toHaveCount(3);
  const title=await cards.first().locator('.pb-goal-title').innerText();
  await frame.getByRole('button',{name:'Hide Goal A',exact:true}).click();
  await expect(cards).toHaveCount(2);
  await page.reload();
  await expect(cards).toHaveCount(2);
  await frame.getByRole('button',{name:'Show hidden goals (1)',exact:true}).click();
  await expect(cards).toHaveCount(3);
  await expect(cards.first().locator('.pb-goal-title')).toHaveText(title);
  await cards.first().screenshot({path:testInfo.outputPath('hide-goal.png')});
  expect(writes.filter(method => method.startsWith('DELETE'))).toEqual([]);
});
