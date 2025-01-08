const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const express = require('express');

const app = express();
const GENIUS_ACCESS_TOKEN = 'ohCXKqz-spvgUf4Rq1lGNdJM-Lp2--eetb0VaR5WzROO4rxKFMMVHzTyN0Fsr64u';

let serverStartTime;

// Custom headers configuration
const headers = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'max-age=0',
    'if-none-match': 'W/"20b09493af7426ebaeb9778362cbbad2"',
    priority: 'u=0, i',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    cookie: '_genius_ab_test_cohort=10; genius_ana_integration_rollout_cohort=13.271422906286755; ana_client_session_id=78e35f7c-8df2-4a8b-8c0b-aaceb164e6df; genius_first_impression=1736319120067; _genius_ab_test_tonefuse_cohort=74; genius_outbrain_rollout_percentage=39; _scor_uid=592863a01e714f939c1a39dc9eaf25f8; _ga=GA1.1.1508844766.1736319121; __qca=P0-204278970-1736319120655; _ab_tests_identifier=81c15077-d61b-4f41-be87-047e08bdebf1; _pbjs_userid_consent_data=3524755945110770; __gads=ID=991dbe05da88aea3:T=1736319119:RT=1736319119:S=ALNI_MbLdnGsVx2ujgLtuNCLjcEaIccHuQ; __gpi=UID=00000fd97fa7b800:T=1736319119:RT=1736319119:S=ALNI_Mas2qBbewhXTDEsTTCFjUV0Hm6q-w; __eoi=ID=1ef9820cab03c247:T=1736319119:RT=1736319119:S=AA-Afja0M-3whRjk0igr9mp_cGMK; connectId={"ttl":86400000,"lastUsed":1736319122951,"lastSynced":1736319122951}; _lr_retry_request=true; _lr_env_src_ats=false; pbjs-unifiedid=%7B%22TDID%22%3A%227334c000-405a-4801-b01f-a82198a4ecbc%22%2C%22TDID_LOOKUP%22%3A%22FALSE%22%2C%22TDID_CREATED_AT%22%3A%222025-01-08T06%3A52%3A02%22%7D; pbjs-unifiedid_last=Wed%2C%2008%20Jan%202025%2006%3A52%3A04%20GMT; panoramaId_expiry=1736405522654; _cc_id=e5d74008ed361ecda4323092e73df4b1; mp_77967c52dc38186cc1aadebdd19e2a82_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A19444af35dc84c-0f375e967ec0b8-26011851-13c680-19444af35dd84c%22%2C%22%24device_id%22%3A%20%2219444af35dc84c-0f375e967ec0b8-26011851-13c680-19444af35dd84c%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; _ga_BJ6QSCFYD0=GS1.1.1736319120.1.1.1736319138.42.0.0; _ga_JRDWPGGXWW=GS1.1.1736319121.1.1.1736319138.0.0.0',
  };

// Middleware to record server start time
app.use((req, res, next) => {
  if (!serverStartTime) {
    serverStartTime = new Date();
  }
  next();
});

// Updated getLyrics function with custom headers
async function getLyrics(lyricsUrl) {
  const lyricsPageData = await axios.get(lyricsUrl, {
    headers: headers,
  });
  
  const $ = cheerio.load(lyricsPageData.data);
  const lyricsContainers = $('div[data-lyrics-container="true"]');

  let lyricsText = "";

  lyricsContainers.each((index, element) => {
    let lyricsHtml = $(element).html();
    lyricsHtml = lyricsHtml.replace(/<br>/g, "\n");
    const lyricsSection = cheerio.load(lyricsHtml).text().trim();
    lyricsText += lyricsSection + "\n";
  });

  return { lyrics: lyricsText.trim() };
}

app.get("/getlyrics", async (req, res) => {
  const lyricsUrl = req.query.url;
  if (!lyricsUrl) {
    return res.status(400).json({ error: "Lyrics URL parameter is missing." });
  }

  try {
    const lyrics = await getLyrics(lyricsUrl);
    return res.json(lyrics);
  } catch (error) {
    console.error("Error scraping lyrics:", error);
    return res.status(500).json({ error: "Failed to fetch lyrics." });
  }
});

app.get('/', (req, res) => {
  const uptimeInSeconds = Math.floor((new Date() - serverStartTime) / 1000);
  res.status(200).send(`Welcome to the API. Uptime: ${uptimeInSeconds} seconds`);
});

// Updated lyrics search endpoint with custom headers
app.get('/lyrics', async (req, res) => {
  try {
    const { songname } = req.query;

    if (!songname) {
      return res.status(400).send("Please provide a song name!");
    }

    const searchUrl = `https://api.genius.com/search?${qs.stringify({ q: songname })}`;
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        ...customHeaders,
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`
      }
    });

    const searchResults = searchResponse.data.response.hits;

    if (searchResults.length === 0) {
      return res.status(404).send("No results found for the given song!");
    }

    const results = searchResults.map(({ result }) => ({
      title: result.title,
      artist: result.primary_artist.name,
      image: result.song_art_image_url,
      url: result.url
    }));

    return res.status(200).send(results);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred while fetching lyrics!");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
}); 
