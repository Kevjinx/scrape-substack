import puppeteer from 'puppeteer'
import fs from 'fs'



const scrapeInfiniteScrollItems = async (page, itemTargetCount) => {
  let extractedItems = []
  while (itemTargetCount > extractedItems.length) {

    extractedItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.post-preview'));
      return items.map(item => item.querySelector('a').href);
    })

    const previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
    await page.waitForTimeout(1000);
  }
  return extractedItems;
}


const scrollToBottom = async (page) => {
  const result = await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    });
    const elements = Array.from(document.querySelectorAll('.post-preview'));
    console.log(elements)

    const getItems = (element) => {
      console.log(element)
      try {
        const title = element.querySelector('div.post-preview-content > a.post-preview-title.newsletter').innerText
        const link = element.querySelector('div.post-preview-content > a').href
        const date = element.querySelector('div.post-preview-content > div > div.ufi-preamble > div.ufi-preamble-label.post-date > time').innerText
        const likes = element.querySelector('div.post-preview-content > div > div.like-button-container > a > div')
        const likeCounts = likes ? Number(likes.innerText) : 0
        const comments = element.querySelector('div.post-preview-content > div > a.post-ufi-button.style-compressed.post-ufi-comment-button.has-label.with-border > div')
        const commentCounts = comments ? Number(comments.innerText) : 0

        return { title, link, date, likeCounts, commentCounts }

      } catch (error) {
        console.log(element)
        console.log(error)
      }
    }

    return elements.map(element => getItems(element));
  });


  return result;
}


const scrapePosts = async () => {
  try {
    const url = 'https://unchainedcrypto.substack.com/archive'
    const browser = await puppeteer.launch({ headless: false});
    const page = await browser.newPage();
    await page.goto(url);
    const result = await scrollToBottom(page);
    await browser.close();
    fs.writeFileSync('posts.json', JSON.stringify(result));
  } catch (error) {
    console.log(error)
  }

}

scrapePosts()
