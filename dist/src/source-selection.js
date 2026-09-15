// Textareas display CRLF/CR as LF. Map their UTF-16 selections back to the
// untouched source string so a file's newline characters are not rewritten.
function rawBoundaries(text) {
  const boundaries = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\r' && text[index + 1] === '\n') index += 1;
    boundaries.push(index + 1);
  }
  return boundaries;
}
export function anchorFromSelection(text, start, end) {
  const boundaries = rawBoundaries(text);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end >= boundaries.length || start >= end) throw new Error('Select an instruction in the source snapshot first.');
  const anchor = { start: boundaries[start], end: boundaries[end] };
  anchor.quote = text.slice(anchor.start, anchor.end);
  if (!anchor.quote.trim()) throw new Error('Select some instruction text, not only whitespace.');
  return anchor;
}
export function selectionFromAnchor(text, anchor) {
  return { start: text.slice(0, anchor.start).replace(/\r\n?/g, '\n').length, end: text.slice(0, anchor.end).replace(/\r\n?/g, '\n').length };
}
