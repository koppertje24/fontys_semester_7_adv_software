package com.example.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.elasticsearch.core.UpdateResponse;
import com.example.model.Song;
import com.example.model.SongUpdate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class SongService {

    private static final String SONGS_INDEX = "songs";

    @Autowired
    private ElasticsearchClient client;

    public String createSong(Song song) throws IOException {
        song.setCreatedAt(System.currentTimeMillis());
        
        IndexResponse response = client.index(i -> i
            .index(SONGS_INDEX)
            .id(song.getId())
            .document(song)
        );

        return response.id();
    }

    public Song getSong(String id) throws IOException {
        GetResponse<Song> response = client.get(g -> g
            .index(SONGS_INDEX)
            .id(id),
            Song.class
        );

        if (response.found()) {
            Song song = response.source();
            song.setId(response.id());
            return song;
        }
        return null;
    }

    public void updateSong(SongUpdate updateMessage) throws IOException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", updateMessage.getStatus());
        updates.put("updated_at", System.currentTimeMillis());

        UpdateResponse<Song> response = client.update(u -> u
            .index(SONGS_INDEX)
            .id(updateMessage.getId())
            .doc(updates),
            Song.class
        );

        System.out.println("Updated song: " + updateMessage.getId() + 
                         " with status: " + updateMessage.getStatus());
    }
}