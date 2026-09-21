// User-confirmed edges and event-specific review. No external files are observed.
// An edge is stored on the dependent task: task -> its required predecessors.
export function dependencyMap(application) {
  const graph = new Map(application.tasks.map(task => [task.id, []]));
  for (const event of application.dependencyHistory) graph.set(event.taskId, [...event.dependencyIds]);
  return graph;
}

export function getTaskDependencies(application, taskId) {
  return dependencyMap(application).get(taskId) ?? [];
}

export function validateDependencyChange(graph, taskId, dependencyIds) {
  if (!graph.has(taskId)) throw new Error('The selected task no longer exists in this application.');
  if (!Array.isArray(dependencyIds) || Object.keys(dependencyIds).length !== dependencyIds.length) {
    throw new Error('Dependencies must be a plain list of task IDs.');
  }
  if (new Set(dependencyIds).size !== dependencyIds.length) throw new Error('Choose each dependency only once.');
  for (const id of dependencyIds) {
    if (!graph.has(id)) throw new Error('A dependency references a missing task in this application.');
    if (id === taskId) throw new Error('A task cannot depend on itself.');
  }
  // Iterative traversal avoids recursion limits for long checklists.
  const seen = new Set();
  const queue = [...dependencyIds];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    if (id === taskId) throw new Error('This dependency would create a cycle. A step cannot eventually depend on itself.');
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...graph.get(id));
  }
}

function downstream(graph) {
  const reverse = new Map([...graph.keys()].map(id => [id, []]));
  for (const [dependent, predecessors] of graph) {
    for (const predecessor of predecessors) reverse.get(predecessor).push(dependent);
  }
  return reverse;
}

function descendantPaths(reverse, originId, excluded = new Set()) {
  const paths = new Map([[originId, [originId]]]);
  const queue = [originId];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    for (const child of reverse.get(id)) {
      if (paths.has(child) || excluded.has(child)) continue;
      paths.set(child, [...paths.get(id), child]);
      queue.push(child);
    }
  }
  paths.delete(originId);
  return paths;
}

export function reviewCauses(application) {
  const causes = new Map();
  for (const task of application.tasks) {
    for (const review of task.sourceReviews) {
      if (review.kind === 'exact') continue;
      const source = application.sources.find(item => item.id === review.sourceVersionId);
      causes.set(review.id, { id: review.id, kind: 'source', taskId: task.id, at: source.createdAt,
        sourceVersionId: source.id, note: review.reason, resolution: review.resolution });
    }
  }
  for (const event of application.workChanges) {
    causes.set(event.id, { ...event, kind: 'work', resolution: null });
  }
  return causes;
}

// Replay the same event rules on import. Historical paths remain explainable
// after an edge is removed; the current graph is never used to rewrite history.
export function expectedDependencyReviews(application) {
  const graph = new Map(application.tasks.map(task => [task.id, []]));
  const expected = new Map(application.tasks.map(task => [task.id, []]));
  const actual = new Map(application.tasks.map(task => [task.id,
    new Map(task.dependencyReviews.map(review => [review.causeId, review]))]));
  const causes = reviewCauses(application);
  const events = [...causes.values()].map(cause => ({ at: cause.at, cause }));
  for (const change of application.dependencyHistory) events.push({ at: change.at, change });
  // Stable sort keeps application task order for simultaneous source changes.
  events.sort((left, right) => left.at.localeCompare(right.at));
  let reverse = downstream(graph);
  function propagate(causeId, seedId, prefix, at) {
    for (const [targetId, tail] of descendantPaths(reverse, seedId, new Set(prefix))) {
      const reasons = expected.get(targetId);
      if (reasons.some(review => review.causeId === causeId)) continue;
      reasons.push({ causeId, at, path: [...prefix, ...tail.slice(1)] });
    }
  }
  for (const event of events) {
    if (event.cause) {
      propagate(event.cause.id, event.cause.taskId, [event.cause.taskId], event.at);
      continue;
    }
    const { change } = event;
    graph.set(change.taskId, change.dependencyIds);
    reverse = downstream(graph);
    // A newly confirmed edge must not hide an upstream review already open.
    for (const cause of causes.values()) {
      if (cause.kind === 'source' && cause.at < event.at
        && (!cause.resolution || cause.resolution.at > event.at)) {
        propagate(cause.id, cause.taskId, [cause.taskId], event.at);
      }
    }
    for (const task of application.tasks) {
      // Snapshot: propagation may append reasons to another task in this pass.
      for (const review of [...expected.get(task.id)]) {
        const resolution = actual.get(task.id).get(review.causeId)?.resolution;
        if (review.at <= event.at && (!resolution || resolution.at > event.at)) {
          propagate(review.causeId, task.id, review.path, event.at);
        }
      }
    }
  }
  return expected;
}

export function getDependencyReviews(application, taskId) {
  return application.tasks.find(task => task.id === taskId)?.dependencyReviews ?? [];
}

export function describeDependencyReview(application, task, review) {
  const cause = reviewCauses(application).get(review.causeId);
  const title = id => application.tasks.find(item => item.id === id)?.title ?? 'Missing task';
  const origin = title(cause.taskId);
  return {
    reason: cause.kind === 'source'
      ? `Review ${task.title} because the source instructions linked to ${origin} changed or need confirmation.`
      : `Review ${task.title} because you reported changing ${origin}.`,
    chain: review.path.map(title), causeKind: cause.kind,
    sourceVersionId: cause.sourceVersionId, note: cause.note,
  };
}

function needsReview(task) {
  return task.reviewState === 'needs-review'
    || task.sourceReviews.some(review => review.kind !== 'exact' && !review.resolution)
    || task.dependencyReviews.some(review => !review.resolution);
}

export function getTaskBlockers(application, taskId) {
  const graph = dependencyMap(application);
  const tasks = new Map(application.tasks.map(task => [task.id, task]));
  const selected = tasks.get(taskId);
  if (!selected) return [{ kind: 'missing', taskId, message: 'This task no longer exists.' }];
  const blockers = [];
  const seen = new Set();
  const queue = [taskId];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    if (seen.has(id)) continue;
    seen.add(id);
    const task = tasks.get(id);
    if (task.applicability === 'not-decided') {
      blockers.push({ kind: 'applicability', taskId: id, message: `Decide whether ${task.title} applies, or obtain clarification.` });
    }
    if (needsReview(task)) blockers.push({ kind: 'review', taskId: id, message: `Resolve the open review reasons for ${task.title}.` });
    if (id !== taskId && task.applicability === 'applies' && !(task.completionHistory.at(-1)?.completed ?? false)) {
      blockers.push({ kind: 'incomplete', taskId: id, message: `The required predecessor ${task.title} is not recorded complete.` });
    }
    // A person's does-not-apply decision skips that branch, but its own changed
    // condition still blocks until reviewed. No decision is inferred here.
    if (task.applicability !== 'does-not-apply') queue.push(...graph.get(id));
  }
  return blockers;
}
