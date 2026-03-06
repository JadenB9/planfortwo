'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  springSmooth,
  fadeInUp,
  staggerContainer,
  staggerGrid,
  scaleIn,
  cardHover,
} from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Music,
  Music2,
  ListMusic,
  Disc3,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
} from 'lucide-react'

type Tab = 'playlists' | 'requests'

interface Playlist {
  id: string
  weddingId: string
  name: string
  description: string | null
  spotifyUrl: string | null
  appleMusicUrl: string | null
  youtubeMusicUrl: string | null
  createdAt: Date
}

interface Song {
  id: string
  title: string
  artist: string
  category: string | null
  sortOrder: number
}

interface SongRequest {
  id: string
  guestName: string
  title: string
  artist: string
  notes: string | null
  status: string
  createdAt: Date
}

const CATEGORY_LABELS: Record<string, string> = {
  first_dance: 'First Dance',
  parent_dance: 'Parent Dance',
  cake_cutting: 'Cake Cutting',
  bouquet_toss: 'Bouquet Toss',
  last_dance: 'Last Dance',
  ceremony: 'Ceremony',
  cocktail_hour: 'Cocktail Hour',
  reception: 'Reception',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  first_dance: 'bg-pink-100 text-pink-700',
  parent_dance: 'bg-purple-100 text-purple-700',
  cake_cutting: 'bg-amber-100 text-amber-700',
  bouquet_toss: 'bg-rose-100 text-rose-700',
  last_dance: 'bg-indigo-100 text-indigo-700',
  ceremony: 'bg-blue-100 text-blue-700',
  cocktail_hour: 'bg-teal-100 text-teal-700',
  reception: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function MusicPage() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('playlists')

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null)
  const [playlistSongs, setPlaylistSongs] = useState<Record<string, Song[]>>({})
  const [loadingSongs, setLoadingSongs] = useState<string | null>(null)
  const [requests, setRequests] = useState<SongRequest[]>([])

  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [playlistForm, setPlaylistForm] = useState({
    name: '',
    description: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeMusicUrl: '',
  })

  const [showAddSong, setShowAddSong] = useState<string | null>(null)
  const [songForm, setSongForm] = useState({ title: '', artist: '', category: '' })
  const [addingSong, setAddingSong] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const wId = dashData.wedding.id
      setWeddingId(wId)

      const [playlistRes, requestsRes] = await Promise.all([
        api.playlists.list(wId, token),
        api.playlists.listRequests(wId, token),
      ])
      setPlaylists(playlistRes.data)
      setRequests(requestsRes.data)
    } catch {
      toast.error('Failed to load music data')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const loadPlaylistSongs = useCallback(
    async (playlistId: string) => {
      if (!weddingId) return
      setLoadingSongs(playlistId)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.playlists.get(playlistId, weddingId, token)
        setPlaylistSongs((prev) => ({ ...prev, [playlistId]: data.songs ?? [] }))
      } catch {
        toast.error('Failed to load playlist songs')
      } finally {
        setLoadingSongs(null)
      }
    },
    [weddingId, getToken],
  )

  const togglePlaylist = useCallback(
    async (playlistId: string) => {
      if (expandedPlaylist === playlistId) {
        setExpandedPlaylist(null)
        setShowAddSong(null)
        return
      }
      setExpandedPlaylist(playlistId)
      setShowAddSong(null)
      if (!playlistSongs[playlistId]) {
        await loadPlaylistSongs(playlistId)
      }
    },
    [expandedPlaylist, playlistSongs, loadPlaylistSongs],
  )

  const handleSavePlaylist = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingPlaylist) {
        await api.playlists.update(
          editingPlaylist.id,
          weddingId,
          {
            name: playlistForm.name,
            description: playlistForm.description || null,
            spotifyUrl: playlistForm.spotifyUrl || null,
            appleMusicUrl: playlistForm.appleMusicUrl || null,
            youtubeMusicUrl: playlistForm.youtubeMusicUrl || null,
          },
          token,
        )
      } else {
        await api.playlists.create(
          {
            weddingId,
            name: playlistForm.name,
            description: playlistForm.description || null,
            spotifyUrl: playlistForm.spotifyUrl || null,
            appleMusicUrl: playlistForm.appleMusicUrl || null,
            youtubeMusicUrl: playlistForm.youtubeMusicUrl || null,
          },
          token,
        )
      }
      toast.success(editingPlaylist ? 'Playlist updated' : 'Playlist created')
      setShowPlaylistDialog(false)
      setEditingPlaylist(null)
      setPlaylistForm({
        name: '',
        description: '',
        spotifyUrl: '',
        appleMusicUrl: '',
        youtubeMusicUrl: '',
      })
      void loadData()
    } catch {
      toast.error('Failed to save playlist')
    }
  }, [weddingId, getToken, editingPlaylist, playlistForm, loadData])

  const handleDeletePlaylist = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.delete(id, weddingId, token)
        toast.success('Playlist deleted')
        if (expandedPlaylist === id) {
          setExpandedPlaylist(null)
          setShowAddSong(null)
        }
        setPlaylistSongs((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        void loadData()
      } catch {
        toast.error('Failed to delete playlist')
      }
    },
    [weddingId, getToken, expandedPlaylist, loadData],
  )

  const handleAddSong = useCallback(
    async (playlistId: string) => {
      if (!weddingId) return
      setAddingSong(true)
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.addSong(
          {
            playlistId,
            title: songForm.title,
            artist: songForm.artist,
            category: (songForm.category || undefined) as 'other' | undefined,
          },
          weddingId,
          token,
        )
        toast.success('Song added')
        setSongForm({ title: '', artist: '', category: '' })
        setShowAddSong(null)
        void loadPlaylistSongs(playlistId)
      } catch {
        toast.error('Failed to add song')
      } finally {
        setAddingSong(false)
      }
    },
    [weddingId, getToken, songForm, loadPlaylistSongs],
  )

  const handleDeleteSong = useCallback(
    async (songId: string, playlistId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.deleteSong(songId, weddingId, token)
        toast.success('Song removed')
        void loadPlaylistSongs(playlistId)
      } catch {
        toast.error('Failed to remove song')
      }
    },
    [getToken, weddingId, loadPlaylistSongs],
  )

  const handleApproveRequest = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.approveRequest(id, weddingId, token)
        toast.success('Song request approved')
        void loadData()
      } catch {
        toast.error('Failed to approve request')
      }
    },
    [getToken, weddingId, loadData],
  )

  const handleRejectRequest = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.deleteRequest(id, weddingId, token)
        toast.success('Song request rejected')
        void loadData()
      } catch {
        toast.error('Failed to reject request')
      }
    },
    [getToken, weddingId, loadData],
  )

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-wedding-100 flex h-10 w-10 items-center justify-center rounded-xl">
            <Disc3 className="text-wedding-600 h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Music</h1>
            <p className="mt-0.5 text-sm text-gray-600">
              Manage your playlists and guest song requests.
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(
            [
              { key: 'playlists' as Tab, label: 'Playlists', icon: Music },
              { key: 'requests' as Tab, label: 'Song Requests', icon: ListMusic },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-wedding-600 text-wedding-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === 'requests' && pendingCount > 0 && (
                <span className="bg-wedding-600 ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
                  {pendingCount}
                </span>
              )}
              {tab.key === 'requests' && pendingCount === 0 && (
                <span className="ml-1 text-xs text-gray-400">({requests.length})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'playlists' && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Create playlist button */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-gray-900">
                  Your Playlists
                  {playlists.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({playlists.length})
                    </span>
                  )}
                </h2>
                <Button
                  onClick={() => {
                    setEditingPlaylist(null)
                    setPlaylistForm({
                      name: '',
                      description: '',
                      spotifyUrl: '',
                      appleMusicUrl: '',
                      youtubeMusicUrl: '',
                    })
                    setShowPlaylistDialog(true)
                  }}
                  className="bg-wedding-600 hover:bg-wedding-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Playlist
                </Button>
              </div>

              {playlists.length === 0 ? (
                <motion.div variants={scaleIn} initial="hidden" animate="visible">
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="bg-wedding-50 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                        <Music2 className="text-wedding-400 h-7 w-7" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-gray-900">
                        No Playlists Yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Create your first playlist for the big day.
                      </p>
                      <Button
                        className="bg-wedding-600 hover:bg-wedding-700 mt-4"
                        onClick={() => {
                          setEditingPlaylist(null)
                          setPlaylistForm({
                            name: '',
                            description: '',
                            spotifyUrl: '',
                            appleMusicUrl: '',
                            youtubeMusicUrl: '',
                          })
                          setShowPlaylistDialog(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Playlist
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={staggerGrid}
                  initial="hidden"
                  animate="visible"
                >
                  {playlists.map((pl) => {
                    const isExpanded = expandedPlaylist === pl.id
                    const songs = playlistSongs[pl.id] ?? []
                    const songCount = songs.length
                    const isLoadingSongs = loadingSongs === pl.id

                    return (
                      <motion.div key={pl.id} variants={fadeInUp}>
                        <motion.div
                          variants={cardHover}
                          initial="idle"
                          whileHover="hover"
                          transition={springSmooth}
                        >
                          <Card className="overflow-hidden">
                            {/* Gradient accent bar */}
                            <div className="from-wedding-50 h-1.5 bg-gradient-to-r to-purple-50" />

                            {/* Playlist card header */}
                            <div
                              className="cursor-pointer px-6 py-4"
                              onClick={() => togglePlaylist(pl.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-wedding-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                      <Music className="text-wedding-600 h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-serif text-base font-semibold text-gray-900">
                                        {pl.name}
                                      </h3>
                                      {pl.description && (
                                        <p className="mt-0.5 truncate text-sm text-gray-500">
                                          {pl.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-4 flex shrink-0 items-center gap-2">
                                  {/* Song count badge */}
                                  {isExpanded && (
                                    <Badge variant="secondary" className="text-xs">
                                      {songCount} {songCount === 1 ? 'song' : 'songs'}
                                    </Badge>
                                  )}

                                  {/* Streaming buttons */}
                                  {pl.spotifyUrl && (
                                    <a
                                      href={pl.spotifyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1DB954] text-white transition-opacity hover:opacity-80"
                                      title="Open in Spotify"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {pl.appleMusicUrl && (
                                    <a
                                      href={pl.appleMusicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FC3C44] text-white transition-opacity hover:opacity-80"
                                      title="Open in Apple Music"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {pl.youtubeMusicUrl && (
                                    <a
                                      href={pl.youtubeMusicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF0000] text-white transition-opacity hover:opacity-80"
                                      title="Open in YouTube Music"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}

                                  {/* Edit / Delete */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingPlaylist(pl)
                                      setPlaylistForm({
                                        name: pl.name,
                                        description: pl.description ?? '',
                                        spotifyUrl: pl.spotifyUrl ?? '',
                                        appleMusicUrl: pl.appleMusicUrl ?? '',
                                        youtubeMusicUrl: pl.youtubeMusicUrl ?? '',
                                      })
                                      setShowPlaylistDialog(true)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      void handleDeletePlaylist(pl.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>

                                  {/* Expand chevron */}
                                  <div className="text-gray-400">
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded song list */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-gray-100 px-6 pb-4 pt-3">
                                    {isLoadingSongs ? (
                                      <div className="flex items-center justify-center py-8">
                                        <Loader2 className="text-wedding-500 h-5 w-5 animate-spin" />
                                        <span className="ml-2 text-sm text-gray-500">
                                          Loading songs...
                                        </span>
                                      </div>
                                    ) : songs.length === 0 ? (
                                      <div className="py-6 text-center">
                                        <Music2 className="mx-auto h-8 w-8 text-gray-300" />
                                        <p className="mt-2 text-sm text-gray-500">
                                          No songs yet. Add your first song below.
                                        </p>
                                      </div>
                                    ) : (
                                      <motion.div
                                        className="space-y-2"
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        {songs.map((song) => (
                                          <motion.div
                                            key={song.id}
                                            variants={fadeInUp}
                                            className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5 transition-colors hover:bg-gray-50"
                                          >
                                            <Music2 className="h-4 w-4 shrink-0 text-gray-400" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium text-gray-900">
                                                {song.title}
                                              </p>
                                              <p className="text-xs text-gray-500">{song.artist}</p>
                                            </div>
                                            {song.category && (
                                              <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[song.category] ?? 'bg-gray-100 text-gray-700'}`}
                                              >
                                                {CATEGORY_LABELS[song.category] ?? song.category}
                                              </span>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 shrink-0 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                                              onClick={() => handleDeleteSong(song.id, pl.id)}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </motion.div>
                                        ))}
                                      </motion.div>
                                    )}

                                    {/* Inline Add Song form */}
                                    <div className="mt-3">
                                      <AnimatePresence>
                                        {showAddSong === pl.id ? (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Plus className="h-4 w-4" />
                                                Add a Song
                                              </h4>
                                              <div className="grid gap-3 sm:grid-cols-3">
                                                <div>
                                                  <Label className="text-xs">Title</Label>
                                                  <Input
                                                    value={songForm.title}
                                                    onChange={(e) =>
                                                      setSongForm({
                                                        ...songForm,
                                                        title: e.target.value,
                                                      })
                                                    }
                                                    placeholder="Song name"
                                                    className="mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-xs">Artist</Label>
                                                  <Input
                                                    value={songForm.artist}
                                                    onChange={(e) =>
                                                      setSongForm({
                                                        ...songForm,
                                                        artist: e.target.value,
                                                      })
                                                    }
                                                    placeholder="Artist name"
                                                    className="mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-xs">Category</Label>
                                                  <select
                                                    value={songForm.category}
                                                    onChange={(e) =>
                                                      setSongForm({
                                                        ...songForm,
                                                        category: e.target.value,
                                                      })
                                                    }
                                                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                                  >
                                                    <option value="">None</option>
                                                    {Object.entries(CATEGORY_LABELS).map(
                                                      ([val, label]) => (
                                                        <option key={val} value={val}>
                                                          {label}
                                                        </option>
                                                      ),
                                                    )}
                                                  </select>
                                                </div>
                                              </div>
                                              <div className="mt-3 flex items-center justify-end gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    setShowAddSong(null)
                                                    setSongForm({
                                                      title: '',
                                                      artist: '',
                                                      category: '',
                                                    })
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="bg-wedding-600 hover:bg-wedding-700"
                                                  disabled={
                                                    !songForm.title ||
                                                    !songForm.artist ||
                                                    addingSong
                                                  }
                                                  onClick={() => handleAddSong(pl.id)}
                                                >
                                                  {addingSong ? (
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                  ) : (
                                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                                  )}
                                                  Add Song
                                                </Button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                          >
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full border-dashed"
                                              onClick={() => {
                                                setSongForm({
                                                  title: '',
                                                  artist: '',
                                                  category: '',
                                                })
                                                setShowAddSong(pl.id)
                                              }}
                                            >
                                              <Plus className="mr-2 h-3.5 w-3.5" />
                                              Add Song
                                            </Button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="font-serif text-lg font-semibold text-gray-900">
                  Song Requests
                  {requests.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({requests.length})
                    </span>
                  )}
                </h2>
              </div>

              {requests.length === 0 ? (
                <motion.div variants={scaleIn} initial="hidden" animate="visible">
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="bg-wedding-50 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                        <ListMusic className="text-wedding-400 h-7 w-7" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-gray-900">
                        No Song Requests
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Guest requests will appear here once they submit them.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  className="grid gap-4 sm:grid-cols-2"
                  variants={staggerGrid}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {requests.map((req) => (
                      <motion.div
                        key={req.id}
                        variants={fadeInUp}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        layout
                      >
                        <Card className="overflow-hidden transition-shadow hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Guest avatar */}
                              <div className="bg-wedding-100 text-wedding-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                {req.guestName.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0 flex-1">
                                {/* Song info */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-900">
                                      {req.title}
                                    </p>
                                    <p className="truncate text-sm text-gray-500">
                                      by {req.artist}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status] ?? 'bg-gray-100 text-gray-700'}`}
                                  >
                                    {req.status}
                                  </span>
                                </div>

                                {/* Guest name */}
                                <p className="mt-1.5 text-xs text-gray-400">
                                  Requested by{' '}
                                  <span className="font-medium text-gray-600">{req.guestName}</span>
                                </p>

                                {/* Notes */}
                                {req.notes && (
                                  <p className="mt-1 text-xs italic text-gray-500">
                                    &ldquo;{req.notes}&rdquo;
                                  </p>
                                )}

                                {/* Action buttons */}
                                {req.status === 'pending' && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="h-8 bg-green-600 text-xs hover:bg-green-700"
                                      onClick={() => handleApproveRequest(req.id)}
                                    >
                                      <Check className="mr-1.5 h-3.5 w-3.5" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => handleRejectRequest(req.id)}
                                    >
                                      <X className="mr-1.5 h-3.5 w-3.5" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playlist Create/Edit Dialog */}
      <Dialog
        open={showPlaylistDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlaylist(null)
            setPlaylistForm({
              name: '',
              description: '',
              spotifyUrl: '',
              appleMusicUrl: '',
              youtubeMusicUrl: '',
            })
          }
          setShowPlaylistDialog(open)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingPlaylist ? 'Edit Playlist' : 'New Playlist'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={playlistForm.name}
                onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                placeholder="e.g. Ceremony Music"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={playlistForm.description}
                onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                rows={2}
                placeholder="Optional notes about this playlist"
                className="mt-1"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Streaming Links
              </p>
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#1DB954] text-[10px] font-bold text-white">
                    S
                  </span>
                  Spotify URL
                </Label>
                <Input
                  value={playlistForm.spotifyUrl}
                  onChange={(e) => setPlaylistForm({ ...playlistForm, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#FC3C44] text-[10px] font-bold text-white">
                    A
                  </span>
                  Apple Music URL
                </Label>
                <Input
                  value={playlistForm.appleMusicUrl}
                  onChange={(e) =>
                    setPlaylistForm({ ...playlistForm, appleMusicUrl: e.target.value })
                  }
                  placeholder="https://music.apple.com/..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#FF0000] text-[10px] font-bold text-white">
                    Y
                  </span>
                  YouTube Music URL
                </Label>
                <Input
                  value={playlistForm.youtubeMusicUrl}
                  onChange={(e) =>
                    setPlaylistForm({ ...playlistForm, youtubeMusicUrl: e.target.value })
                  }
                  placeholder="https://music.youtube.com/..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlaylistDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePlaylist}
              disabled={!playlistForm.name}
              className="bg-wedding-600 hover:bg-wedding-700"
            >
              {editingPlaylist ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
