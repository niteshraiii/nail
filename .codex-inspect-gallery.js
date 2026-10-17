const fs = require('fs');
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 1440);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || 1200);
const isMobile = process.env.VIEWPORT_MOBILE === 'true';
const screenshotPath = process.env.SCREENSHOT_PATH || 'gallery-cdp-desktop.png';

async function closeBrowser() {
  const version = await fetch('http://localhost:9223/json/version').then((response) => response.json());
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
}

if (process.env.CLOSE_BROWSER === 'true') {
  closeBrowser().catch(() => undefined);
  return;
}

async function main() {
  const target = await fetch('http://localhost:9223/json/new?http://localhost:3006/', {
    method: 'PUT'
  }).then((response) => response.json());

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const message = { id: ++id, method, params };
      pending.set(message.id, { resolve, reject });
      ws.send(JSON.stringify(message));
    });
  }

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);

      if (data.error) {
        reject(new Error(JSON.stringify(data.error)));
        return;
      }

      resolve(data);
    }
  });

  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 1,
    mobile: isMobile
  });
  await send('Page.navigate', { url: 'http://localhost:3006/' });
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const expression = `
    (async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const gallery = document.querySelector('#gallery');

      if (gallery) {
        gallery.scrollIntoView({ block: 'start' });
      }

      await wait(1400);

      const box = (selector) => {
        const element = document.querySelector(selector);

        if (!element) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);

        return {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: styles.display,
          opacity: styles.opacity,
          visibility: styles.visibility,
          transform: styles.transform,
          overflow: styles.overflow,
          color: styles.color,
          backgroundColor: styles.backgroundColor
        };
      };

      const items = [...document.querySelectorAll('.gallery-3d-item')].map((element, index) => {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        const image = element.querySelector('img');
        const figure = element.querySelector('figure');
        const figureRect = figure ? figure.getBoundingClientRect() : null;

        return {
          index,
          title: element.dataset.galleryTitle,
          html: element.outerHTML.slice(0, 1200),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          figure: figureRect
            ? {
                top: Math.round(figureRect.top),
                left: Math.round(figureRect.left),
                width: Math.round(figureRect.width),
                height: Math.round(figureRect.height)
              }
            : null,
          display: styles.display,
          opacity: styles.opacity,
          visibility: styles.visibility,
          transform: styles.transform,
          zIndex: styles.zIndex,
          ariaHidden: element.getAttribute('aria-hidden'),
          complete: image ? image.complete : null,
          naturalWidth: image ? image.naturalWidth : null
        };
      });

      return {
        scrollY: Math.round(scrollY),
        innerWidth,
        innerHeight,
        hash: location.hash,
        gallery: box('#gallery'),
        header: box('.gallery-3d-header'),
        stage: box('.gallery-3d-stage'),
        footer: box('.gallery-3d-footer'),
        caption: box('.gallery-3d-caption'),
        items
      };
    })()
  `;

  const evalResult = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  console.log(JSON.stringify(evalResult.result.result.value, null, 2));

  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });

  fs.writeFileSync(screenshotPath, Buffer.from(screenshot.result.data, 'base64'));
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
