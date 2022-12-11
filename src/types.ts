export interface BotConfig {
    feeds: FeedConfig[],
    tags: TagMapping[],
}

export interface FeedConfig {
    instanceUrl: string,
    rssUrl: string,
    userToken: string,
    refreshFrequencyMin: number,
    dateOverride?: string,
    misskeyParams: MisskeyParams,
    postParams: {
        tags: TagMapping[]
}   ,
}

export interface TagMapping {
    category: string,
    tag: string,
}

export interface Post {
    url: string,
    formattedContent: string,
    mediaUrls: string[],
    appendTags: string[],
    createdDate: Date,
    guid: string,
}

export interface PostParams {
    tagMap: Map<string, string>,
}

export interface MisskeyParams {
    visibility: 'public' | 'home' | 'followers' | 'specified',
    localOnly: boolean,
    channel?: string,
}
