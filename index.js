#!/usr/bin/env node

const argv = require('yargs').argv
const SpotifyWebApi = require('spotify-web-api-node')

const LIMIT = 100

async function getPlaylistItems(api, userId, playlistId, offset = 0) {
    const response = await api.getPlaylistTracks(
        userId,
        playlistId,
        {
            limit: LIMIT,
            offset,
        },
    )

    return response.body.items
}

function extractArtistsIdsFromTrack(track) {
    const ids = []
    const { artists } = track

    for (const { id } of artists) {
        ids.push(id)
    }

    return ids
}

async function getArtistsIds(api, userId, playlistId) {
    const artistsIds = []
    const playlist = await api.getPlaylist(userId, playlistId)
    const totalTracks = playlist.body.tracks.total

    for (let offset = 0; offset < totalTracks; offset += LIMIT) {
        const playlistItems = await getPlaylistItems(api, userId, playlistId, offset)

        for (const { track } of playlistItems) {
            artistsIds.push(...extractArtistsIdsFromTrack(track))
        }
    }

    return [
        ...new Set(artistsIds) // dedupe
    ]
}

async function followArtists(api, artistsIds) {
    let totalFollowed = 0

    for (const artistId of artistsIds) {
        try {
            // Chunking ids didn't work acutally, that's why 1by1
            await api.followArtists([artistId])
            console.log('Now following', artistId)
            totalFollowed += 1
        } catch (error) {
            console.error('Failed to follow', artistId)
            console.error(error)
        }
    }

    console.log('Followed', totalFollowed, 'out of', artistsIds.length, 'artists')
}

async function main() {
    const { accessToken, userId, playlistId } = argv
    const api = new SpotifyWebApi({ accessToken })
    const artistsIds = await getArtistsIds(api, userId, playlistId)
    console.log('Got', artistsIds.length, 'artists!')
    await followArtists(api, artistsIds)
}

main()
