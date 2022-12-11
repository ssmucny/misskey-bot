import * as rss from 'rss-parser'
import { Post, PostParams } from './types'

/**
 * Do nothing now, but ideally turn style into MFM
 * @param content 
 * @returns 
 */
function formatContent(content: string) {
    return content;
}

function transformCategories(cats: string[], tagMap: Map<string, string>): string[] {
    return cats
        .map(c => c.toLowerCase())
        .map(c => tagMap.get(c))
        .filter(t => t !== undefined) as string[];
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
