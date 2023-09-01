import { chromium } from 'playwright';
import { Actor } from 'apify';

(async () => {
    try {
        await Actor.init();

        const input = await Actor.getInput();
        const { baseUrl, pageCount } = input;

        const browser = await chromium.launch();
        const context = await browser.newContext();

        const clients = [];

        for (let page = 1; page <= pageCount; page++) {
            const url = `${baseUrl}?p.Page=${page}`;
            const pageObj = await context.newPage();
            await pageObj.goto(url);

            const clientElements = await pageObj.$$('.list-item-wrapper.list-item-reference');

            for (const element of clientElements) {
                const headingText = await element.$('.list-item-heading');
                const annotationText = await element.$('.list-item-anotation');
                const contentText = await element.$('.overlay-txt.ddd');
                const linkElement = await element.$('.overlay-link a');
                const imageElement = await element.$('.list-item-image');

                if (headingText && annotationText && contentText && linkElement && imageElement) {
                    const heading = await headingText.textContent();
                    const annotation = await annotationText.textContent();
                    const content = await contentText.textContent();

                    const link = await linkElement.getAttribute('href');
                    const img = await imageElement.getAttribute('data-src');

                    clients.push({
                        Name: heading.trim(),
                        Annotation: annotation.trim(),
                        Content: content.trim(),
                        Link: link,
                        Image: img,
                    });
                }
            }

            await pageObj.close();
        }

        const totalItems = clients.length;

        const jsonObject = {
            TotalItems: totalItems,
            Clients: clients,
        };

        await Actor.pushData(jsonObject);

        await browser.close();

        await Actor.exit();
    } catch (error) {
        console.error('Error:', error);
    }
})();
