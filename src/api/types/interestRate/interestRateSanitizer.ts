export const sanitizeInterestRate = {
  type: function sanitizeInterestRateType(type: string): string {
    throw new Error(
      '(SanitizeInterestRate) Sanitize is currently not implemented since only fixed values will pass validation!',
    );
    return type;
  },
  duration: function sanitizeInterestRateDuration(duration: string): string {
    throw new Error(
      '(SanitizeInterestRate) Sanitize is currently not implemented since only fixed values will pass validation!',
    );
    return duration;
  },
};
