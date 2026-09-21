// Frozen schema-2 reader and historical domain rules. Do not change comparison semantics.
// Immutable source versions, exact anchors, and independent task/review histories.
import { matchAnchor } from './comparison.js';
import { validateWorkspace as validateVersionOne } from './schema-v1.js';

export const SCHEMA_VERSION = 2;
export const LIMITS = Object.freeze({
  sourceChars: 100_000,
  sourceVersions: 50,
  reviewNoteChars: 1_000,
  titleChars: 200,
  applications: 100,
  tasks: 2_000,
  historyEvents: 2_000,
  payloadBytes: 2 * 1024 * 1024,
  // Leave room for the versioned backup envelope: every valid save is exportable.
  workspaceBytes: 2 * 1024 * 1024 - 256,
});

const APPLICABILITY = ['applies', 'does-not-apply', 'not-decided'];
const REVIEW_STATES = ['not-reviewed', 'needs-review'];

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function requireThat(condition, message) {
  if (!condition) throw new ValidationError(message);
}

function record(value, keys, path) {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value)), `${path} must be an object.`);
  const actual = Object.keys(value);
  requireThat(actual.length === keys.length && keys.every(key => Object.hasOwn(value, key)),
    `${path} has missing or unsupported fields.`);
  requireThat(Reflect.ownKeys(value).length === actual.length
    && actual.every(key => Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')),
  `${path} must contain plain data fields.`);
}

function text(value, maximum, path, nonblank = true) {
  requireThat(typeof value === 'string' && value.length <= maximum
    && (!nonblank || value.trim().length > 0), `${path} must be nonempty text of at most ${maximum} characters.`);
  return value;
}

function timestamp(value, path) {
  requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value,
  `${path} must be a valid UTC timestamp, including milliseconds.`);
  return value;
}

function choice(value, allowed, path) {
  requireThat(allowed.includes(value), `${path} has an unsupported value.`);
  return value;
}

function boundedArray(value, maximum, path, minimum = 0) {
  requireThat(Array.isArray(value) && value.length >= minimum && value.length <= maximum,
    `${path} must contain ${minimum}–${maximum} entries.`);
  requireThat(Object.keys(value).length === value.length, `${path} must be a plain list without gaps or extra fields.`);
}

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

export function jsonByteLength(value) {
  return new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength;
}

function validateAnchor(value, sources, path, requiredVersionId) {
  record(value, ['sourceVersionId', 'start', 'end', 'quote'], `${path} source link`);
  const { sourceVersionId, start, end, quote } = value;
  const source = sources.find(item => item.id === sourceVersionId);
  requireThat(source, `${path} references a missing source in this application.`);
  requireThat(!requiredVersionId || sourceVersionId === requiredVersionId, `${path} references the wrong source version.`);
  requireThat(Number.isSafeInteger(start) && Number.isSafeInteger(end)
    && start >= 0 && end > start && end <= source.text.length, `${path} source offsets are invalid.`);
  for (const boundary of [start, end]) {
    requireThat(!(source.text[boundary - 1] === '\r' && source.text[boundary] === '\n'),
      `${path} source offsets must not split a CRLF line break. Select the whole line break.`);
    const before = source.text.charCodeAt(boundary - 1);
    const after = source.text.charCodeAt(boundary);
    requireThat(!(before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF),
      `${path} source offsets must not split a UTF-16 surrogate pair. Select the whole character.`);
  }
  text(quote, LIMITS.sourceChars, `${path} selected quote`);
  requireThat(source.text.slice(start, end) === quote, `${path} selected quote does not match its exact source offsets.`);
  return { sourceVersionId, start, end, quote };
}

function sameAnchor(left, right) {
  return left === null || right === null ? left === right
    : ['sourceVersionId', 'start', 'end', 'quote'].every(key => left[key] === right[key]);
}

// A review created for an earlier version never grants a mapping to another one.
// cutoff reconstructs the facts known when a later immutable version was added.
function anchorAt(task, sourceVersionId, cutoff = null) {
  if (task.anchor?.sourceVersionId === sourceVersionId) return task.anchor;
  const review = task.sourceReviews.find(item => item.sourceVersionId === sourceVersionId);
  if (!review) return null;
  if (review.kind === 'exact') return review.suggestedAnchor;
  if (review.resolution && (!cutoff || review.resolution.at < cutoff)) return review.resolution.anchor;
  return null;
}

export function getTaskAnchor(task, sourceVersionId) {
  return anchorAt(task, sourceVersionId);
}

