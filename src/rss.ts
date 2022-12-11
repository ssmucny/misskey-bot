import * as rss from 'rss-parser'
import { Parser } from 'xml2js';
import { Post, PostParams } from './types'

/**
 * Do nothing now, but ideally turn style into MFM
 * @param content 
 * @returns 
 */
function formatContent(content: string) {
    return content;
}

function log<T>(val: T): T {
    console.log(val);
    return val;
}

function transformCategories(cats: string[], tagMap: Map<string, string>): string[] {
    return Array.from(new Set(cats
        .map(c => c.toLowerCase())
        .map(c => tagMap.has(c) ? tagMap.get(c): tagMap.get(log(c)))
        .filter(t => t !== undefined))) as string[];
}

export async function getRSS(url: string, params: PostParams): Promise<Post[]> {
    const parser = new rss();
    return parser.parseURL(url)
    .then(feed => 
        feed.items.map(i => ({
            url: i.link ?? feed.feedUrl ?? url,
            formattedContent: formatContent(i.contentSnippet ??  ""),
            mediaUrls: [], // somehow extract images...
            appendTags: transformCategories(i.categories ?? [], params.tagMap),
            createdDate: i.isoDate ? new Date(i.isoDate) : new Date(),
            guid: i.guid,
        }) as Post)
    )
}

export async function getCategories(url: string): Promise<string[]> {
    const feed = await (new rss()).parseURL(url);
    return feed.items.map(i => i.categories ?? []).flatMap(x => x);
}
