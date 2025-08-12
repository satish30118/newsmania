require("dotenv").config();
const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const NodeCache = require("node-cache");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const { Configuration, OpenAIApi } = require("openai");

const User = require("./models/User");
const Bookmark = require("./models/Bookmark");
const auth = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error("Mongo connect err", err));

const parser = new Parser();
const summaryCache = new NodeCache({
  stdTTL: Number(process.env.SUMMARY_CACHE_TTL) || 86400,
});

const feeds = {
  toi: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  thehindu: "https://www.thehindu.com/feeder/default.rss",
  ht: "https://www.hindustantimes.com/rss/india/rssfeed.xml",
  indianexpress: "https://indianexpress.com/feed/",
};

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, email, passwordHash: hashed });
    res.json({ message: "created" });
  } catch (e) {
    res.status(400).json({ error: "User exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  res.json({ token });
});

// Fetch RSS and return items
app.get("/api/news/:source", async (req, res) => {
  try {
    const source = req.params.source;
    if (!feeds[source])
      return res.status(400).json({ error: "Unknown source" });
    const feed = await parser.parseURL(feeds[source]);
    const items = await Promise.all(
      feed.items.map(async (i) => {
        let image = null;

        // Try RSS enclosure
        if (i.enclosure?.url) image = i.enclosure.url;

        // Try media:content
        if (!image && i["media:content"]?.$?.url)
          image = i["media:content"].$.url;

        // Try <img> in content
        if (!image && i.content) {
          const match = i.content.match(/<img[^>]+src="([^">]+)"/);
          if (match) image = match[1];
        }

        // Fallback → scrape article meta tags
        if (!image && i.link) {
          try {
            const res = await axios.get(i.link, {
              timeout: 8000,
              headers: { "User-Agent": "NewsManiaBot/1.0" },
            });
            const dom = new JSDOM(res.data, { url: i.link });
            image = extractMetaImage(dom);
          } catch (e) {
            console.warn(`Image fetch failed for ${i.link}:`, e.message);
          }
        }

        return {
          title: i.title,
          link: i.link,
          pubDate: i.pubDate,
          source,
          image,
        };
      })
    );

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

async function extractArticleText(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "NewsManiaBot/1.0" },
    });
    const dom = new JSDOM(res.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // Get image from meta tags
    let image = extractMetaImage(dom);

    // Fallback: first image in article body
    if (!image) {
      const firstImg =
        dom.window.document.querySelector("article img") ||
        dom.window.document.querySelector("img");
      if (firstImg) {
        image = firstImg.src;
      }
    }

    return {
      text:
        article?.textContent || dom.window.document.body.textContent || null,
      image,
    };
  } catch (e) {
    console.warn("extract failed", e.message);
    return { text: null, image: null };
  }
}

// Get or generate summary for an URL (cached)
app.post("/api/summarize", auth, async (req, res) => {
  const { url, title } = req.body;
  const cacheKey = url || title;
  const cached = summaryCache.get(cacheKey);
  if (cached) return res.json({ summary: cached, cached: true });

  try {
    let articleText = null;
    if (url) {
      articleText = await extractArticleText(url);
    }
    let prompt;
    if (articleText && articleText.length > 200) {
      // limit to reasonable size for tokens; truncate if needed
      const snippet = articleText.slice(0, 12000);
      prompt = `Summarize the following news article in 2-3 concise sentences in simple English:\n\n${snippet}`;
    } else {
      prompt = `Give a concise 2-3 sentence summary of the news article titled:\n\n${title}\n\nURL: ${url}\n\nIf you don't have the full text, summarize based on title.`;
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });
    const summary = completion.data.choices[0].message.content.trim();
    summaryCache.set(cacheKey, summary);
    res.json({ summary, cached: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI failed" });
  }
});

function extractMetaImage(dom) {
  const ogImage = dom.window.document.querySelector(
    'meta[property="og:image"]'
  );
  if (ogImage && ogImage.content) return ogImage.content;

  const twitterImage = dom.window.document.querySelector(
    'meta[name="twitter:image"]'
  );
  if (twitterImage && twitterImage.content) return twitterImage.content;

  return null;
}

// Bookmarks
app.post("/api/bookmarks", auth, async (req, res) => {
  const { title, link, summary, source } = req.body;
  const bm = await Bookmark.create({
    userId: req.user.id,
    title,
    link,
    summary,
    source,
  });
  res.json(bm);
});
app.get("/api/bookmarks", auth, async (req, res) => {
  const b = await Bookmark.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(b);
});


app.delete("/api/bookmarks/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Bookmark.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    res.json({ message: "Bookmark deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});



// Follow topics
app.post("/api/follow", auth, async (req, res) => {
  const { topic } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { followedTopics: topic },
  });
  res.json({ ok: true });
});
app.get("/api/me", auth, async (req, res) => {
  const u = await User.findById(req.user.id).select("-passwordHash");
  res.json(u);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log("Server running", PORT));
