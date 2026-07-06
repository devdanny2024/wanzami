import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTable, CsTag, type CsColumn } from './cs/kit';

const mockBlogPosts = [
  {
    id: 1,
    title: 'The Rise of Nollywood: A Cinematic Revolution',
    coverImage: 'https://images.unsplash.com/photo-1745151485547-8d428247c1ff?w=400',
    category: 'Industry News',
    status: 'Published',
    author: 'Admin User',
    views: 12450,
    publishedDate: '2024-11-20',
  },
  {
    id: 2,
    title: '10 Must-Watch Nigerian Films This Season',
    coverImage: 'https://images.unsplash.com/photo-1611517984810-0ef2ae54f9a3?w=400',
    category: 'Recommendations',
    status: 'Published',
    author: 'Admin User',
    views: 8932,
    publishedDate: '2024-11-18',
  },
  {
    id: 3,
    title: 'Behind the Scenes: Lagos Streets Production',
    coverImage: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    category: 'Behind the Scenes',
    status: 'Draft',
    author: 'Admin User',
    views: 0,
    publishedDate: null,
  },
];

type BlogPost = (typeof mockBlogPosts)[number];

const fieldStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
};

export function BlogManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const columns: CsColumn<BlogPost>[] = [
    {
      key: 'cover',
      header: 'Cover',
      cell: (post) => (
        <ImageWithFallback
          src={post.coverImage}
          alt={post.title}
          className="w-24 h-16 object-cover"
        />
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (post) => (
        <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>
          {post.title}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (post) => <CsTag label={post.category} tone="neutral" />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (post) => <CsTag label={post.status} tone={post.status === 'Published' ? 'good' : 'pending'} />,
    },
    {
      key: 'author',
      header: 'Author',
      cell: (post) => <span className="cs-mono text-xs">{post.author}</span>,
    },
    {
      key: 'views',
      header: 'Views',
      align: 'right',
      cell: (post) => (
        <span className="inline-flex items-center gap-1 cs-mono text-xs">
          <Eye className="w-3.5 h-3.5" />
          {post.views.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (post) => (
        <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
          {post.publishedDate || 'Not published'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <button
            className="p-1.5 transition-colors hover:bg-[var(--cs-panel)]"
            style={{ border: '2px solid var(--cs-ink)', color: 'var(--cs-ink)' }}
            aria-label="Edit post"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 transition-colors hover:bg-[var(--cs-panel)]"
            style={{ border: '2px solid var(--cs-rust)', color: 'var(--cs-rust)' }}
            aria-label="Delete post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The press room"
        chip={`${mockBlogPosts.length} posts`}
        slug="Blog management · articles and announcements"
        actions={
          <CsButton variant="rust" onClick={() => setIsAddDialogOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              New post
            </span>
          </CsButton>
        }
      />

      {/* Search */}
      <CsBox className="p-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--cs-muted)' }}
          />
          <input
            type="search"
            placeholder="SEARCH BLOG POSTS…"
            style={{ ...fieldStyle, paddingLeft: 38 }}
          />
        </div>
      </CsBox>

      {/* Blog Posts List */}
      <CsBox className="p-5">
        <CsSlug>All blog posts</CsSlug>
        <div className="mt-4">
          <CsTable
            columns={columns}
            rows={mockBlogPosts}
            rowKey={(post) => String(post.id)}
            emptySlug="Nothing published yet"
            emptyBody="No blog posts to show."
          />
        </div>
      </CsBox>

      {isAddDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(22, 19, 16, 0.55)' }}
          onClick={() => setIsAddDialogOpen(false)}
        >
          <div
            className="cs-border cs-shadow w-full max-w-4xl p-6 overflow-y-auto"
            style={{ background: 'var(--cs-paper)', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4" style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
              <div>
                <CsSlug>New entry</CsSlug>
                <h3 className="cs-display mt-1" style={{ fontSize: 30, color: 'var(--cs-ink)' }}>
                  Create blog post
                </h3>
              </div>
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="cs-mono text-xs font-bold px-2 py-1"
                style={{ border: '2px solid var(--cs-ink)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <BlogEditor onClose={() => setIsAddDialogOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlogEditor({ onClose }: { onClose: () => void }) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <CsSlug className="mb-1">Cover image</CsSlug>
        <div className="p-10 text-center" style={{ border: '2px dashed var(--cs-line)', background: 'var(--cs-panel)' }}>
          <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>Drop cover image here or click to browse</p>
          <p className="cs-mono mt-1" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>Recommended: 1920x1080</p>
        </div>
      </div>

      <div>
        <CsSlug className="mb-1">Title</CsSlug>
        <input style={fieldStyle} placeholder="Enter post title" />
      </div>

      <div>
        <CsSlug className="mb-1">Category</CsSlug>
        <select style={{ ...fieldStyle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }} defaultValue="">
          <option value="" disabled>
            Select category
          </option>
          <option value="news">Industry News</option>
          <option value="recommendations">Recommendations</option>
          <option value="bts">Behind the Scenes</option>
          <option value="interviews">Interviews</option>
          <option value="reviews">Reviews</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <CsSlug>Article content</CsSlug>
          <CsButton variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? 'Edit' : 'Preview'}
          </CsButton>
        </div>
        {previewMode ? (
          <div className="p-4" style={{ minHeight: 300, border: '2px solid var(--cs-ink)', background: 'var(--cs-panel)', color: 'var(--cs-ink)' }}>
            <p className="text-sm">Preview mode - article content will appear here</p>
          </div>
        ) : (
          <textarea
            style={{ ...fieldStyle, minHeight: 300, resize: 'vertical' }}
            placeholder="Write your article content here..."
          />
        )}
      </div>

      <div className="pt-4" style={{ borderTop: '1.5px solid var(--cs-line)' }}>
        <h3 className="cs-display mb-3" style={{ fontSize: 20, color: 'var(--cs-ink)' }}>SEO settings</h3>

        <div className="space-y-3">
          <div>
            <CsSlug className="mb-1">Meta title</CsSlug>
            <input style={fieldStyle} placeholder="SEO title" />
          </div>

          <div>
            <CsSlug className="mb-1">Meta description</CsSlug>
            <textarea style={{ ...fieldStyle, resize: 'vertical' }} rows={2} placeholder="SEO description" />
          </div>

          <div>
            <CsSlug className="mb-1">Keywords (comma separated)</CsSlug>
            <input style={fieldStyle} placeholder="keyword1, keyword2, keyword3" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1.5px solid var(--cs-line)' }}>
        <CsButton variant="outline" onClick={onClose}>
          Cancel
        </CsButton>
        <CsButton variant="outline" onClick={onClose}>
          Save draft
        </CsButton>
        <CsButton variant="rust" onClick={onClose}>
          Publish
        </CsButton>
      </div>
    </div>
  );
}
