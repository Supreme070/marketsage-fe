/**
 * Input Validation Utilities
 */

export class InputValidator {
  static validateNumber(
    value: any,
    fieldName: string,
    options: { required?: boolean; min?: number; max?: number } = {}
  ): number {
    if (value === undefined || value === null) {
      if (options.required) {
        throw new Error(`${fieldName} is required`);
      }
      return 0;
    }

    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (options.min !== undefined && num < options.min) {
      throw new Error(`${fieldName} must be at least ${options.min}`);
    }

    if (options.max !== undefined && num > options.max) {
      throw new Error(`${fieldName} must be at most ${options.max}`);
    }

    return num;
  }

  static validateArray<T>(
    value: any,
    fieldName: string,
    elementValidator: (element: any, index: number) => T,
    options: { required?: boolean; minLength?: number; maxLength?: number } = {}
  ): T[] {
    if (!Array.isArray(value)) {
      if (options.required) {
        throw new Error(`${fieldName} must be an array`);
      }
      return [];
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
      throw new Error(`${fieldName} must have at least ${options.minLength} elements`);
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      throw new Error(`${fieldName} must have at most ${options.maxLength} elements`);
    }

    return value.map((element, index) => elementValidator(element, index));
  }
} 