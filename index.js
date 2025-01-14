const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const express = require('express');

const app = express();
const GENIUS_ACCESS_TOKEN = 'ohCXKqz-spvgUf4Rq1lGNdJM-Lp2--eetb0VaR5WzROO4rxKFMMVHzTyN0Fsr64u';

let serverStartTime;


const headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "if-none-match": "W/\"790e7130001354fd06791a06d6b63e86\"",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "_genius_ab_test_cohort=13"
  };


app.use((req, res, next) => {
  if (!serverStartTime) {
    serverStartTime = new Date();
  }
  next();
});


async function getLyrics(lyricsUrl) {
  const lyricsPageData = await axios.get(lyricsUrl, {
    headers: headers,
    validateStatus: function (status) {
      return status = 304 || 200;
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
