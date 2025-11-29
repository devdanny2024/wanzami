export var Permission;
(function (Permission) {
    Permission["DASHBOARD_VIEW"] = "dashboard:view";
    Permission["ADMIN_USERS_MANAGE"] = "admin:users:manage";
    Permission["ADMIN_INVITES_MANAGE"] = "admin:invites:manage";
    Permission["MOVIES_MANAGE"] = "movies:manage";
    Permission["MOVIES_VIEW"] = "movies:view";
    Permission["BLOG_MANAGE"] = "blog:manage";
    Permission["BLOG_VIEW"] = "blog:view";
    Permission["USERS_MANAGE"] = "users:manage";
    Permission["USERS_VIEW"] = "users:view";
    Permission["PAYMENTS_MANAGE"] = "payments:manage";
    Permission["PAYMENTS_VIEW"] = "payments:view";
    Permission["MODERATION_MANAGE"] = "moderation:manage";
    Permission["ANALYTICS_VIEW"] = "analytics:view";
    Permission["SETTINGS_MANAGE"] = "settings:manage";
    Permission["SETTINGS_VIEW"] = "settings:view";
    Permission["OPS_MANAGE"] = "ops:manage";
})(Permission || (Permission = {}));
export const ROLE_PERMISSIONS = {
    SUPER_ADMIN: Object.values(Permission),
    CONTENT_MANAGER: [
        Permission.DASHBOARD_VIEW,
        Permission.MOVIES_MANAGE,
        Permission.BLOG_VIEW,
        Permission.USERS_VIEW,
        Permission.PAYMENTS_VIEW,
        Permission.MODERATION_MANAGE,
        Permission.ANALYTICS_VIEW,
        Permission.SETTINGS_VIEW,
        Permission.OPS_MANAGE,
    ],
    BLOG_EDITOR: [
        Permission.DASHBOARD_VIEW,
        Permission.BLOG_MANAGE,
        Permission.MOVIES_VIEW,
        Permission.USERS_VIEW,
        Permission.ANALYTICS_VIEW,
    ],
    MODERATOR: [
        Permission.DASHBOARD_VIEW,
        Permission.MOVIES_VIEW,
        Permission.MODERATION_MANAGE,
        Permission.USERS_MANAGE,
        Permission.ANALYTICS_VIEW,
    ],
    SUPPORT: [
        Permission.DASHBOARD_VIEW,
        Permission.USERS_MANAGE,
        Permission.PAYMENTS_VIEW,
        Permission.MODERATION_MANAGE,
        Permission.ANALYTICS_VIEW,
    ],
    FINANCE: [
        Permission.DASHBOARD_VIEW,
        Permission.PAYMENTS_MANAGE,
        Permission.SETTINGS_MANAGE,
        Permission.ANALYTICS_VIEW,
    ],
    ANALYTICS: [
        Permission.DASHBOARD_VIEW,
        Permission.MOVIES_VIEW,
        Permission.BLOG_VIEW,
        Permission.USERS_VIEW,
        Permission.PAYMENTS_VIEW,
        Permission.MODERATION_MANAGE,
        Permission.ANALYTICS_VIEW,
    ],
    OPS: [
        Permission.DASHBOARD_VIEW,
        Permission.SETTINGS_MANAGE,
        Permission.OPS_MANAGE,
        Permission.MOVIES_VIEW,
        Permission.BLOG_VIEW,
        Permission.USERS_VIEW,
        Permission.ANALYTICS_VIEW,
    ],
    USER: [Permission.DASHBOARD_VIEW],
};
