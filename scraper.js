import moment from 'moment'
import playwright from 'playwright'

const paginationSelector = '.styles__PaginationNumbers-sc-54p2uy-5'

async function runScaper() {
  console.log('Running Scrapper At ', new Date().toISOString())
  const browser = await await playwright.chromium.launch({
    headless: true, // Show the browser.
  })
  const page = await browser.newPage()
  async function scrapeUrl(propertyUrl) {
    console.log('scraping', propertyUrl.url)
    const startedTime = new Date().getTime()
    await page.goto(propertyUrl.url)
    await page.waitForSelector('footer')
    const data = await page.evaluate(() => {
      const attributeNode = document.querySelector(
        '.property-info__property-attributes'
      )

      const sampleData = {
        StreetName: document.querySelector('.property-info-address')
          ?.textContent,
        Price: document.querySelector('.property-info__price')?.textContent,
        AgentName: document.querySelector('.agent-info__name')?.textContent,
        Agency: document
          .querySelector('.contact-agent-section__form h2')
          ?.textContent.replace('Email enquiry to', ''),
        agentContact: document
          .querySelector('.phone a')
          ?.href?.replace('tel:', ''),

        Type: attributeNode?.lastChild?.textContent,
        bed: attributeNode?.firstChild?.firstChild?.firstChild?.textContent,
        bath: attributeNode?.firstChild?.firstChild?.firstChild
          ?.nextElementSibling?.textContent,
        car: attributeNode?.firstChild?.firstChild?.firstChild
          ?.nextElementSibling?.nextElementSibling?.textContent,
        land: attributeNode?.firstChild?.lastChild?.textContent,
      }

      const auction = document.querySelector('.auction')

      if (auction) {
        const check = auction.querySelector(
          '.calendar-event__day-and-time'
        )?.textContent
        sampleData['Auction Date'] = check ? check : 'n/a'
      } else {
        sampleData['Auction Date'] = 'n/a'
      }

      const inspection = document.querySelector('.open-for-inspection')
      if (inspection) {
        const check = inspection.querySelector(
          '.calendar-event__day-and-time'
        )?.textContent
        sampleData['Inspection Date'] = check ? check : 'n/a'
      } else {
        sampleData['Inspection Date'] = 'n/a'
      }

      const image = document.querySelector('.hero__primary-container img')?.src
      if (image) {
        sampleData.image = [{ url: image }]
      }
      const imageTry2 = document.querySelector(
        '.hero-poster__primary-container img'
      )?.src

      if (!sampleData.image && imageTry2) {
        sampleData.image = [{ url: imageTry2 }]
      }

      const agentImage = document.querySelector('.agent-info__photo-image')?.src

      if (agentImage) {
        sampleData.agentImage = [{ url: agentImage }]
      }

      return sampleData
    })
    data.link = propertyUrl.url
    data.Suburb = propertyUrl.suburb
    data['Listing Date'] = moment().format('YYYY-MM-DD hh:mm a')
    console.log(
      'Time Taken',
      (new Date().getTime() - startedTime) / 1000 + 'sec'
    )
    console.log('Data', data)
  }

  async function getNewLinks(subName, pageNo = 1, lastSyncedUrl = '') {
    const suburbUrl = `https://realestate.com.au/buy/in-${subName
      .trim()
      .toLowerCase()
      .replace(
        ' ',
        '+'
      )}/list-${pageNo}?includeSurrounding=false&activeSort=list-date`
    console.log('Getting new links for ', { subName, pageNo, lastSyncedUrl })
    await page.goto(suburbUrl)
    await page.waitForSelector(paginationSelector).catch((e) => {})

    const newPropertyURls = await page.evaluate((selector) => {
      const properties = document.querySelectorAll(selector)
      const tempUrls = []
      for (let property of properties) {
        tempUrls.push(property.querySelector('a').href)
      }
      return tempUrls
    }, '.tiered-results > [role="presentation"]')
    console.log('new Property Urls', newPropertyURls.length)
  }
  await getNewLinks('Coolum Beach')
  await scrapeUrl({
    url: 'https://www.realestate.com.au/property-house-qld-baringa-140970564',
    suburb: 'Baringa',
  })
  browser.close()
}

runScaper()
