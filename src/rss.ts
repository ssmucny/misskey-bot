import * as rss from 'rss-parser'
import { Post, PostParams } from './types'

/**
 * Create body of note with formatted text
 * @param content 
 * @param title
 * @returns formatted MFM string
 */
function formatContent(content: string, title?: string) {
    return (title ? `**${title}**\n` : '') + content;
}

/**
 * Convert RSS categories into #tag values for posting.
 * @param cats RSS tags, case insensitive
 * @param tagMap 
 * @returns Unique post tags (no # included here)
 */
function transformCategories(cats: string[], tagMap: Map<string, string>): string[] {
    return Array.from(new Set(cats
        .map(c => c.toLowerCase())
        .map(c => tagMap.get(c))
        .filter(t => t !== undefined))) as string[];
}

/**
 * Fetch an RSS feed and parse it into posts
 * @param url RSS feed to fetch
 * @param params parameters to use in parsing of feed
 * @returns list of `Post`s
 */
export async function getRSS(url: string, params: PostParams): Promise<Post[]> {
    const parser = new rss();
    return parser.parseURL(url)
    .then(feed => 
        feed.items.map(i => ({
            url: i.link ?? feed.feedUrl ?? url,
            formattedContent: formatContent(i.contentSnippet ??  "", i.title),
            mediaUrls: [], // somehow extract images...
            appendTags: transformCategories(i.categories ?? [], params.tagMap),
            createdDate: i.isoDate ? new Date(i.isoDate) : new Date(),
            guid: i.guid,
        }) as Post)
    )
}

/**
 * Gets all category values in an RSS feed.
 * @param url RSS to get info from
 * @returns list of all categories in RSS feed. Contains duplicates
 */
export async function getCategories(url: string): Promise<string[]> {
    const feed = await (new rss()).parseURL(url);
    return feed.items.map(i => i.categories ?? []).flatMap(x => x);
}
