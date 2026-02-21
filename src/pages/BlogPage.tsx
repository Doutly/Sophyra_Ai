import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { ArrowLeft, Calendar, User, Tag, BookOpen } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
}

function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(
      query(
        collection(db, 'blogs'),
        where('isPublished', '==', true),
        orderBy('publishedAt', 'desc')
      )
    ).then(snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <img src="/lo.png" alt="Sophyra AI" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold text-slate-900">Sophyra Blog</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Blog</h1>
          <p className="text-lg text-slate-500">Interview strategy, AI-powered preparation, and career growth insights.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Coming Soon</h3>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
              We're working on articles about interview strategy and career growth. Follow us on LinkedIn for updates.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
              >
                {post.coverImageUrl ? (
                  <div className="h-44 overflow-hidden">
                    <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{post.category}</span>
                    <span className="text-[11px] text-slate-400">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                    <User className="w-3 h-3" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getDocs(
      query(
        collection(db, 'blogs'),
        where('slug', '==', slug),
        where('isPublished', '==', true)
      )
    ).then(snap => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setPost({ id: d.id, ...d.data() } as BlogPost);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="h-3 bg-slate-100 rounded w-1/4" />
          <div className="h-60 bg-slate-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-5 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800 mb-2">Post not found</p>
          <Link to="/blog" className="text-sm text-blue-600 hover:underline">Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-100 sticky top-0 z-10 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/blog" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />All Posts
          </Link>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Tag className="w-3 h-3" />{post.category}
          </span>
          {post.publishedAt && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{post.title}</h1>

        {post.excerpt && <p className="text-lg text-slate-500 mb-6 leading-relaxed border-l-4 border-blue-200 pl-4">{post.excerpt}</p>}

        <div className="flex items-center gap-2 mb-8 pb-8 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{post.author}</p>
            <p className="text-xs text-slate-400">Sophyra AI</p>
          </div>
        </div>

        {post.coverImageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img src={post.coverImageUrl} alt={post.title} className="w-full object-cover max-h-80" />
          </div>
        )}

        <div className="prose prose-slate max-w-none">
          {post.content.split('\n').map((para, i) => para.trim() ? (
            <p key={i} className="mb-4 text-slate-700 leading-relaxed text-base">{para}</p>
          ) : <br key={i} />)}
        </div>
      </article>
    </div>
  );
}

export { BlogList, BlogPostDetail };
