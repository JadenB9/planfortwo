'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
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
import Image from 'next/image'
import { api } from '@/lib/api'
import { refreshBadges } from '@/hooks/use-notification-badges'
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
  Download,
  RefreshCw,
  Clock,
  Upload,
  Search,
} from 'lucide-react'
import { useTabParam } from '@/hooks/use-tab-param'

type Tab = 'playlists' | 'requests'
const VALID_MUSIC_TABS: Tab[] = ['playlists', 'requests']

interface Playlist {
  id: string
  weddingId: string
  name: string
  description: string | null
  spotifyUrl: string | null
  appleMusicUrl: string | null
  youtubeMusicUrl: string | null
  isAcceptedSongs: boolean
  createdAt: Date
}

interface Song {
  id: string
  title: string
  artist: string
  album: string | null
  albumArt: string | null
  durationMs: number | null
  spotifyTrackId: string | null
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
  other: 'bg-muted text-foreground',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function MusicPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <MusicPageInner />
    </Suspense>
  )
}

function MusicPageInner() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useTabParam<Tab>('tab', 'playlists', VALID_MUSIC_TABS)

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

  // Spotify state
  const [showSpotifyImport, setShowSpotifyImport] = useState<string | null>(null)
  const [spotifyImportUrl, setSpotifyImportUrl] = useState('')
  const [importingSpotify, setImportingSpotify] = useState(false)
  const [showSpotifySearch, setShowSpotifySearch] = useState<string | null>(null)
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('')
  const [spotifySearchResults, setSpotifySearchResults] = useState<
    Array<{
      spotifyTrackId: string
      title: string
      artist: string
      album: string
      albumArt: string | null
      durationMs: number
    }>
  >([])
  const [searchingSpotify, setSearchingSpotify] = useState(false)
  const [addingSearchResult, setAddingSearchResult] = useState<string | null>(null)
  const [refreshingSpotify, setRefreshingSpotify] = useState<string | null>(null)

  // Spotify OAuth state
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [spotifyDisplayName, setSpotifyDisplayName] = useState<string | null>(null)
  const [connectingSpotify, setConnectingSpotify] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState<string | null>(null)
  const [spotifyUserPlaylists, setSpotifyUserPlaylists] = useState<
    Array<{
      id: string
      name: string
      description: string | null
      trackCount: number
      imageUrl: string | null
      externalUrl: string
    }>
  >([])
  const [loadingSpotifyPlaylists, setLoadingSpotifyPlaylists] = useState(false)
  const [exportingToSpotify, setExportingToSpotify] = useState<string | null>(null)

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
        // Check Spotify connection status in parallel (non-critical)
        api.spotify
          .getStatus(token)
          .then((spotifyStatus) => {
            setSpotifyConnected(spotifyStatus.data.connected)
            setSpotifyDisplayName(spotifyStatus.data.spotifyDisplayName)
          })
          .catch(() => {
            // Spotify status check is non-critical
          }),
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

  const handleImportSpotify = useCallback(
    async (playlistId: string) => {
      if (!weddingId || !spotifyImportUrl.trim()) return
      setImportingSpotify(true)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.playlists.importSpotify(
          playlistId,
          weddingId,
          spotifyImportUrl.trim(),
          token,
        )
        toast.success(`Imported ${data.imported} songs from Spotify`)
        setSpotifyImportUrl('')
        setShowSpotifyImport(null)
        void loadPlaylistSongs(playlistId)
        void loadData()
      } catch {
        toast.error('Failed to import from Spotify. Check the URL and try again.')
      } finally {
        setImportingSpotify(false)
      }
    },
    [weddingId, getToken, spotifyImportUrl, loadPlaylistSongs, loadData],
  )

  const handleSpotifySearch = useCallback(async () => {
    if (!weddingId || !spotifySearchQuery.trim()) return
    setSearchingSpotify(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.playlists.searchSpotify(
        weddingId,
        spotifySearchQuery.trim(),
        token,
      )
      setSpotifySearchResults(data)
    } catch {
      toast.error('Failed to search Spotify')
    } finally {
      setSearchingSpotify(false)
    }
  }, [weddingId, getToken, spotifySearchQuery])

  const handleAddSearchResult = useCallback(
    async (
      playlistId: string,
      track: {
        spotifyTrackId: string
        title: string
        artist: string
        album: string
        albumArt: string | null
        durationMs: number
      },
    ) => {
      if (!weddingId) return
      setAddingSearchResult(track.spotifyTrackId)
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.addSpotifyTrack(
          playlistId,
          weddingId,
          `https://open.spotify.com/track/${track.spotifyTrackId}`,
          token,
        )
        toast.success(`Added "${track.title}" to playlist`)
        setSpotifySearchResults((prev) =>
          prev.filter((t) => t.spotifyTrackId !== track.spotifyTrackId),
        )
        void loadPlaylistSongs(playlistId)
      } catch {
        toast.error('Failed to add song')
      } finally {
        setAddingSearchResult(null)
      }
    },
    [weddingId, getToken, loadPlaylistSongs],
  )

  const handleRefreshSpotify = useCallback(
    async (playlistId: string) => {
      if (!weddingId) return
      setRefreshingSpotify(playlistId)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.playlists.refreshSpotify(playlistId, weddingId, token)
        toast.success(`Refreshed ${data.imported} songs from Spotify`)
        void loadPlaylistSongs(playlistId)
        void loadData()
      } catch {
        toast.error(
          'Failed to refresh from Spotify. The playlist may have been modified — try re-importing.',
        )
      } finally {
        setRefreshingSpotify(null)
      }
    },
    [weddingId, getToken, loadPlaylistSongs],
  )

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSpotifyEmbedUrl = (spotifyUrl: string) => {
    // Convert open.spotify.com/playlist/ID to open.spotify.com/embed/playlist/ID
    const match = spotifyUrl.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/)
    if (match)
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`
    return null
  }

  const handleDeleteSong = useCallback(
    async (songId: string, playlistId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.deleteSong(songId, weddingId, token)
        toast.success('Song removed')
        void loadPlaylistSongs(playlistId)
        // Reload requests too — removing from Accepted Songs resets request to pending
        void loadData()
      } catch {
        toast.error('Failed to remove song')
      }
    },
    [getToken, weddingId, loadPlaylistSongs, loadData],
  )

  const handleApproveRequest = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.approveRequest(id, weddingId, token)
        toast.success('Song request approved')
        refreshBadges()
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
        refreshBadges()
        void loadData()
      } catch {
        toast.error('Failed to reject request')
      }
    },
    [getToken, weddingId, loadData],
  )

  // ── Spotify OAuth handlers ──
  const handleConnectSpotify = useCallback(async () => {
    setConnectingSpotify(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.spotify.getAuthUrl(token)
      // Navigate to Spotify auth in same window (callback page redirects back)
      window.location.href = data.url
    } catch {
      toast.error('Failed to start Spotify connection')
      setConnectingSpotify(false)
    }
  }, [getToken])

  const handleDisconnectSpotify = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      await api.spotify.disconnect(token)
      setSpotifyConnected(false)
      setSpotifyDisplayName(null)
      toast.success('Spotify disconnected')
    } catch {
      toast.error('Failed to disconnect Spotify')
    }
  }, [getToken])

  const handleExportToSpotify = useCallback(
    async (playlistId: string) => {
      if (!spotifyConnected) {
        toast.info('Connect your Spotify account first to export songs.')
        void handleConnectSpotify()
        return
      }

      const songs = playlistSongs[playlistId] ?? []
      const trackIds = songs.map((s) => s.spotifyTrackId).filter((id): id is string => !!id)

      if (trackIds.length === 0) {
        toast.error('No songs with Spotify IDs to export')
        return
      }

      // Load user's Spotify playlists and show picker
      setShowExportDialog(playlistId)
      setLoadingSpotifyPlaylists(true)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.spotify.getUserPlaylists(token)
        setSpotifyUserPlaylists(data)
      } catch {
        toast.error('Failed to load your Spotify playlists')
        setShowExportDialog(null)
      } finally {
        setLoadingSpotifyPlaylists(false)
      }
    },
    [spotifyConnected, playlistSongs, getToken, handleConnectSpotify],
  )

  const handleAddToSpotifyPlaylist = useCallback(
    async (spotifyPlaylistId: string) => {
      if (!showExportDialog) return
      const songs = playlistSongs[showExportDialog] ?? []
      const trackIds = songs.map((s) => s.spotifyTrackId).filter((id): id is string => !!id)

      if (trackIds.length === 0) return

      setExportingToSpotify(spotifyPlaylistId)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.spotify.addToPlaylist(spotifyPlaylistId, trackIds, token)
        toast.success(`Added ${data.added} songs to Spotify playlist!`)
        setShowExportDialog(null)
      } catch {
        toast.error('Failed to add songs to Spotify playlist')
      } finally {
        setExportingToSpotify(null)
      }
    },
    [showExportDialog, playlistSongs, getToken],
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
            <h1 className="font-serif text-3xl font-bold text-foreground">Music</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your playlists and guest song requests.
            </p>
          </div>
        </div>
      </div>

      {/* Spotify connection banner */}
      <div className="mb-4">
        {spotifyConnected ? (
          <div className="flex items-center justify-between rounded-lg border border-[#1DB954]/20 bg-[#1DB954]/5 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1DB954]">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-medium text-foreground">Spotify Connected</span>
              {spotifyDisplayName && <span className="text-muted-foreground">as {spotifyDisplayName}</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-red-600"
              onClick={handleDisconnectSpotify}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <Music className="h-3.5 w-3.5 text-white" />
              </div>
              <span>Connect Spotify to export songs directly to your playlists</span>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-[#1DB954] text-xs hover:bg-[#1aa34a]"
              disabled={connectingSpotify}
              onClick={handleConnectSpotify}
            >
              {connectingSpotify ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Connect Spotify
            </Button>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
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
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
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
                <span className="ml-1 text-xs text-muted-foreground">({requests.length})</span>
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
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Your Playlists
                  {playlists.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
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
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        No Playlists Yet
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
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
                                      <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
                                        {pl.name}
                                        {pl.isAcceptedSongs && (
                                          <Badge className="bg-green-100 px-1.5 py-0 text-[10px] text-green-700">
                                            <Check className="mr-0.5 h-2.5 w-2.5" />
                                            Approved Songs
                                          </Badge>
                                        )}
                                      </h3>
                                      {pl.description && (
                                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                          {pl.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-4 flex shrink-0 items-center gap-2">
                                  {/* Song count badge */}
                                  <Badge variant="secondary" className="text-xs">
                                    {isExpanded ? songCount : '...'}{' '}
                                    {isExpanded && songCount === 1 ? 'song' : 'songs'}
                                  </Badge>

                                  {/* Streaming buttons */}
                                  {pl.spotifyUrl && /^https?:\/\//i.test(pl.spotifyUrl) && (
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
                                  {pl.appleMusicUrl && /^https?:\/\//i.test(pl.appleMusicUrl) && (
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
                                  {pl.youtubeMusicUrl &&
                                    /^https?:\/\//i.test(pl.youtubeMusicUrl) && (
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
                                    className="h-8 w-8 text-muted-foreground hover:text-muted-foreground"
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
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      void handleDeletePlaylist(pl.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>

                                  {/* Expand chevron */}
                                  <div className="text-muted-foreground">
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
                                  <div className="border-t border-border px-6 pb-4 pt-3">
                                    {/* Spotify embed player */}
                                    {pl.spotifyUrl && getSpotifyEmbedUrl(pl.spotifyUrl) && (
                                      <div className="mb-4">
                                        <iframe
                                          src={getSpotifyEmbedUrl(pl.spotifyUrl)!}
                                          width="100%"
                                          height="352"
                                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                          loading="lazy"
                                          sandbox="allow-scripts allow-same-origin allow-popups"
                                          className="rounded-xl"
                                          title="Spotify playlist"
                                        />
                                      </div>
                                    )}

                                    {/* Spotify action bar */}
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                      {pl.spotifyUrl && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 gap-1.5 border-[#1DB954]/30 text-xs text-[#1DB954] hover:bg-[#1DB954]/5"
                                          disabled={refreshingSpotify === pl.id}
                                          onClick={() => handleRefreshSpotify(pl.id)}
                                        >
                                          {refreshingSpotify === pl.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-3.5 w-3.5" />
                                          )}
                                          Refresh from Spotify
                                        </Button>
                                      )}
                                      {!pl.spotifyUrl && showSpotifyImport !== pl.id && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 gap-1.5 border-[#1DB954]/30 text-xs text-[#1DB954] hover:bg-[#1DB954]/5"
                                          onClick={() => {
                                            setShowSpotifyImport(pl.id)
                                            setSpotifyImportUrl('')
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          Import from Spotify
                                        </Button>
                                      )}
                                      {showSpotifySearch !== pl.id && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 gap-1.5 border-[#1DB954]/30 text-xs text-[#1DB954] hover:bg-[#1DB954]/5"
                                          onClick={() => {
                                            setShowSpotifySearch(pl.id)
                                            setSpotifySearchQuery('')
                                            setSpotifySearchResults([])
                                          }}
                                        >
                                          <Search className="h-3.5 w-3.5" />
                                          Search Spotify
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 border-[#1DB954]/30 text-xs text-[#1DB954] hover:bg-[#1DB954]/5"
                                        onClick={() => handleExportToSpotify(pl.id)}
                                      >
                                        <Upload className="h-3.5 w-3.5" />
                                        {spotifyConnected
                                          ? 'Export to Spotify'
                                          : 'Connect & Export to Spotify'}
                                      </Button>
                                    </div>

                                    {/* Import from Spotify form */}
                                    <AnimatePresence>
                                      {showSpotifyImport === pl.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="mb-3 overflow-hidden"
                                        >
                                          <div className="rounded-lg border border-[#1DB954]/20 bg-[#1DB954]/5 p-4">
                                            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                              <Download className="h-4 w-4 text-[#1DB954]" />
                                              Import from Spotify Playlist
                                            </h4>
                                            <p className="mb-3 text-xs text-muted-foreground">
                                              Paste a Spotify playlist URL to import all songs. This
                                              will replace any existing songs.
                                            </p>
                                            <div className="flex gap-2">
                                              <Input
                                                value={spotifyImportUrl}
                                                onChange={(e) =>
                                                  setSpotifyImportUrl(e.target.value)
                                                }
                                                placeholder="https://open.spotify.com/playlist/..."
                                                className="flex-1 bg-white"
                                              />
                                              <Button
                                                size="sm"
                                                className="bg-[#1DB954] hover:bg-[#1aa34a]"
                                                disabled={
                                                  !spotifyImportUrl.trim() || importingSpotify
                                                }
                                                onClick={() => handleImportSpotify(pl.id)}
                                              >
                                                {importingSpotify ? (
                                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                                )}
                                                Import
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowSpotifyImport(null)}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Spotify search */}
                                    <AnimatePresence>
                                      {showSpotifySearch === pl.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="mb-3 overflow-hidden"
                                        >
                                          <div className="rounded-lg border border-[#1DB954]/20 bg-[#1DB954]/5 p-4">
                                            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                              <Search className="h-4 w-4 text-[#1DB954]" />
                                              Search Spotify
                                            </h4>
                                            <div className="flex gap-2">
                                              <Input
                                                value={spotifySearchQuery}
                                                onChange={(e) =>
                                                  setSpotifySearchQuery(e.target.value)
                                                }
                                                placeholder="Search for a song..."
                                                className="flex-1 bg-white"
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') void handleSpotifySearch()
                                                }}
                                              />
                                              <Button
                                                size="sm"
                                                className="bg-[#1DB954] hover:bg-[#1aa34a]"
                                                disabled={
                                                  !spotifySearchQuery.trim() || searchingSpotify
                                                }
                                                onClick={() => handleSpotifySearch()}
                                              >
                                                {searchingSpotify ? (
                                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Search className="mr-1.5 h-3.5 w-3.5" />
                                                )}
                                                Search
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setShowSpotifySearch(null)
                                                  setSpotifySearchResults([])
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                            {spotifySearchResults.length > 0 && (
                                              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                                                {spotifySearchResults.map((track) => (
                                                  <div
                                                    key={track.spotifyTrackId}
                                                    className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 transition-colors hover:bg-muted"
                                                  >
                                                    {track.albumArt ? (
                                                      <Image
                                                        src={track.albumArt}
                                                        alt={track.album}
                                                        width={36}
                                                        height={36}
                                                        className="h-9 w-9 shrink-0 rounded object-cover"
                                                        unoptimized
                                                      />
                                                    ) : (
                                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                                        <Music className="h-4 w-4" />
                                                      </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                      <p className="truncate text-sm font-medium text-foreground">
                                                        {track.title}
                                                      </p>
                                                      <p className="truncate text-xs text-muted-foreground">
                                                        {track.artist} &middot; {track.album}
                                                      </p>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      className="h-7 shrink-0 bg-[#1DB954] px-2.5 text-xs hover:bg-[#1aa34a]"
                                                      disabled={
                                                        addingSearchResult === track.spotifyTrackId
                                                      }
                                                      onClick={() =>
                                                        handleAddSearchResult(pl.id, track)
                                                      }
                                                    >
                                                      {addingSearchResult ===
                                                      track.spotifyTrackId ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                      ) : (
                                                        <Plus className="h-3 w-3" />
                                                      )}
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Song list */}
                                    {isLoadingSongs ? (
                                      <div className="flex items-center justify-center py-8">
                                        <Loader2 className="text-wedding-500 h-5 w-5 animate-spin" />
                                        <span className="ml-2 text-sm text-muted-foreground">
                                          Loading songs...
                                        </span>
                                      </div>
                                    ) : songs.length === 0 ? (
                                      <div className="py-6 text-center">
                                        <Music2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          No songs yet. Add your first song below or import from
                                          Spotify.
                                        </p>
                                      </div>
                                    ) : (
                                      <motion.div
                                        className="space-y-1.5"
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                      >
                                        {songs.map((song, idx) => (
                                          <motion.div
                                            key={song.id}
                                            variants={fadeInUp}
                                            className="group flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 transition-colors hover:bg-muted"
                                          >
                                            {/* Track number or album art */}
                                            {song.albumArt ? (
                                              <Image
                                                src={song.albumArt}
                                                alt={song.album ?? song.title}
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 shrink-0 rounded object-cover"
                                                unoptimized
                                              />
                                            ) : (
                                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                                                {idx + 1}
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                  {song.title}
                                                </p>
                                                {song.spotifyTrackId && (
                                                  <a
                                                    href={`https://open.spotify.com/track/${song.spotifyTrackId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 text-[#1DB954] hover:text-[#1aa34a]"
                                                    title="Open in Spotify"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <ExternalLink className="h-3 w-3" />
                                                  </a>
                                                )}
                                              </div>
                                              <p className="truncate text-xs text-muted-foreground">
                                                {song.artist}
                                                {song.album && (
                                                  <span className="text-muted-foreground">
                                                    {' '}
                                                    &middot; {song.album}
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                            {song.durationMs && (
                                              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(song.durationMs)}
                                              </span>
                                            )}
                                            {song.category && song.category !== 'other' && (
                                              <span
                                                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[song.category] ?? 'bg-muted text-foreground'}`}
                                              >
                                                {CATEGORY_LABELS[song.category] ?? song.category}
                                              </span>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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
                                            <div className="rounded-lg border border-border bg-white p-4">
                                              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                                                <Plus className="h-4 w-4" />
                                                Add a Song Manually
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
                                                    className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-border focus:outline-none focus:ring-1 focus:ring-border"
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
                                              Add Song Manually
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
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Song Requests
                  {requests.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
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
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        No Song Requests
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
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
                                    <p className="truncate font-medium text-foreground">
                                      {req.title}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                      by {req.artist}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status] ?? 'bg-muted text-foreground'}`}
                                  >
                                    {req.status}
                                  </span>
                                </div>

                                {/* Guest name */}
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                  Requested by{' '}
                                  <span className="font-medium text-muted-foreground">{req.guestName}</span>
                                </p>

                                {/* Notes */}
                                {req.notes && (
                                  <p className="mt-1 text-xs italic text-muted-foreground">
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
                                {req.status === 'approved' && spotifyConnected && (
                                  <div className="mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1.5 border-[#1DB954]/30 text-xs text-[#1DB954] hover:bg-[#1DB954]/5"
                                      onClick={() => {
                                        const acceptedPlaylist = playlists.find(
                                          (p) => p.isAcceptedSongs,
                                        )
                                        if (acceptedPlaylist) {
                                          void handleExportToSpotify(acceptedPlaylist.id)
                                        } else {
                                          toast.info('No accepted songs playlist found')
                                        }
                                      }}
                                    >
                                      <Upload className="h-3.5 w-3.5" />
                                      Export Approved Songs to Spotify
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

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

      {/* Export to Spotify Dialog */}
      <Dialog
        open={!!showExportDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowExportDialog(null)
            setSpotifyUserPlaylists([])
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1DB954]">
                <Upload className="h-3.5 w-3.5 text-white" />
              </div>
              Export to Spotify
            </DialogTitle>
          </DialogHeader>
          <div>
            {loadingSpotifyPlaylists ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#1DB954]" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading your Spotify playlists...
                </span>
              </div>
            ) : spotifyUserPlaylists.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No Spotify playlists found.</p>
              </div>
            ) : (
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                <p className="mb-2 text-xs text-muted-foreground">
                  Select a Spotify playlist to add{' '}
                  {showExportDialog
                    ? (playlistSongs[showExportDialog] ?? []).filter((s) => s.spotifyTrackId).length
                    : 0}{' '}
                  songs to:
                </p>
                {spotifyUserPlaylists.map((sp) => (
                  <button
                    key={sp.id}
                    className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-[#1DB954]/20 hover:bg-[#1DB954]/5"
                    disabled={exportingToSpotify === sp.id}
                    onClick={() => handleAddToSpotifyPlaylist(sp.id)}
                  >
                    {sp.imageUrl ? (
                      <Image
                        src={sp.imageUrl}
                        alt={sp.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{sp.name}</p>
                      <p className="text-xs text-muted-foreground">{sp.trackCount} songs</p>
                    </div>
                    {exportingToSpotify === sp.id ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1DB954]" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