export function getTaskReviewState(task) {
  if (task.reviewState === 'needs-review'
    || task.sourceReviews.some(review => review.kind !== 'exact' && !review.resolution)) return 'needs-review';
  return task.sourceReviews.length ? 'reviewed' : 'not-reviewed';
}

function reviewDescriptor(sources, task, sourceIndex) {
  const target = sources[sourceIndex];
  const previousAnchor = anchorAt(task, sources[sourceIndex - 1].id, target.createdAt);
  let basisAnchor = previousAnchor;
  if (!basisAnchor) {
    // Retain the last known excerpt for the person to inspect. An unresolved or
    // explicitly unmapped intervening version always blocks automatic matching.
    for (let index = sourceIndex - 1; index >= 0 && !basisAnchor; index -= 1) {
      basisAnchor = anchorAt(task, sources[index].id, target.createdAt);
    }
  }
  const basisSource = sources.find(source => source.id === basisAnchor.sourceVersionId);
  const match = matchAnchor(basisSource.text, target.text, basisAnchor);
  return {
    basisAnchor,
    kind: previousAnchor ? match.kind : 'unresolved',
    suggestedAnchor: match.suggestedAnchor === null ? null
      : { sourceVersionId: target.id, ...match.suggestedAnchor },
    reason: previousAnchor ? match.reason
      : 'The previous version had no confirmed mapping when this version was added. Confirm this version separately.',
  };
}

