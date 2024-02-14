const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://community.fabric.microsoft.com/t5/forums/searchpage/tab/message/page/';
const stateFilePath = path.join(__dirname, 'lastPage.json');

// Function to load the last state
const loadState = () => {
  if (fs.existsSync(stateFilePath)) {
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8')).lastPage;
  }
  return 1; // Start from the first page if no state is saved
};

// Function to save the current state
const saveState = (page) => {
  fs.writeFileSync(stateFilePath, JSON.stringify({ lastPage: page }), 'utf8');
};

// Main scraping function
const scrapeData = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let currentPage = loadState();

  // Set up the response listener before navigating to the page
  page.on('response', async (response) => {
    const requestUrl = response.url();
    if (requestUrl.startsWith('https://community.fabric.microsoft.com/plugins/custom/microsoft/microsoftbi/cross_community_custom_field')) {
      try {
        const jsonData = await response.json();
        fs.writeFileSync(`./data/page-${currentPage}.json`, JSON.stringify(jsonData), 'utf8');
        console.log(`Data saved for page ${currentPage}`);
      } catch (error) {
        console.error('Error processing response:', error);
      }
    }
  });

  try {
    for (; currentPage <= 201; currentPage++) {
      const url = `${baseUrl}${currentPage}?filter=location,solvedThreads&noSynonym=false&advanced=true&solved=true&location=forum-board:power-bi-services&collapse_discussion=true&search_type=thread&search_page_size=50`;
      console.log(`Navigating to page ${currentPage}...`);
      console.log(url);
      await page.goto(url, { waitUntil: 'networkidle2' });
    
      // Logic to ensure the page has fully loaded, if necessary

      saveState(currentPage + 1);

      // Logic to delay between page navigations to mimic human behavior and prevent rate limiting
    //   await page.waitForTimeout(1000); // Wait for 1 second; adjust as necessary
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
    console.log('Scraping finished.');
  }
};

// Start the scraping process
scrapeData().then(() => console.log('Done'));
