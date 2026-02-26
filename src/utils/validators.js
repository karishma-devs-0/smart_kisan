export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateOTP = (otp) => {
  return /^[0-9]{6}$/.test(otp);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};
