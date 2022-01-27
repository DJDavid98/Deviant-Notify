import { GRUser, MessageCenterItemResult } from './common-types.js';

// These types are all reverse-engineered from encountered API responses and may not be exhaustive

export interface NcFolder {
  name: 'inbox' | 'saved' | 'archived';
  folderId: number;
  unseenCount: number;
}

export interface NcIdentity {
  hasNew: boolean;
  gruser: GRUser;
  folders: NcFolder[];
}

export interface NcIdentitiesResponse {
  headerUnseenCount: number;
  results: NcIdentity[];
}

enum NcDrawerSubjectTypeNames {
  GROUP_MEMBERSHIP = 'bucket.group_membership',
  LLAMA = 'bucket.llama',
  GROUP_PROFILE = 'bucket.group_profile'
}

enum NcDrawerSubjectTypeIds {
  DEVIATION = 1,
  DEVIATION_COMMENT = 24,
  SUBMISSION_COMMENT = 29,
  SUBMISSION_JOURNAL = 5,
}

export type NcDrawerSubject =
  { typeName: NcDrawerSubjectTypeNames.GROUP_MEMBERSHIP }
  | { typeName: NcDrawerSubjectTypeNames.LLAMA }
  | { typeId: NcDrawerSubjectTypeIds.SUBMISSION_COMMENT, title: string }
  | { typeId: NcDrawerSubjectTypeIds.DEVIATION, title: string, imgSrc: string }
  | { typeId: NcDrawerSubjectTypeIds.SUBMISSION_JOURNAL, title: string }
  | { typeId: NcDrawerSubjectTypeIds.DEVIATION_COMMENT, title: string }
  | { typeName: NcDrawerSubjectTypeNames.GROUP_PROFILE, itemOwnerid: number, itemOwnerUser: GRUser };

export enum NcDrawerMessageClass {
  WATCH = 'class.watch',
  LIKE = 'class.like',
  FAVE_COLLECT = 'class.favecollect',
}

export interface NcDrawerCountDetails {
  messageClass: NcDrawerMessageClass;
  newCount: number;
}

export enum NcDrawerBucketType {
  WATCH = 'bucket.watch',
}

export interface NcDrawerBucket {
  bucket: NcDrawerBucketType | `bucket.deviation.${number}` | `bucket.comment.${number}`;
  /**
   *  Unix timestamps in seconds, as string
   */
  ts: string;
  subject: NcDrawerSubject,
  countDetails: NcDrawerCountDetails[];
}

export enum NcDrawerMessageDataKey {
  NEW_WATCHER = 'new_watcher',
  FAVE = 'fave',
  COLLECT = 'collect',
}

export interface NcDrawerMessageDataDeviationMediaType {
  t: '150' | '200H' | '300W' | '250T' | '350T' | '400T' | 'preview' | 'social_preview' | 'fullview',
  r: number,
  c: string,
  h: number,
  w: number
}

export interface NcDrawerMessageDataDeviation {
  deviationId: number,
  type: string,
  typeId: number,
  printId: null | number,
  url: string,
  title: string,
  isJournal: boolean,
  isVideo: boolean,
  isPurchasable: boolean,
  isFavouritable: boolean,
  // Unix timestamp in ISO format
  publishedTime: string,
  isTextEditable: boolean,
  isBackgroundEditable: boolean,
  legacyTextEditUrl: null | string,
  isShareable: boolean,
  isCommentable: boolean,
  isFavourited: boolean,
  isDeleted: boolean,
  isMature: boolean,
  isDownloadable: boolean,
  isAntisocial: boolean,
  isBlocked: boolean,
  isPublished: boolean,
  isDailyDeviation: boolean,
  hasPrivateComments: boolean,
  blockReasons: unknown[],
  author: GRUser,
  stats: {
    comments: number,
    favourites: number,
    views: number,
    downloads: number
  },
  media: {
    baseUri: string,
    prettyName: string,
    types: NcDrawerMessageDataDeviationMediaType[]
  }
}

export interface NcDrawerMessageDataCollection {
  folderId: number,
  gallectionUuid: string,
  parentId: null,
  type: 'collection',
  name: string,
  description: string,
  owner: GRUser,
  commentCount: number,
  size: number,
  thumb: null
}

export type NcDrawerMessageData =
  {
    dataKey: NcDrawerMessageDataKey.NEW_WATCHER,
    newWatcher: {
      watched: GRUser,
      newestDeviations: NcDrawerMessageDataDeviation[]
    }
  }
  | {
  dataKey: NcDrawerMessageDataKey.FAVE,
  fave: {
    deviation: NcDrawerMessageDataDeviation,
    newestDeviations?: NcDrawerMessageDataDeviation[]
  },
}
  | {
  dataKey: NcDrawerMessageDataKey.COLLECT,
  collect: {
    collection: NcDrawerMessageDataCollection,
    deviation: NcDrawerMessageDataDeviation,
    newestDeviations: NcDrawerMessageDataDeviation[]
  },
};

export interface NcDrawerMessage extends MessageCenterItemResult<never> {
  messageClass: NcDrawerMessageClass;
  bucket: NcDrawerBucketType;
  folderId: number;
  messageData: NcDrawerMessageData;
}

type NcDrawerResult = { bucket: NcDrawerBucket, message?: NcDrawerMessage }

export interface NcDrawerResponse {
  hasMore: boolean,
  cursor: string,
  hasGroups: boolean,
  results: NcDrawerResult[];
}
