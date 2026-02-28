import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    const base = 'http://localhost:3001';
    console.log('Opening', base + '/login');
    await page.goto(base + '/login', { waitUntil: 'networkidle2' });

    // Click staff tab (second tab-button)
    await page.waitForSelector('.user-type-tabs .tab-button');
    const tabs = await page.$$('.user-type-tabs .tab-button');
    if (tabs.length > 1) await tabs[1].click();

    // Fill login
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    const submitBtn = await page.$('button[type=submit]');
    if (submitBtn) await submitBtn.click();
    
    // Wait longer for redirect to complete
    console.log('Waiting for redirect after login...');
    await new Promise(r => setTimeout(r, 3000));
    const currentUrl = page.url();
    console.log('After login, current URL:', currentUrl);

    console.log('Navigating to admin activities');
    await page.goto(base + '/admin/activities', { waitUntil: 'networkidle2' });

    // Wait for the table to load (wait for loading to finish or table to have tbody rows)
    let tableReady = false;
    for (let i = 0; i < 30; i++) {
      const rowCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
      if (rowCount > 0) {
        tableReady = true;
        console.log(`Table ready with ${rowCount} rows`);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Wait for Add button and click
    await page.waitForSelector('button', { visible: true });
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Thêm Hoạt Động') || text.includes('➕')) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked && buttons.length > 0) {
      await buttons[0].click();
    }

    // Fill modal fields
    await page.waitForSelector('input[type="text"]', { visible: true });
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const type = await (await input.getProperty('type')).jsonValue();
      const name = await (await input.getProperty('name')).jsonValue();
      if (type === 'text') {
        await input.click({ clickCount: 3 });
        await input.type('E2E Activity');
        break;
      }
    }

    // Submit form: find submit button inside modal
    const buttons2 = await page.$$('button');
    let formSubmitBtn = null;
    for (const btn of buttons2) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Thêm') || text.includes('Cập Nhật')) {
        formSubmitBtn = btn;
        break;
      }
    }
    if (formSubmitBtn) {
      await Promise.all([
        formSubmitBtn.click(),
        new Promise(r => setTimeout(r, 500))
      ]);
    } else {
      const allBtns = await page.$$('button');
      if (allBtns.length > 0) await allBtns[allBtns.length-1].click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Wait for table to update after form submission (wait for new row to appear)
    await new Promise(r => setTimeout(r, 1000));
    for (let i = 0; i < 30; i++) {
      const rowCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
      if (rowCount > 0) {
        console.log(`After submit: table has ${rowCount} rows`);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    const debug = await page.evaluate(() => {
      const pre = document.querySelector('pre');
      const count = document.querySelectorAll('table tbody tr').length;
      const rows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
      const color = document.querySelector('table tbody tr td') ? getComputedStyle(document.querySelector('table tbody tr td')).color : null;
      
      // Extra diagnostics
      const heading = document.querySelector('h2');
      const activityCountDiv = document.querySelector('div:has(> strong)');
      const pageText = document.body.innerText.substring(0, 500);
      const tableExists = !!document.querySelector('table');
      const tableBodyExists = !!document.querySelector('table tbody');
      
      return { 
        pre: pre ? pre.innerText : null, 
        count, rows, color,
        heading: heading ? heading.innerText : null,
        activityCountText: activityCountDiv ? activityCountDiv.innerText : null,
        pageSnapshot: pageText,
        tableExists,
        tableBodyExists
      };
    });

    console.log('E2E RESULT:', JSON.stringify(debug, null, 2));
    await page.screenshot({ path: 'e2e_admin_activities.png', fullPage: true });
    console.log('Screenshot saved to e2e_admin_activities.png');
  } catch (err) {
    console.error('E2E ERROR', err);
  } finally {
    await browser.close();
  }
}

run();
