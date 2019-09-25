export function placeMenu(
  event,
  elem,
  xOffset = 0,
  yOffset = 0,
  xWindowPad = 20,
  yWindowPad = 70
) {
  // determine x/y placement
  let xTarget = event.x + xOffset;
  let yTarget = event.y + yOffset;

  // check that can fit in window
  if (xTarget + elem.offsetWidth + xWindowPad > window.innerWidth) {
    xTarget = window.innerWidth - elem.offsetWidth - xWindowPad;
  }
  if (yTarget + elem.offsetHeight + yWindowPad > window.innerHeight) {
    yTarget = window.innerHeight - elem.offsetHeight - yWindowPad;
  }

  elem.style.left = `${xTarget}px`;
  elem.style.top = `${yTarget}px`;
}
