// Domain data: exact source anchors and independent, append-only task histories.
// This milestone retains one source snapshot; comparison belongs in a later module.
export const SCHEMA_VERSION = 1;
export const LIMITS = Object.freeze({
  sourceChars: 100_000,
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

// Validation builds a fresh tree before freezing it: the caller's object is untouched.
export function validateWorkspace(value) {
  record(value, ['schemaVersion', 'applications'], 'Workspace');
  requireThat(value.schemaVersion === SCHEMA_VERSION, 'Unsupported workspace schema version. This app supports version 1.');
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
    boundedArray(application.sources, 1, `${path} sources`, 1);
    const sources = application.sources.map(source => {
      record(source, ['id', 'text', 'label', 'createdAt'], `${path} source`);
      const sourceAt = timestamp(source.createdAt, `${path} source creation time`);
      requireThat(sourceAt >= createdAt, `${path} source predates its application.`);
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
      record(task, ['id', 'title', 'createdAt', 'anchor', 'applicability', 'applicabilityHistory', 'completionHistory', 'reviewState'], taskPath);
      const taskId = id(task.id, `${taskPath} ID`);
      const taskTitle = text(task.title, LIMITS.titleChars, `${taskPath} wording`);
      const taskAt = timestamp(task.createdAt, `${taskPath} creation time`);
      requireThat(taskAt >= createdAt, `${taskPath} predates its application.`);
      let anchor = null;
      if (task.anchor !== null) {
        record(task.anchor, ['sourceVersionId', 'start', 'end', 'quote'], `${taskPath} source link`);
        const { sourceVersionId, start, end, quote } = task.anchor;
        const source = sources.find(item => item.id === sourceVersionId);
        requireThat(source, `${taskPath} references a missing source in this application.`);
        requireThat(Number.isSafeInteger(start) && Number.isSafeInteger(end)
          && start >= 0 && end > start && end <= source.text.length, `${taskPath} source offsets are invalid.`);
        for (const boundary of [start, end]) {
          requireThat(!(source.text[boundary - 1] === '\r' && source.text[boundary] === '\n'),
            `${taskPath} source offsets must not split a CRLF line break. Select the whole line break.`);
          const before = source.text.charCodeAt(boundary - 1);
          const after = source.text.charCodeAt(boundary);
          requireThat(!(before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF),
            `${taskPath} source offsets must not split a UTF-16 surrogate pair. Select the whole character.`);
        }
        text(quote, LIMITS.sourceChars, `${taskPath} selected quote`);
        requireThat(source.text.slice(start, end) === quote, `${taskPath} selected quote does not match its exact source offsets.`);
        anchor = { sourceVersionId, start, end, quote };
      }
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
      return {
        id: taskId,
        title: taskTitle,
        createdAt: taskAt,
        anchor,
        applicability,
        applicabilityHistory,
        completionHistory: history(task.completionHistory, 'completed', 0),
        reviewState: choice(task.reviewState, REVIEW_STATES, `${taskPath} review state`),
      };
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
  const at = nowAfter(application.createdAt);
  if (anchor !== null) record(anchor, ['start', 'end', 'quote'], 'Selected excerpt');
  application.tasks.push({
    id: newId(), title: typeof title === 'string' ? title.trim() : title, createdAt: at,
    anchor: anchor === null ? null : { sourceVersionId: application.sources[0].id, ...anchor },
    applicability,
    applicabilityHistory: [{ id: newId(), at, value: applicability }],
    completionHistory: [],
    reviewState: 'not-reviewed',
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
  const task = applicationIn(next, applicationId).tasks.find(item => item.id === taskId);
  requireThat(task, 'The selected task no longer exists.');
  const at = nowAfter(task.createdAt, task.applicabilityHistory.at(-1)?.at, task.completionHistory.at(-1)?.at);
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
