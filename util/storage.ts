export const getItemFromStorage = (key: string) => {
  if (localStorage.getItem(key)) {
    try {
      return JSON.parse(localStorage.getItem(key) as string);
    } catch {
      return localStorage.getItem(key);
    }
  } else {
    return false;
  }
};

export const setStorageItem = (key: string, data: any) => {
  if (data) {
    localStorage.setItem(key, JSON.stringify(data));
  } else {
    localStorage.removeItem(key);
  }
};
