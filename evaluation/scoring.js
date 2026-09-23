// This scorer accepts recorded task choices. It does not infer human choices
// from automatic flags or claim that engineering output measures usefulness.
function keySet(keys, name) {
  if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key)) throw new Error(`${name} must be a list of task keys.`);
  if (new Set(keys).size !== keys.length) throw new Error(`${name} must not repeat task keys.`);
  return new Set(keys);
}

export function scoreReviewSelection({ taskKeys, expectedAffectedKeys, selectedKeys }) {
  const all = keySet(taskKeys, 'taskKeys');
  const expected = keySet(expectedAffectedKeys, 'expectedAffectedKeys');
  const selected = keySet(selectedKeys, 'selectedKeys');
  for (const key of [...expected, ...selected]) if (!all.has(key)) throw new Error(`Unknown task key: ${key}`);
  const missedAffectedKeys = [...expected].filter(key => !selected.has(key));
  const unnecessaryReviewKeys = [...selected].filter(key => !expected.has(key));
  return {
    expectedAffectedCount: expected.size, selectedCount: selected.size,
    correctlySelectedKeys: [...expected].filter(key => selected.has(key)),
    missedAffectedKeys, missedAffectedCount: missedAffectedKeys.length,
    unnecessaryReviewKeys, unnecessaryReviewCount: unnecessaryReviewKeys.length,
  };
}
