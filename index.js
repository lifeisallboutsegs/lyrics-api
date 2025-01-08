const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const express = require('express');

const app = express();
const GENIUS_ACCESS_TOKEN = 'ohCXKqz-spvgUf4Rq1lGNdJM-Lp2--eetb0VaR5WzROO4rxKFMMVHzTyN0Fsr64u';

let serverStartTime;

// Custom headers configuration
const customHeaders = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "if-none-match": "W/\"20b09493af7426ebaeb9778362cbbad2\"",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "_genius_ab_test_cohort=32; genius_ana_integration_rollout_cohort=10.799121646005405; genius_first_impression=1736317762369; _genius_ab_test_tonefuse_cohort=18; genius_outbrain_rollout_percentage=26; ana_client_session_id=a2e5d979-02cb-43d6-b084-4acd95ff9926; _ga_BJ6QSCFYD0=GS1.1.1736317763.1.0.1736317763.60.0.0; _ga=GA1.1.1021129788.1736317763; _scor_uid=d8f7524fde714c99936a0d220ecb7c7a; _ga_JRDWPGGXWW=GS1.1.1736317763.1.0.1736317763.0.0.0; mp_77967c52dc38186cc1aadebdd19e2a82_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A194449a7f6e98a-05c64bc648349e-26011851-13c680-194449a7f6e98a%22%2C%22%24device_id%22%3A%20%22194449a7f6e98a-05c64bc648349e-26011851-13c680-194449a7f6e98a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%2C%22AMP%22%3A%20false%2C%22genius_platform%22%3A%20%22web%22%2C%22user_agent%22%3A%20%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F131.0.0.0%20Safari%2F537.36%22%2C%22assembly_uid%22%3A%20%22979c1bd2-4abe-4f95-a62d-2c9d43689fa9%22%2C%22Logged%20In%22%3A%20false%2C%22Mobile%20Site%22%3A%20false%2C%22Tag%22%3A%20%22rap%22%7D; __qca=P0-583783681-1736317763560; __gads=ID=41aa9a776cec4769:T=1736317761:RT=1736317761:S=ALNI_MamKQ30IMQfP3CCwEN148AqwFSgPQ; __gpi=UID=00000fd97df44c5e:T=1736317761:RT=1736317761:S=ALNI_MYzzla_Nf2GSuJm84fPtU1ADdgbHQ; __eoi=ID=f8509f872f760a9c:T=1736317761:RT=1736317761:S=AA-AfjYd0nO-stob2hXvbabm1RTd; _ab_tests_identifier=9a84d67b-d8ea-4b89-bcfb-f79436e41b2d; _pbjs_userid_consent_data=3524755945110770; connectId={\"ttl\":86400000,\"lastUsed\":1736317765418,\"lastSynced\":1736317765418}; _lr_retry_request=true; _lr_env_src_ats=false; pbjs-unifiedid=%7B%22TDID%22%3A%22dbd2976f-f653-4b4b-bfda-875cdaf3bed2%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222024-12-08T06%3A29%3A25%22%7D; pbjs-unifiedid_last=Wed%2C%2008%20Jan%202025%2006%3A29%3A27%20GMT; panoramaId_expiry=1736922565566; _cc_id=6e8f4c5ecb1ab63a5895676306031485; panoramaId=4c3e3e8f15784f2e2e5d52d9b00016d539384c832a6ee93881c4f0d931855e5d; _cb=DTGrxgK3ieEDzH1kx; _chartbeat2=.1736317788804.1736317788804.1.B7X8IBkSxsABxOi4_CAUx1HBpHSta.1; _cb_svref=external; cto_bundle=JIT0mV8wWHZWaVpnbUhOTmw4TGZZeDl4TmxxYWt0Z2tTdlJmcHdKUCUyQkpOQWlnaDZycEFiN2lTZUZSZUxwTGtjcmZVWWh5RWVESGVBa2lsYXdiU2gyZ0xnZ2FRdFpNaWFlSWJXemJaVDJMUFRBS00lMkZmZkpMTmZ5cEgwV3dSJTJCZWJJM082TmR4c3VZWnQ4Ymg2NDZneWFJRkllVmZkWUg1R1lVSU5BTjJ3clBuVUFieWhjMURCR3FsVHlPdzElMkZ0QklyNk9EbkNOZE9xU0dtejY5UTVvRDh4Z2RHcnh1YXV6ZlpxM2NIbXlTbEpITHFrR29MVTVKRGtUa041elEzQUtmQThXUTM"
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
    headers: customHeaders,
    validateStatus: function (status) {
      return status >= 200 && status < 300;
    },
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
