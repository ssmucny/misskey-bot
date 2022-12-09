export interface BotConfig {
    feeds: FeedConfig[],
}

export interface FeedConfig {
    instanceUrl: string,
    rssUrl: string,
    userToken: string,
    postParams: {
        tagMap: {
        category: string,
        tag: string,
        }[]
}   ,
}

export interface Post {
    url: string,
    formattedContent: string,
    mediaUrls: string[],
    appendTags: string[],
}

export interface PostParams {
    tagMap: Map<string, string>,
}

export interface MisskeyParams {
    visibility: 'public' | 'home' | 'followers' | 'specified',
    localOnly: boolean,
    channel?: string,
}
