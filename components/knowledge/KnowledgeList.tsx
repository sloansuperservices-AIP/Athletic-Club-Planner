'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Search, BookOpen, Eye, Plus, Bot, Send } from 'lucide-react'

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isPublished: boolean
  viewCount: number
  updatedAt: string
  author: { name: string | null }
}

interface KnowledgeListProps {
  articles: Article[]
  categories: string[]
  canEdit: boolean
}

export function KnowledgeList({ articles, categories, canEdit }: KnowledgeListProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [saving, setSaving] = useState(false)

  // AI Chat state
  const [showChat, setShowChat] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const filtered = articles.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'all' || a.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  async function createArticle() {
    if (!newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          isPublished: true,
        }),
      })
      if (res.ok) {
        setShowNewForm(false)
        setNewTitle('')
        setNewContent('')
        window.location.reload()
      }
    } finally {
      setSaving(false)
    }
  }

  async function askAI() {
    if (!chatQuery.trim()) return
    setChatLoading(true)
    setChatAnswer('')
    try {
      const res = await fetch('/api/knowledge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatQuery }),
      })
      const data = await res.json()
      setChatAnswer(data.answer ?? data.error ?? 'No answer.')
    } finally {
      setChatLoading(false)
    }
  }

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      rules: 'text-red-400 bg-red-500/10',
      logistics: 'text-blue-400 bg-blue-500/10',
      training: 'text-emerald-400 bg-emerald-500/10',
      recruiting: 'text-violet-400 bg-violet-500/10',
      faq: 'text-yellow-400 bg-yellow-500/10',
      general: 'text-slate-400 bg-slate-500/10',
    }
    return map[cat] ?? map.general
  }

  return (
    <div className="space-y-4">
      {/* Search + filters + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategory === cat
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowChat(!showChat)}
        >
          <Bot className="h-4 w-4 mr-1.5" />
          AI Chat
        </Button>
        {canEdit && (
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Article
          </Button>
        )}
      </div>

      {/* AI Chat panel */}
      {showChat && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-medium text-slate-200">
                Ask the AI anything about club policies
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAI()}
                placeholder="e.g. What is the hotel booking policy?"
              />
              <Button onClick={askAI} disabled={chatLoading || !chatQuery.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {chatLoading && (
              <div className="mt-3 text-sm text-slate-400 animate-pulse">
                Searching knowledge base…
              </div>
            )}
            {chatAnswer && (
              <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-slate-300">
                {chatAnswer}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Article grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <div>No articles found</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => setViewingArticle(article)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(article.category)}`}
                  >
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Eye className="h-3 w-3" />
                    {article.viewCount}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-200 mb-2 leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {article.content}
                </p>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article view dialog */}
      <Dialog open={!!viewingArticle} onOpenChange={(open) => !open && setViewingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingArticle?.title}</DialogTitle>
          </DialogHeader>
          {viewingArticle && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${categoryColor(viewingArticle.category)}`}
                >
                  {viewingArticle.category}
                </span>
                <span>by {viewingArticle.author.name}</span>
              </div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {viewingArticle.content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New article dialog */}
      {canEdit && (
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Article</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Article title"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
                >
                  {['general', 'rules', 'logistics', 'training', 'recruiting', 'faq'].map(
                    (c) => <option key={c} value={c}>{c}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Content</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your article content here…"
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancel</Button>
              <Button onClick={createArticle} disabled={saving || !newTitle || !newContent}>
                {saving ? 'Saving…' : 'Publish Article'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
