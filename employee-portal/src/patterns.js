export const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  note:     /^[A-Za-z0-9 .,\-_:/()'"@#]{0,500}$/
};

export const messages = {
  username: '3-20 characters: letters, digits, underscore',
  password: 'Min 8 chars with upper, lower, digit, and one of @$!%*?&',
  note:     'Up to 500 characters'
};
