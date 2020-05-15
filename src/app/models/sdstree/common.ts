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

/*
  Gets the current date & time object.
*/
export function getCurrentDateTime() {
  return new Date();
}

/*
  Gets a formatted date time object.
  It's formatted as follows:
    day: 2 digits day of month (01 through 31).
    month: 2 digits month (01=January, etc...).
    year: 2 digits year (i.e 1980 -> 80).
    hours: 2 digits of hour in localtime (00 through 23).
    minutes: 2 digits of minutes in localtime (00 through 59).
    seconds: 2 digits of seconds in localtime (00 through 59).
*/
export function getFormattedCurrentDateTime() {
  let formattedDateTime = null;
  let date = getCurrentDateTime();
  if (date) {
    let day = ('0' + date.getDate()).slice(-2);
    let month = (date.getMonth() < 10 ? "0" : "") + (date.getMonth() + 1);
    let year = date.getFullYear().toString().substr(2,2);
    let hours = (date.getHours() < 10 ? "0" : "") + (date.getHours());
    let minutes = (date.getMinutes() < 10 ? "0" : "") + (date.getMinutes());
    let seconds = (date.getSeconds() < 10 ? "0": "") + (date.getSeconds());
    formattedDateTime = {
                          day: day,
                          month: month,
                          year: year,
                          hours: hours,
                          minutes: minutes,
                          seconds: seconds
                        };
  }
  return formattedDateTime;
}
