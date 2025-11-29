export const isPasswordStrong = (password) => {
    // At least 8 chars, upper, lower, number, symbol
    const lengthOk = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const symbol = /[^A-Za-z0-9]/.test(password);
    return lengthOk && upper && lower && number && symbol;
};
