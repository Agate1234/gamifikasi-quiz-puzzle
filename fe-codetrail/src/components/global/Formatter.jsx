export const encryptData = (data) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (error) {
    return "";
  }
};

export const decryptData = (data) => {
  try {
    return JSON.parse(atob(data));
  } catch (error) {
    return null;
  }
};