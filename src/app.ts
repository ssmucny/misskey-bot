/* eslint-disable prettier/prettier */
/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
import * as dotenv from 'dotenv';
import { MkClient } from './misskey';
import { BotConfig, FeedConfig, Post } from './types';
import { getRSS } from './rss';

dotenv.config();

const testConfig: BotConfig = {
    feeds: [
        {
            instanceUrl: 'https://test.thecle.land',
            rssUrl: 'https://coolcleveland.com/feed',
            userToken: 'XXXXXX',
            refreshFrequencyMin: 60,
            dateOverride: '2022-12-09',
            misskeyParams: {
                visibility: 'public',
                localOnly: true,
            },
            postParams: {
                tags: [],
            }
        }
    ],
    tags: [
        { category: 'Theatre', tag: 'theatre' },
        { category: 'Performance', tag: 'performance' },
        { category: 'Review', tag: 'review' },
    ]
}

const globalTagMap = new Map<string, string>();
testConfig.tags.forEach(t => globalTagMap.set(t.category.toLowerCase(), t.tag));

testConfig.feeds.forEach(async feed => {

    // create feed specific tags
    const feedTags = new Map<string, string>(globalTagMap); // intial copy from global tag map
    feed.postParams.tags.forEach(t => feedTags.set(t.category.toLowerCase(), t.tag)); // override/add to

    let rssCache: Post[] | undefined = undefined;
    rssCache = await updatePosts(feed, feedTags, rssCache); // call first time

    console.log(`Creating worker to update every ${feed.refreshFrequencyMin} minutes: ${feed.rssUrl} -> ${feed.instanceUrl}`);
    // set up interval execution
    setInterval(async () => {
        rssCache = await updatePosts(feed, feedTags, rssCache);
    }, 1000*60*feed.refreshFrequencyMin)
})

async function updatePosts(feed: FeedConfig, tags: Map<string, string>, rssCache?: Post[]): Promise<Post[]> {
    console.log(`Updating: ${feed.rssUrl} -> ${feed.instanceUrl}`)

    // initialize Misskey client
    const mkApi = new MkClient(feed.instanceUrl, feed.userToken);

    // set lastDate so that we only act on new posts
    var lastDate: Date;
    if (rssCache) {
        lastDate = new Date(Math.max(...rssCache.map(p => p.createdDate.getTime())));
    } else if (feed.dateOverride) {
        lastDate = new Date(feed.dateOverride);
    } else {
        lastDate = (await mkApi.getDateLastPost()) ?? new Date(0);
    }

    // get new feed
    const posts = await getRSS(feed.rssUrl, {
        tagMap: tags
    });
    console.log(`All posts: ${posts.length}`);

    const newPosts = posts
        .filter(p => p.createdDate > lastDate)
        //.sort((p1, p2) => p1.createdDate.getTime() - p2.createdDate.getTime());
    console.log(`${lastDate} -> New posts: ${newPosts.length}`);

    const notes = await Promise.all(newPosts.map(post => mkApi.postMisskey(post, feed.misskeyParams)));
    console.log(`Notes created: ${notes.length}`)
    if (notes.length !== newPosts.length) {
        console.error(`Some notes failed to be created. ${newPosts.length - notes.length} Failed.`)
    }

    return posts;
}
