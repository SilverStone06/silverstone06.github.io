import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  const collectionQuery = response.collection_query || {}
  const viewGroups = Object.values(collectionQuery)
  if (viewGroups.length === 0) return []

  let pageIds: ID[] = []
  if (viewId) {
    const vId = idToUuid(viewId)
    const pageSet = new Set<ID>()
    for (const views of viewGroups as any[]) {
      const ids =
        views?.[vId]?.blockIds ||
        views?.[vId]?.collection_group_results?.blockIds ||
        []
      ids.forEach((id: ID) => pageSet.add(id))
    }
    pageIds = [...pageSet]
  } else {
    const pageSet = new Set<ID>()
    for (const views of viewGroups as any[]) {
      Object.values(views || {}).forEach((view: any) => {
        const ids = view?.collection_group_results?.blockIds || view?.blockIds || []
        ids.forEach((id: ID) => pageSet.add(id))
      })
    }
    pageIds = [...pageSet]
  }
  return pageIds
}
