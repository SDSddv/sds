/*
  Checks if the two provided arrays are equal or not.
*/
export function arraysEqual(array1, array2) {
  if (array1 instanceof Array && array2 instanceof Array) {
    /* Check that the length are equal. */
    if (array1.length != array2.length)
      return false;
    /* Check that each element are equal. */
    for(let iter = 0; iter < array1.length; iter++) {
      if (!arraysEqual(array1[iter], array2[iter])) {
        return false;
      }
    }
    return true;
  }
  else {
    /* If the provided elements are not both arrays, they must be equal. */
    return (array1 == array2);
  }
}

/*
  Gets the depth of the provided array.
*/
export function getArrayDepth(array) {
  if (Array.isArray(array)) {
    return 1 + Math.max(...array.map(subarray => getArrayDepth(subarray)));
  }
  return 0;
}
