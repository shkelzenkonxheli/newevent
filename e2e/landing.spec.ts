import { expect, test } from "@playwright/test";

test("the landing page defaults to Danish and can switch to English at 360px",async ({page})=>{
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang","da");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Gode planer starter sammen.");
  await page.getByRole("button",{name:"English"}).click();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Good plans start together.");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
});

test("the account page has labeled credentials",async ({page})=>{
  await page.goto("/sign-in");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Adgangskode")).toBeVisible();
});
