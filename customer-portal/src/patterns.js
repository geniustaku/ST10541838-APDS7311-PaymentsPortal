// Mirror of backend/middleware/validation.js patterns.
// SECURITY note: client-side validation is a UX aid only — the backend enforces these again.
export const patterns = {
  fullName:      /^[a-zA-Z\s]{2,50}$/,
  idNumber:      /^[0-9]{13}$/,
  accountNumber: /^[0-9]{10,12}$/,
  password:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  amount:        /^\d+(\.\d{1,2})?$/,
  currency:      /^(USD|EUR|GBP|ZAR|JPY|AUD)$/,
  payeeAccount:  /^[0-9]{10,12}$/,
  swiftCode:     /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  provider:      /^(SWIFT)$/
};

export const messages = {
  fullName:      '2–50 letters and spaces only',
  idNumber:      'Exactly 13 digits',
  accountNumber: '10–12 digits',
  password:      'Min 8 chars, with upper, lower, digit and one of @$!%*?&',
  amount:        'Digits with up to 2 decimal places',
  currency:      'Pick a currency',
  payeeAccount:  '10–12 digits',
  swiftCode:     '8 or 11 chars, uppercase, e.g. ABSAZAJJ',
  provider:      'SWIFT only for now'
};