// Validation builds a fresh tree before freezing it: the caller's object is untouched.
export function validateWorkspace(value) {
  record(value, ['schemaVersion', 'applications'], 'Workspace');
  requireThat(value.schemaVersion === SCHEMA_VERSION, 'Unsupported workspace schema version. This app supports version 2.');
  boundedArray(value.applications, LIMITS.applications, 'Applications');
  const ids = new Set();
  let taskCount = 0;
  function id(value, path) {
    requireThat(typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value), `${path} is not a valid ID.`);
    requireThat(!ids.has(value), `Duplicate ID "${value}". Every application, source, task, and history event needs a unique ID.`);
    ids.add(value);
    return value;
  }
  const applications = value.applications.map((application, applicationIndex) => {
    const path = `Application ${applicationIndex + 1}`;
    record(application, ['id', 'title', 'createdAt', 'sources', 'tasks'], path);
    const applicationId = id(application.id, `${path} ID`);
    const title = text(application.title, LIMITS.titleChars, `${path} title`);
    const createdAt = timestamp(application.createdAt, `${path} creation time`);
    boundedArray(application.sources, LIMITS.sourceVersions, `${path} sources`, 1);
    let previousSourceAt = null;
    const sources = application.sources.map(source => {
      record(source, ['id', 'text', 'label', 'createdAt'], `${path} source`);
      const sourceAt = timestamp(source.createdAt, `${path} source creation time`);
      requireThat(sourceAt >= createdAt, `${path} source predates its application.`);
      requireThat(previousSourceAt === null || sourceAt > previousSourceAt, `${path} source versions must be in strictly increasing time order.`);
      previousSourceAt = sourceAt;
      return {
        id: id(source.id, `${path} source ID`),
        text: text(source.text, LIMITS.sourceChars, `${path} source text`),
        label: text(source.label, LIMITS.titleChars, `${path} source label`),
        createdAt: sourceAt,
      };
    });
    boundedArray(application.tasks, LIMITS.tasks, `${path} tasks`);
    taskCount += application.tasks.length;
    requireThat(taskCount <= LIMITS.tasks, `A workspace can hold at most ${LIMITS.tasks} tasks.`);
    const tasks = application.tasks.map((task, taskIndex) => {
      const taskPath = `${path}, task ${taskIndex + 1}`;
      record(task, ['id', 'title', 'createdAt', 'anchor', 'applicability', 'applicabilityHistory', 'completionHistory', 'reviewState', 'sourceReviews'], taskPath);
      const taskId = id(task.id, `${taskPath} ID`);
      const taskTitle = text(task.title, LIMITS.titleChars, `${taskPath} wording`);
      const taskAt = timestamp(task.createdAt, `${taskPath} creation time`);
      requireThat(taskAt >= createdAt, `${taskPath} predates its application.`);
      const anchor = task.anchor === null ? null : validateAnchor(task.anchor, sources, taskPath);
      const anchorIndex = anchor === null ? -1 : sources.findIndex(source => source.id === anchor.sourceVersionId);
      // Legacy schema 1 did not require the task to follow its initial snapshot's
      // timestamp. Preserve those valid records; newer anchors have strict order.
      requireThat(anchorIndex <= 0 || taskAt >= sources[anchorIndex].createdAt, `${taskPath} predates its linked source version.`);
      requireThat(anchorIndex < 0 || !sources[anchorIndex + 1] || taskAt < sources[anchorIndex + 1].createdAt,
        `${taskPath} must be created against the source version current at creation.`);
      const applicability = choice(task.applicability, APPLICABILITY, `${taskPath} applicability`);
      function history(values, field, minimum) {
        boundedArray(values, LIMITS.historyEvents, `${taskPath} ${field} history`, minimum);
        let previousAt = taskAt;
        let previousValue = field === 'completed' ? false : undefined;
        return values.map((event, eventIndex) => {
          record(event, ['id', 'at', field], `${taskPath} history event`);
          const eventId = id(event.id, `${taskPath} history event ID`);
          const at = timestamp(event.at, `${taskPath} history time`);
          requireThat(at >= previousAt, `${taskPath} history timestamps are out of order.`);
          const eventValue = field === 'completed'
            ? (requireThat(typeof event.completed === 'boolean', `${taskPath} completion must be true or false.`), event.completed)
            : choice(event.value, APPLICABILITY, `${taskPath} applicability history`);
          requireThat(eventValue !== previousValue, `${taskPath} history contains an unchanged ${field} event.`);
          if (field === 'value' && eventIndex === 0) {
            requireThat(at === taskAt, `${taskPath} initial applicability must be recorded at task creation.`);
          }
          previousAt = at;
          previousValue = eventValue;
          return { id: eventId, at, [field]: eventValue };
        });
      }
      const applicabilityHistory = history(task.applicabilityHistory, 'value', 1);
      requireThat(applicabilityHistory.at(-1).value === applicability,
        `${taskPath} applicability must agree with its latest history event.`);
      const completionHistory = history(task.completionHistory, 'completed', 0);
      const reviewState = choice(task.reviewState, REVIEW_STATES, `${taskPath} review state`);
      boundedArray(task.sourceReviews, LIMITS.sourceVersions - 1, `${taskPath} source reviews`);
      const expectedCount = anchor === null ? 0 : sources.length - anchorIndex - 1;
      requireThat(task.sourceReviews.length === expectedCount,
        `${taskPath} must retain exactly one review for every version after its original link, and none for a manual task.`);
      const validatedTask = { id: taskId, title: taskTitle, createdAt: taskAt, anchor,
        applicability, applicabilityHistory, completionHistory, reviewState, sourceReviews: [] };
      const decisionTimes = new Set();
      task.sourceReviews.forEach((review, reviewIndex) => {
        const reviewPath = `${taskPath}, source review ${reviewIndex + 1}`;
        record(review, ['id', 'sourceVersionId', 'basisAnchor', 'kind', 'suggestedAnchor', 'reason', 'resolution'], reviewPath);
        const reviewId = id(review.id, `${reviewPath} ID`);
        const sourceIndex = anchorIndex + reviewIndex + 1;
        const target = sources[sourceIndex];
        requireThat(review.sourceVersionId === target.id, `${reviewPath} references a missing, repeated, or out-of-order version.`);
        const basisAnchor = validateAnchor(review.basisAnchor, sources, `${reviewPath} old excerpt`);
        const suggestedAnchor = review.suggestedAnchor === null ? null
          : validateAnchor(review.suggestedAnchor, sources, `${reviewPath} suggested excerpt`, target.id);
        choice(review.kind, ['exact', 'formatting', 'ambiguous', 'unmatched', 'unresolved'], `${reviewPath} kind`);
        text(review.reason, LIMITS.reviewNoteChars, `${reviewPath} reason`);
        const expected = reviewDescriptor(sources, validatedTask, sourceIndex);
        requireThat(sameAnchor(basisAnchor, expected.basisAnchor) && review.kind === expected.kind
          && sameAnchor(suggestedAnchor, expected.suggestedAnchor) && review.reason === expected.reason,
          `${reviewPath} does not match the deterministic comparison at that version.`);
        let resolution = null;
        if (review.resolution !== null) {
          requireThat(review.kind !== 'exact', `${reviewPath} has an unnecessary resolution for an exact match.`);
          record(review.resolution, ['id', 'at', 'anchor', 'applicability', 'note'], `${reviewPath} resolution`);
          const decisionId = id(review.resolution.id, `${reviewPath} resolution ID`);
          const at = timestamp(review.resolution.at, `${reviewPath} resolution time`);
          requireThat(at > target.createdAt && at > taskAt, `${reviewPath} resolution must follow its source version and task.`);
          requireThat(!decisionTimes.has(at), `${taskPath} resolution times must identify separate decisions.`);
          decisionTimes.add(at);
          const resolvedAnchor = review.resolution.anchor === null ? null
            : validateAnchor(review.resolution.anchor, sources, `${reviewPath} confirmed excerpt`, target.id);
          const decisionApplicability = choice(review.resolution.applicability, APPLICABILITY, `${reviewPath} resolution applicability`);
          const note = text(review.resolution.note, LIMITS.reviewNoteChars, `${reviewPath} resolution note`, resolvedAnchor === null);
          // A decision for the current version changes applicability. A historical
          // decision records its choice only; it cannot rewrite a later choice.
          if (!sources[sourceIndex + 1] || at < sources[sourceIndex + 1].createdAt) {
            const choiceAtDecision = applicabilityHistory.filter(event => event.at <= at).at(-1)?.value;
            requireThat(choiceAtDecision === decisionApplicability,
              `${reviewPath} current-version decision must agree with applicability history at its time.`);
          }
          resolution = { id: decisionId, at, anchor: resolvedAnchor, applicability: decisionApplicability, note };
        }
        validatedTask.sourceReviews.push({ id: reviewId, sourceVersionId: target.id, basisAnchor,
          kind: review.kind, suggestedAnchor, reason: review.reason, resolution });
      });
      return validatedTask;
    });
    return { id: applicationId, title, createdAt, sources, tasks };
  });
  const result = { schemaVersion: SCHEMA_VERSION, applications };
  requireThat(jsonByteLength(result) <= LIMITS.workspaceBytes, 'Workspace exceeds the 2 MiB data limit. Export and use a smaller workspace.');
  return freezeDeep(result);
}

