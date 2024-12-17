const puppeteer = require('puppeteer');

const MSI_PRODUCT_URL = "https://msivietnam.vn/laptop-van-phong"; // URL trang sản phẩm

async function crawlMSILaptopProductImages(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const imageUrls = await page.evaluate(() => {
            const productTitle = Array.from(document.querySelectorAll('a.line_2')).map(el => el.title || el.textContent.trim());
            function resolveImageURL(url, baseURL) {
                try {
                    return new URL(url, baseURL).href;
                } catch (e) {
                    return null;
                }
            }

            function extractLargestSrc(srcset) {
                if (!srcset) return null;
                const sources = srcset.split(',').map(s => s.trim());
                let largestSrc = null;
                let largestWidth = 0;
                for (const source of sources) {
                    const parts = source.split(/\s+/);
                    if (parts.length === 2) {
                        const width = parseInt(parts[1].replace('w', ''));
                        if (width > largestWidth) {
                            largestWidth = width;
                            largestSrc = parts[0];
                        }
                    }
                }
                return largestSrc;
            }
            const productImages = [];
            const baseURL = document.location.href;
            document.querySelectorAll('img.d-block').forEach(img => {
                if (img.src) {
                    productImages.push(resolveImageURL(img.src, baseURL))
                }
                if (img.dataset.src) {
                    productImages.push(resolveImageURL(img.dataset.src, baseURL))
                }
                if (img.dataset.original) {
                    productImages.push(resolveImageURL(img.dataset.original, baseURL))
                }
                if (img.srcset) {
                    const largestSrc = extractLargestSrc(img.srcset);
                    if (largestSrc) {
                        productImages.push(resolveImageURL(largestSrc, baseURL))
                    }
                }
            });
            document.querySelectorAll('[style*="background-image:"]').forEach(el => {
                const style = el.getAttribute('style');
                const match = style.match(/background-image: url\(['"]?(.*?)['"]?\)/)
                if (match && match[1]) {
                    productImages.push(resolveImageURL(match[1], baseURL));
                }
            });

            /* const resultTitle = productTitle.map(el => el.title); */
            return {
                productTitle: productTitle.map(f => f.split("|")[0].split("LAPTOP")[0]),
                productImages: productImages.filter(Boolean)
            };

        });
        const convert = imageUrls.productTitle.map((p, i) => ({
            title: p,
            images: imageUrls.productImages.filter(e => e.includes('https://bizweb.dktcdn.net/thumb/large/100/386/607/products'))[i]
        }))
        console.log(convert);
        /* console.log(imageUrls.productTitle);
        console.log(new Set(imageUrls.productImages.filter(e => e.includes('https://bizweb.dktcdn.net/thumb/large/100/386/607/products')))); */

    } catch (error) {
        console.error("Error during crawling:", error);
    } finally {
        await browser.close();
    }
}

crawlMSILaptopProductImages(MSI_PRODUCT_URL);