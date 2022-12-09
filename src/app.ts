/* eslint-disable prettier/prettier */
/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
import * as dotenv from 'dotenv';
import { BotConfig } from 'types';
import { getRSS } from './rss';

dotenv.config();

const testConfig: BotConfig = {
    feeds: [
        {
            instanceUrl: 'https://test.thecle.land',
            rssUrl: 'https://coolcleveland.com/feed',
            userToken: 'XXXXXX',
            postParams: {
                tagMap: [
                    { category: 'Theatre', tag: 'theatre' },
                    { category: 'Performance', tag: 'performance' },
                    { category: 'Review', tag: 'review' },
                ],
            }
        }
    ]
}

let categoryMap = new Map<string, string>();
testConfig.feeds[0].postParams.tagMap.forEach(t => categoryMap.set(t.category.toLowerCase(), t.tag));

getRSS('https://coolcleveland.com/feed', {
    tagMap: categoryMap
}).then(items => items.forEach(x => console.log(x.formattedContent)));

