import { NotionAPI } from "notion-client"
import { ExtendedRecordMap } from "notion-types"

/**
 * notion-client sometimes returns map entries as { value: { value: Entity, role } }
 * instead of { role, value: Entity }. react-notion-x expects `value.id`, `collection.schema`, etc. on the inner object.
 */
function normalizeNotionMap<
  T extends Record<string, { role?: string; value?: unknown }>,
>(map: T | undefined): T {
  if (!map) return {} as T
  const out = { ...map } as Record<string, { role?: string; value?: unknown }>
  for (const key of Object.keys(out)) {
    const entry = out[key]
    const v = entry?.value as
      | { id?: string; value?: { id?: string }; role?: string }
      | undefined
    if (!v || typeof v !== "object") continue
    if (!v.id && v.value && typeof v.value === "object" && v.value.id) {
      out[key] = {
        role: entry.role ?? v.role ?? "reader",
        value: v.value,
      }
    }
  }
  return out as T
}

function normalizeRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  return {
    ...recordMap,
    block: normalizeNotionMap(recordMap.block),
    collection: normalizeNotionMap(recordMap.collection),
    collection_view: normalizeNotionMap(recordMap.collection_view),
    notion_user: normalizeNotionMap(recordMap.notion_user),
  }
}

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)
  return normalizeRecordMap(recordMap as ExtendedRecordMap)
}
