'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type Tab = 'playlists' | 'requests'

interface Playlist {
  id: string
  weddingId: string
  name: string
  description: string | null
  spotifyUrl: string | null
  appleMusicUrl: string | null
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

export default function MusicPage() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('playlists')

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [requests, setRequests] = useState<SongRequest[]>([])

  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [playlistForm, setPlaylistForm] = useState({
    name: '',
    description: '',
    spotifyUrl: '',
    appleMusicUrl: '',
  })

  const [showSongDialog, setShowSongDialog] = useState(false)
  const [songForm, setSongForm] = useState({ title: '', artist: '', category: '' })

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
      /* silent */
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
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.playlists.get(playlistId, weddingId, token)
        setSongs(data.songs ?? [])
        setSelectedPlaylist(playlistId)
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken],
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
          },
          token,
        )
      }
      setShowPlaylistDialog(false)
      setEditingPlaylist(null)
      setPlaylistForm({ name: '', description: '', spotifyUrl: '', appleMusicUrl: '' })
      void loadData()
    } catch {
      /* silent */
    }
  }, [weddingId, getToken, editingPlaylist, playlistForm, loadData])

  const handleDeletePlaylist = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.delete(id, weddingId, token)
        if (selectedPlaylist === id) {
          setSelectedPlaylist(null)
          setSongs([])
        }
        void loadData()
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken, selectedPlaylist, loadData],
  )

  const handleAddSong = useCallback(async () => {
    if (!selectedPlaylist) return
    try {
      const token = await getToken()
      if (!token) return
      await api.playlists.addSong(
        {
          playlistId: selectedPlaylist,
          title: songForm.title,
          artist: songForm.artist,
          category: (songForm.category || undefined) as 'other' | undefined,
        },
        weddingId!,
        token,
      )
      setShowSongDialog(false)
      setSongForm({ title: '', artist: '', category: '' })
      void loadPlaylistSongs(selectedPlaylist)
    } catch {
      /* silent */
    }
  }, [selectedPlaylist, getToken, songForm, weddingId, loadPlaylistSongs])

  const handleDeleteSong = useCallback(
    async (songId: string) => {
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.deleteSong(songId, weddingId!, token)
        if (selectedPlaylist) void loadPlaylistSongs(selectedPlaylist)
      } catch {
        /* silent */
      }
    },
    [getToken, weddingId, selectedPlaylist, loadPlaylistSongs],
  )

  const handleApproveRequest = useCallback(
    async (id: string) => {
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.approveRequest(id, weddingId!, token)
        void loadData()
      } catch {
        /* silent */
      }
    },
    [getToken, weddingId, loadData],
  )

  const handleRejectRequest = useCallback(
    async (id: string) => {
      try {
        const token = await getToken()
        if (!token) return
        await api.playlists.deleteRequest(id, weddingId!, token)
        void loadData()
      } catch {
        /* silent */
      }
    },
    [getToken, weddingId, loadData],
  )

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
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Music</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your playlists and guest song requests.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'playlists' as Tab, label: 'Playlists' },
            { key: 'requests' as Tab, label: `Song Requests (${requests.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-wedding-600 text-wedding-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'playlists' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-gray-900">Playlists</h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPlaylist(null)
                    setPlaylistForm({ name: '', description: '', spotifyUrl: '', appleMusicUrl: '' })
                    setShowPlaylistDialog(true)
                  }}
                >
                  New
                </Button>
              </div>
              {playlists.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-gray-500">
                      Create your first playlist for the big day.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                playlists.map((pl) => (
                  <Card
                    key={pl.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${selectedPlaylist === pl.id ? 'ring-wedding-500 ring-2' : ''}`}
                    onClick={() => loadPlaylistSongs(pl.id)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{pl.name}</p>
                          {pl.description && (
                            <p className="mt-0.5 text-xs text-gray-500">{pl.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPlaylist(pl)
                              setPlaylistForm({
                                name: pl.name,
                                description: pl.description ?? '',
                                spotifyUrl: pl.spotifyUrl ?? '',
                                appleMusicUrl: pl.appleMusicUrl ?? '',
                              })
                              setShowPlaylistDialog(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePlaylist(pl.id)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="lg:col-span-2">
              {selectedPlaylist ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Songs</CardTitle>
                    <Button size="sm" onClick={() => setShowSongDialog(true)}>
                      Add Song
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {songs.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-500">
                        No songs yet. Add your first song.
                      </p>
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
                            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{song.title}</p>
                              <p className="text-xs text-gray-500">{song.artist}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {song.category && (
                                <Badge variant="outline" className="text-xs">
                                  {CATEGORY_LABELS[song.category] ?? song.category}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() => handleDeleteSong(song.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-sm text-gray-500">
                      Select a playlist to view and manage its songs.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-gray-500">No song requests from guests yet.</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {requests.map((req) => (
                  <motion.div key={req.id} variants={fadeInUp}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.title}{' '}
                            <span className="font-normal text-gray-500">by {req.artist}</span>
                          </p>
                          <p className="text-xs text-gray-400">Requested by {req.guestName}</p>
                          {req.notes && <p className="mt-1 text-xs text-gray-500">{req.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
                            {req.status}
                          </Badge>
                          {req.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveRequest(req.id)}>
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() => handleRejectRequest(req.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={showPlaylistDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlaylist(null)
            setPlaylistForm({ name: '', description: '', spotifyUrl: '', appleMusicUrl: '' })
          }
          setShowPlaylistDialog(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'New Playlist'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={playlistForm.name}
                onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                placeholder="e.g. Ceremony Music"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={playlistForm.description}
                onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Spotify URL</Label>
              <Input
                value={playlistForm.spotifyUrl}
                onChange={(e) => setPlaylistForm({ ...playlistForm, spotifyUrl: e.target.value })}
                placeholder="https://open.spotify.com/..."
              />
            </div>
            <div>
              <Label>Apple Music URL</Label>
              <Input
                value={playlistForm.appleMusicUrl}
                onChange={(e) =>
                  setPlaylistForm({ ...playlistForm, appleMusicUrl: e.target.value })
                }
                placeholder="https://music.apple.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlaylistDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlaylist} disabled={!playlistForm.name}>
              {editingPlaylist ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSongDialog} onOpenChange={setShowSongDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={songForm.title}
                onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                placeholder="Song name"
              />
            </div>
            <div>
              <Label>Artist</Label>
              <Input
                value={songForm.artist}
                onChange={(e) => setSongForm({ ...songForm, artist: e.target.value })}
                placeholder="Artist name"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={songForm.category}
                onChange={(e) => setSongForm({ ...songForm, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSongDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSong} disabled={!songForm.title || !songForm.artist}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
