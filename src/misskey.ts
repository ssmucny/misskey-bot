import { api, api as misskeyApi } from 'misskey-js';
import { APIClient } from 'misskey-js/built/api';
import { User } from 'misskey-js/built/entities';
import { MisskeyParams, Post } from 'types';

/**
 * Client for accessing the Misskey API
 */
export class MkClient {
    private client: APIClient;

    constructor(instanceUrl: string, token: string) {
        this.client = new misskeyApi.APIClient({
            origin: instanceUrl,
            credential: token,
        });
    }

    /**
     * Post a note to Misskey
     * @param post 
     * @param params 
     * @returns The created `Note`
     */
    public async postMisskey(post: Post, params: MisskeyParams) {
        return this.client.request('notes/create', {
            visibility: params.visibility,
            text: this.formatBody(post),
            localOnly: params.localOnly,
            noExtractMentions: false,
            noExtractHashtags: false,
            noExtractEmojis: false,
            channelId: params.channel,
          })
    }

    /**
     * Structures the content from a `Post` into a Misskey compatible format
     * @param post 
     * @returns MFM compatible string
     */
    formatBody(post: Post): string {
        return [
            post.formattedContent,
            (post.appendTags.map(x => '#' + x).join(' ')),
            (post.url ?? '')
        ].join(' ');
    }

    /**
     * Get the date of the most recent note by the user.
     * @returns `Date` of last post or `null` if no notes posted
     */
    public async getDateLastPost(): Promise<Date | null> {
        const user: User = await this.client.request('i', {})
        const id = user.id
        //@ts-ignore
        const notesCount = user.notesCount

        if (notesCount < 1) return null;

        const lastNote = await this.client.request('users/notes', {
            userId: id,
            includeReplies: true,
            limit: 1,
            includeMyRenotes: true,
          });
        if (lastNote.length < 1) throw new Error('No note found when querying user even though it should exist.');

        // example format: '2022-12-06T01:14:02.261Z'
        return new Date(lastNote[0].createdAt);    
    } 

    private async uploadMedia() {
        //TODO
    }
}
