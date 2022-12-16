import { MkClient } from './misskey';
import { load as yamlLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { BotConfig, FeedConfig, Post } from './types';
import { getCategories, getRSS } from './rss';

console.log('Usage: npm run start -- {path to yaml config} [--index-tags | -d]')

console.log(process.argv)
const configFile = process.argv[2] ?? './config.yaml';
const yamlContents = readFileSync(configFile, 'utf-8');
console.log('---YAML CONFIG BEGIN---')
console.log(yamlContents);
console.log('---YAML CONFIG END---')
const config = yamlLoad(yamlContents) as BotConfig;

if (process.argv[3] === '--index-tags') {
    indexTags(config)
} else if (process.argv[3] === '-d') {
    start(config); // main process
} else {
    console.error('Invalid parameters:', 'Usage: npm run start -- {path to yaml config} [--index-tags | -d]')
}

async function indexTags(config: BotConfig) {
    console.log('Indexing tags...\n')
    const globalTagMap = new Map<string, string>();
    config.tags.forEach(t => globalTagMap.set(t.category.toLowerCase(), t.tag));

    const feeds = await Promise.all(config.feeds.map(x => x.rssUrl).map(async u => ({
        url: u,
        categories: await getCategories(u)
    })))

    const allCats = feeds
        .map(x => x.categories)
        .flatMap(x => x)
    
    let tagIndex: any = {};
    allCats.forEach(c => tagIndex[c] ? tagIndex[c]++ : tagIndex[c] = 1)
    const count = Object.keys(tagIndex).map(x => ({ tag: x, count: tagIndex[x]})).sort((a, b) => b.count - a.count)

    count
    .filter(x => !globalTagMap.has(x.tag.toLowerCase())) // only show unsupported tags
    .forEach(x => console.log(`${x.tag} : ${x.count}`))
}

async function start(config: BotConfig) {

    const globalTagMap = new Map<string, string>();
    config.tags.forEach(t => globalTagMap.set(t.category.toLowerCase(), t.tag));

    config.feeds.forEach(async feed => {

        // create feed specific tags
        const feedTags = new Map<string, string>(globalTagMap); // intial copy from global tag map
        feed.postParams.tags.forEach(t => feedTags.set(t.category.toLowerCase(), t.tag)); // override/add to

        let rssCache: Post[] | undefined = undefined;
        rssCache = await updatePosts(feed, feedTags, rssCache); // call first time

        console.log(`Creating worker to update every ${feed.refreshFrequencyMin} minutes: ${feed.rssUrl} -> ${feed.instanceUrl}`);
        // set up interval execution
        setInterval(async () => {
            try {
                rssCache = await updatePosts(feed, feedTags, rssCache);
            } catch (e) {
                console.error(`Encountered error when updating posts for ${feed.rssUrl} -> ${feed.instanceUrl}`, e, `Will retry in ${feed.refreshFrequencyMin} minutes.`)
            }
        }, 1000*60*feed.refreshFrequencyMin)
    })
}

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
        .sort((p1, p2) => p1.createdDate.getTime() - p2.createdDate.getTime());
    console.log(`${lastDate} -> New posts: ${newPosts.length}`);

    const notes = await Promise.all(newPosts.map(post => mkApi.postMisskey(post, feed.misskeyParams)));
    console.log(`Notes created: ${notes.length}`)
    if (notes.length !== newPosts.length) {
        console.error(`Some notes failed to be created. ${newPosts.length - notes.length} Failed.`)
    }

    return posts;
}
