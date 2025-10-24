/**
 * Publishing Templates - Barrel Export
 * 
 * Centralized export for all publishing templates.
 * Enables easy importing: `import { HeroSplit, NewsListBasic } from '@/components/publishing/templates'`
 */

// Hero Templates
import HeroSplit from './HeroSplit';
import HeroOverlay from './HeroOverlay';

// News List Templates
import NewsListBasic from './NewsListBasic';
import NewsListSummary from './NewsListSummary';

// News Grid Templates
import NewsGridTwoCol from './NewsGridTwoCol';
import NewsGridMasonry from './NewsGridMasonry';

// Ticker Templates
import TickerInline from './TickerInline';
import TickerMarquee from './TickerMarquee';

// Timeline Templates
import TimelineVertical from './TimelineVertical';
import TimelineHorizontal from './TimelineHorizontal';

// Spotlight Templates
import SpotlightCard from './SpotlightCard';
import SpotlightMedia from './SpotlightMedia';

// Media Templates
import VideoReel from './VideoReel';
import PodcastRow from './PodcastRow';

// Live Templates
import LiveStream from './LiveStream';

// Infographic Templates
import InfographicStatBar from './InfographicStatBar';

// Tag Templates
import TagStripChips from './TagStripChips';

// Newsletter Templates
import NewsletterBlock from './NewsletterBlock';

// Native Templates
import NativeStory from './NativeStory';

// Opinion Templates
import OpinionColumn from './OpinionColumn';

// Mosaic Templates
import MosaicMagazine from './MosaicMagazine';

// Re-export all templates
export {
  HeroSplit,
  HeroOverlay,
  NewsListBasic,
  NewsListSummary,
  NewsGridTwoCol,
  NewsGridMasonry,
  TickerInline,
  TickerMarquee,
  TimelineVertical,
  TimelineHorizontal,
  SpotlightCard,
  SpotlightMedia,
  VideoReel,
  PodcastRow,
  LiveStream,
  InfographicStatBar,
  TagStripChips,
  NewsletterBlock,
  NativeStory,
  OpinionColumn,
  MosaicMagazine,
};

/**
 * Template registry mapping template IDs to components
 * Used by Template Selector Engine for dynamic loading
 */
export const TEMPLATE_REGISTRY = {
  // Hero
  'hero.split': HeroSplit,
  'hero.overlay': HeroOverlay,
  
  // News List
  'news_list.basic': NewsListBasic,
  'news_list.summary': NewsListSummary,
  
  // News Grid
  'news_grid.two_col': NewsGridTwoCol,
  'news_grid.masonry': NewsGridMasonry,
  
  // Ticker
  'ticker.inline': TickerInline,
  'ticker.marquee': TickerMarquee,
  
  // Timeline
  'timeline.vertical': TimelineVertical,
  'timeline.horizontal': TimelineHorizontal,
  
  // Spotlight
  'spotlight.card': SpotlightCard,
  'spotlight.media': SpotlightMedia,
  
  // Media
  'media.video_reel': VideoReel,
  'media.podcast_row': PodcastRow,
  
  // Live
  'live.stream': LiveStream,
  
  // Infographic
  'infographic.statbar': InfographicStatBar,
  
  // Tags
  'tag_strip.chips': TagStripChips,
  
  // Newsletter
  'newsletter.block': NewsletterBlock,
  
  // Native
  'native.story': NativeStory,
  
  // Opinion
  'opinion.column': OpinionColumn,
  
  // Mosaic
  'mosaic.magazine': MosaicMagazine,
} as const;

export type TemplateId = keyof typeof TEMPLATE_REGISTRY;
