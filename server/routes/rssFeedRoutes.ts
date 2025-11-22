import express from 'express';
import { db } from '../db';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { audioNewsletters, audioNewsletterArticles, articles } from '@shared/schema';
import { format } from 'date-fns';

const router = express.Router();

// Podcast RSS feed for audio newsletters
router.get('/audio-newsletters', async (req, res) => {
  try {
    // Get published newsletters with audio
    const newsletters = await db.query.audioNewsletters.findMany({
      where: and(
        eq(audioNewsletters.status, 'published'),
        isNotNull(audioNewsletters.audioUrl)
      ),
      with: {
        articles: {
          with: {
            article: true
          },
          orderBy: (articles, { asc }) => [asc(articles.orderIndex)]
        }
      },
      orderBy: [desc(audioNewsletters.createdAt)],
      limit: 50
    });

    // Build RSS feed
    const baseUrl = process.env.APP_URL || 'https://sabq.sa';
    const currentDate = new Date().toUTCString();
    
    const rssItems = newsletters.map(newsletter => {
      const pubDate = newsletter.publishedAt
        ? new Date(newsletter.publishedAt).toUTCString()
        : new Date(newsletter.createdAt || Date.now()).toUTCString();
      
      // Build description from articles
      const articleList = newsletter.articles
        .slice(0, 5)
        .map((na, index) => `${index + 1}. ${na.article.title}`)
        .join('\n');
      
      const description = newsletter.description || 
        `النشرة الصوتية من سبق - ${newsletter.title}\n\nالأخبار المتضمنة:\n${articleList}`;
      
      // Duration in iTunes format (HH:MM:SS)
      const duration = newsletter.duration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);
      const itunesDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return `
    <item>
      <title><![CDATA[${newsletter.title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${baseUrl}/audio/${newsletter.id}</link>
      <guid isPermaLink="true">${baseUrl}/audio/${newsletter.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${newsletter.audioUrl}" type="audio/mpeg" length="${newsletter.audioSize || 0}"/>
      <itunes:author>سبق الإلكترونية</itunes:author>
      <itunes:subtitle><![CDATA[${newsletter.description || newsletter.title}]]></itunes:subtitle>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:duration>${itunesDuration}</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
      <itunes:episode>${newsletter.episodeNumber || newsletters.indexOf(newsletter) + 1}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
    }).join('\n');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>نشرات سبق الصوتية</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/rss/audio-newsletters" rel="self" type="application/rss+xml"/>
    <description>النشرات الإخبارية الصوتية اليومية والأسبوعية من صحيفة سبق الإلكترونية - أبرز الأخبار والتحليلات</description>
    <language>ar-SA</language>
    <copyright>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</copyright>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <webMaster>podcasts@sabq.sa (سبق الإلكترونية)</webMaster>
    <managingEditor>editor@sabq.sa (فريق التحرير)</managingEditor>
    <category>News</category>
    <category>Arabic</category>
    <category>Saudi Arabia</category>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/images/podcast-cover.jpg</url>
      <title>نشرات سبق الصوتية</title>
      <link>${baseUrl}</link>
    </image>
    
    <!-- iTunes Podcast Tags -->
    <itunes:author>سبق الإلكترونية</itunes:author>
    <itunes:summary>النشرات الإخبارية الصوتية من سبق - تغطية شاملة لأهم الأخبار المحلية والعالمية، مع تحليلات معمقة ونشرات يومية وأسبوعية</itunes:summary>
    <itunes:owner>
      <itunes:name>صحيفة سبق الإلكترونية</itunes:name>
      <itunes:email>podcasts@sabq.sa</itunes:email>
    </itunes:owner>
    <itunes:explicit>no</itunes:explicit>
    <itunes:category text="News">
      <itunes:category text="Daily News"/>
    </itunes:category>
    <itunes:category text="Government"/>
    <itunes:category text="Society &amp; Culture"/>
    <itunes:image href="${baseUrl}/images/podcast-cover-1400.jpg"/>
    <itunes:type>episodic</itunes:type>
    <itunes:complete>no</itunes:complete>
    
    ${rssItems}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rssFeed);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

// JSON feed for modern podcast apps
router.get('/audio-newsletters.json', async (req, res) => {
  try {
    const newsletters = await db.query.audioNewsletters.findMany({
      where: and(
        eq(audioNewsletters.status, 'published'),
        isNotNull(audioNewsletters.audioUrl)
      ),
      with: {
        articles: {
          with: {
            article: true
          },
          orderBy: (articles, { asc }) => [asc(articles.orderIndex)]
        }
      },
      orderBy: [desc(audioNewsletters.createdAt)],
      limit: 50
    });

    const baseUrl = process.env.APP_URL || 'https://sabq.sa';
    
    const jsonFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'نشرات سبق الصوتية',
      home_page_url: baseUrl,
      feed_url: `${baseUrl}/api/rss/audio-newsletters.json`,
      description: 'النشرات الإخبارية الصوتية اليومية والأسبوعية من صحيفة سبق الإلكترونية',
      icon: `${baseUrl}/images/icon-512.png`,
      favicon: `${baseUrl}/favicon.ico`,
      language: 'ar-SA',
      authors: [{
        name: 'سبق الإلكترونية',
        url: baseUrl,
        avatar: `${baseUrl}/images/sabq-logo.png`
      }],
      _itunes: {
        author: 'سبق الإلكترونية',
        categories: ['News', 'Society & Culture'],
        explicit: false,
        type: 'episodic',
        owner: {
          name: 'صحيفة سبق الإلكترونية',
          email: 'podcasts@sabq.sa'
        }
      },
      items: newsletters.map((newsletter, index) => ({
        id: newsletter.id,
        url: `${baseUrl}/audio/${newsletter.id}`,
        title: newsletter.title,
        summary: newsletter.description,
        content_text: newsletter.articles
          .slice(0, 5)
          .map((na, i) => `${i + 1}. ${na.article.title}`)
          .join('\n'),
        date_published: newsletter.publishedAt || newsletter.createdAt,
        date_modified: newsletter.updatedAt,
        attachments: [{
          url: newsletter.audioUrl,
          mime_type: 'audio/mpeg',
          size_in_bytes: newsletter.audioSize || 0,
          duration_in_seconds: newsletter.duration || 0
        }],
        _itunes: {
          episode: newsletter.episodeNumber || newsletters.length - index,
          duration: newsletter.duration || 0,
          explicit: false,
          episode_type: 'full'
        }
      }))
    };

    res.json(jsonFeed);
  } catch (error) {
    console.error('Error generating JSON feed:', error);
    res.status(500).json({ error: 'Error generating JSON feed' });
  }
});

// OPML file for podcast directories
router.get('/audio-newsletters.opml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://sabq.sa';
    const currentDate = new Date().toISOString();
    
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>نشرات سبق الصوتية</title>
    <dateCreated>${currentDate}</dateCreated>
    <dateModified>${currentDate}</dateModified>
    <ownerName>صحيفة سبق الإلكترونية</ownerName>
    <ownerEmail>podcasts@sabq.sa</ownerEmail>
  </head>
  <body>
    <outline text="نشرات سبق الصوتية" type="rss" xmlUrl="${baseUrl}/api/rss/audio-newsletters" htmlUrl="${baseUrl}/audio"/>
  </body>
</opml>`;

    res.set('Content-Type', 'text/x-opml; charset=utf-8');
    res.send(opml);
  } catch (error) {
    console.error('Error generating OPML file:', error);
    res.status(500).send('Error generating OPML file');
  }
});

export default router;