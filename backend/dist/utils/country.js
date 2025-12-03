const HEADER_KEYS = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-country",
    "x-app-country",
];
const normalize = (value) => {
    if (!value)
        return "UNKNOWN";
    const trimmed = value.trim();
    if (!trimmed)
        return "UNKNOWN";
    return trimmed.slice(0, 2).toUpperCase();
};
export const resolveCountry = (req) => {
    for (const key of HEADER_KEYS) {
        const val = req.headers[key];
        if (val)
            return normalize(val);
    }
    const acceptLang = req.headers["accept-language"];
    if (typeof acceptLang === "string") {
        const first = acceptLang.split(",")[0];
        if (first?.length >= 2) {
            return normalize(first);
        }
    }
    return "UNKNOWN";
};
