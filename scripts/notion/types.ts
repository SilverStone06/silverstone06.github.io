import type { ExtendedRecordMap, Block } from "notion-types"

export interface ImageCounter {
  count: number
}

export type NotionBlock = Block

export type BlockMap = ExtendedRecordMap['block']

export type RecordMap = ExtendedRecordMap

export interface ConversionOptions {
  postSlug: string
  imageCounter: ImageCounter
}

