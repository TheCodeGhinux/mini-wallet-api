import randomstring from "randomstring";

/**
 *
 * @description Generates a random number or string
 * @author Ismail, Akintunde
 * @param {object} randomGeneratorOptions The parameter options which are characterLength, isCapitalized and outputOption
 * @returns {string} The Randomly Generated Number or String
 *
 */
const numberStringGenerator = (
  randomGeneratorOptions: RandomGeneratorOptionsInterface,
): string => {
  const {
    characterLength,
    isCapitalized,
    outputOption = "alphanumeric",
  } = randomGeneratorOptions;

  if (outputOption === "numeric") {
    return randomstring.generate({
      length: characterLength,
      charset: outputOption,
    });
  }

  return randomstring.generate({
    length: characterLength,
    charset:
      outputOption === "special characters" ? "!@#$%^)(*?" : outputOption,
    capitalization: isCapitalized
      ? isCapitalized === true
        ? "uppercase"
        : "lowercase"
      : undefined,
  });
};

export default numberStringGenerator;

/*
|--------------------------------------------------------------------------
| The Shape of the object passed into the numberStringGenerator function
|--------------------------------------------------------------------------
*/
interface RandomGeneratorOptionsInterface {
  /**
   * The length of the random string to be generated
   */
  characterLength: number;

  /**
   * Defines the character set of the string to be generated.
   * Options are numeric, Alphanumeric(Default), Alphabetic and Special Characters
   */
  outputOption?:
    | "numeric"
    | "alphanumeric"
    | "alphabetic"
    | "special characters";

  /**
   * Defines whether the output should be capitalized or not
   */
  isCapitalized?: boolean;
}

export { RandomGeneratorOptionsInterface };