function newId() {
  return globalThis.crypto.randomUUID();
}

// Clock rollback must not make newly appended history invalid.
function nowAfter(...timestamps) {
  return new Date(Math.max(Date.now(), ...timestamps.filter(Boolean).map(value => Date.parse(value)))).toISOString();
}

function nextApplicationTime(application) {
  // Strict order disambiguates a resolution made before versus after an update,
  // even when actions share a clock millisecond or the clock moves backwards.
  const times = [application.createdAt, ...application.sources.map(source => source.createdAt)];
  for (const task of application.tasks) {
    times.push(task.createdAt, ...task.applicabilityHistory.map(event => event.at),
      ...task.completionHistory.map(event => event.at),
      ...task.sourceReviews.flatMap(review => review.resolution ? [review.resolution.at] : []));
  }
  const last = times.reduce((maximum, at) => Math.max(maximum, Date.parse(at)), 0);
  return new Date(Math.max(Date.now(), last + 1)).toISOString();
}

function editable(workspace) {
  return structuredClone(validateWorkspace(workspace));
}

function applicationIn(workspace, applicationId) {
  const application = workspace.applications.find(item => item.id === applicationId);
  requireThat(application, 'The selected application no longer exists.');
  return application;
}

export function createWorkspace() {
  return validateWorkspace({ schemaVersion: SCHEMA_VERSION, applications: [] });
}

export function migrateWorkspace(workspace) {
  if (workspace?.schemaVersion !== 1) return validateWorkspace(workspace);
  // Validate with the historical schema before transforming: unknown or damaged
  // schema-1 records are never reinterpreted as newer data.
  let legacy;
  try {
    legacy = validateVersionOne(workspace);
  } catch (error) {
    throw new ValidationError(`Schema-1 migration failed: ${error.message}`);
  }
  const migrated = structuredClone(legacy);
  migrated.schemaVersion = SCHEMA_VERSION;
  for (const application of migrated.applications) {
    for (const task of application.tasks) task.sourceReviews = [];
  }
  try {
    return validateWorkspace(migrated);
  } catch (error) {
    throw new ValidationError(`Schema-1 migration failed: ${error.message} Original data must be kept for recovery.`);
  }
}

export function createApplication(workspace, { title, text: sourceText, label = 'Pasted instructions' }) {
  const next = editable(workspace);
  const at = nowAfter();
  next.applications.push({
    id: newId(), title: typeof title === 'string' ? title.trim() : title, createdAt: at,
    sources: [{ id: newId(), text: sourceText, label: typeof label === 'string' ? label.trim() : label, createdAt: at }],
    tasks: [],
  });
  return validateWorkspace(next);
}

