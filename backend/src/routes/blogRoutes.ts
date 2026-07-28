import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { Permission } from "../auth/permissions.js";
import {
  listPublicPosts,
  getPublicPost,
  incrementPostView,
  searchPublicPosts,
  listPublicCategories,
  adminListPosts,
  adminGetPost,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../controllers/blogController.js";

const router = Router();

// Public storefront endpoints. Only PUBLISHED posts whose publishedAt has
// passed are ever returned from these.
router.get("/blog/posts", listPublicPosts);
router.get("/blog/search", searchPublicPosts);
router.get("/blog/categories", listPublicCategories);
router.get("/blog/posts/:slug", getPublicPost);
router.post("/blog/posts/:slug/view", incrementPostView);

// Admin CMS. BLOG_MANAGE is held by SUPER_ADMIN and BLOG_EDITOR.
const canManage = requirePermission(Permission.BLOG_MANAGE);

router.get("/admin/blog/posts", requireAuth, canManage, adminListPosts);
router.post("/admin/blog/posts", requireAuth, canManage, adminCreatePost);
router.get("/admin/blog/posts/:id", requireAuth, canManage, adminGetPost);
router.patch("/admin/blog/posts/:id", requireAuth, canManage, adminUpdatePost);
router.delete("/admin/blog/posts/:id", requireAuth, canManage, adminDeletePost);

router.get("/admin/blog/categories", requireAuth, canManage, adminListCategories);
router.post("/admin/blog/categories", requireAuth, canManage, adminCreateCategory);
router.patch("/admin/blog/categories/:id", requireAuth, canManage, adminUpdateCategory);
router.delete("/admin/blog/categories/:id", requireAuth, canManage, adminDeleteCategory);

export default router;
