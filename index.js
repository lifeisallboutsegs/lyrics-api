const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const express = require('express');

const app = express();
const GENIUS_ACCESS_TOKEN = 'ohCXKqz-spvgUf4Rq1lGNdJM-Lp2--eetb0VaR5WzROO4rxKFMMVHzTyN0Fsr64u';

let serverStartTime;

// Middleware to record server start time for uptime calculation
app.use((req, res, next) => {
  if (!serverStartTime) {
    serverStartTime = new Date();
  }
  next();
});

// Function to scrape lyrics
async function getLyrics(lyricsUrl) {
  const lyricsPageData = await axios.get(lyricsUrl);
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



// Route to handle lyrics scraping
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