export function createTask(workspace, applicationId, { title, anchor = null, applicability = 'not-decided' }) {
  const next = editable(workspace);
  const application = applicationIn(next, applicationId);
  const at = nextApplicationTime(application);
  if (anchor !== null) record(anchor, ['start', 'end', 'quote'], 'Selected excerpt');
  application.tasks.push({
    id: newId(), title: typeof title === 'string' ? title.trim() : title, createdAt: at,
    anchor: anchor === null ? null : { sourceVersionId: application.sources.at(-1).id, ...anchor },
    applicability,
    applicabilityHistory: [{ id: newId(), at, value: applicability }],
    completionHistory: [],
    reviewState: 'not-reviewed',
    sourceReviews: [],
  });
  return validateWorkspace(next);
}

export function isTaskCompleted(task) {
  return task.completionHistory.at(-1)?.completed ?? false;
}

export function updateTask(workspace, applicationId, taskId, changes) {
  requireThat(changes !== null && typeof changes === 'object' && !Array.isArray(changes)
    && Object.keys(changes).every(key => ['title', 'applicability', 'completed'].includes(key)), 'Task changes contain an unsupported field.');
  const next = editable(workspace);
  const application = applicationIn(next, applicationId);
  const task = application.tasks.find(item => item.id === taskId);
  requireThat(task, 'The selected task no longer exists.');
  const at = nextApplicationTime(application);
  if (Object.hasOwn(changes, 'title')) task.title = typeof changes.title === 'string' ? changes.title.trim() : changes.title;
  if (Object.hasOwn(changes, 'applicability')) {
    choice(changes.applicability, APPLICABILITY, 'Applicability');
    if (changes.applicability !== task.applicability) {
      task.applicability = changes.applicability;
      task.applicabilityHistory.push({ id: newId(), at, value: changes.applicability });
    }
  }
  if (Object.hasOwn(changes, 'completed')) {
    requireThat(typeof changes.completed === 'boolean', 'Completion must be true or false.');
    if (changes.completed !== isTaskCompleted(task)) {
      task.completionHistory.push({ id: newId(), at, completed: changes.completed });
    }
  }
  return validateWorkspace(next);
}

export function addSourceVersion(workspace, applicationId, { text: sourceText, label = 'Updated instructions' }) {
  const next = editable(workspace);
  const application = applicationIn(next, applicationId);
  requireThat(application.sources.length < LIMITS.sourceVersions,
    `An application can hold at most ${LIMITS.sourceVersions} immutable source versions.`);
  // Validate text before comparison so blank/oversized input cannot run an engine.
  text(sourceText, LIMITS.sourceChars, 'New source text');
  const sourceLabel = typeof label === 'string' ? label.trim() : label;
  text(sourceLabel, LIMITS.titleChars, 'New source label');
  application.sources.push({ id: newId(), text: sourceText, label: sourceLabel,
    createdAt: nextApplicationTime(application) });
  const sourceIndex = application.sources.length - 1;
  for (const task of application.tasks) {
    if (!task.anchor) continue;
    task.sourceReviews.push({ id: newId(), sourceVersionId: application.sources[sourceIndex].id,
      ...reviewDescriptor(application.sources, task, sourceIndex), resolution: null });
  }
  return validateWorkspace(next);
}

export function resolveSourceReview(workspace, applicationId, taskId, reviewId, decision) {
  record(decision, ['anchor', 'applicability', 'note'], 'Review decision');
  const next = editable(workspace);
  const application = applicationIn(next, applicationId);
  const task = application.tasks.find(item => item.id === taskId);
  requireThat(task, 'The selected task no longer exists.');
  const review = task.sourceReviews.find(item => item.id === reviewId);
  requireThat(review, 'The selected source review no longer exists.');
  requireThat(review.kind !== 'exact', 'An exact unchanged mapping does not need confirmation.');
  requireThat(!review.resolution, 'This specific version review already has a recorded resolution.');
  choice(decision.applicability, APPLICABILITY, 'Review decision applicability');
  const note = typeof decision.note === 'string' ? decision.note.trim() : decision.note;
  text(note, LIMITS.reviewNoteChars, 'Review decision note', decision.anchor === null);
  let anchor = null;
  if (decision.anchor !== null) {
    record(decision.anchor, ['start', 'end', 'quote'], 'Confirmed excerpt');
    anchor = validateAnchor({ sourceVersionId: review.sourceVersionId, ...decision.anchor },
      application.sources, 'Confirmed excerpt', review.sourceVersionId);
  }
  const at = nextApplicationTime(application);
  review.resolution = { id: newId(), at, anchor, applicability: decision.applicability, note };
  if (review.sourceVersionId === application.sources.at(-1).id && task.applicability !== decision.applicability) {
    task.applicability = decision.applicability;
    task.applicabilityHistory.push({ id: newId(), at, value: decision.applicability });
  }
  return validateWorkspace(next);
}
