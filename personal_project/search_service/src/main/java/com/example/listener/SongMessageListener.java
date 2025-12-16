package com.example.listener;

import com.example.model.Song;
import com.example.model.SongUpdate;
import com.example.service.SongService;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SongMessageListener {

    @Autowired
    private SongService songService;

    @RabbitListener(queues = "${rabbitmq.queue.song.create}")
    public void handleSongCreate(Song song) {
        try {
            String songId = songService.createSong(song);
            System.out.println("Created song with ID: " + songId);
            System.out.println("Song details - Name: " + song.getName() +
                             ", Status: " + song.getStatus() +
                             ", Artist: " + song.getArtist() + 
                             ", Album: " + song.getAlbum());
        } catch (Exception e) {
            System.err.println("Error creating song: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @RabbitListener(queues = "${rabbitmq.queue.song.update}")
    public void handleSongUpdate(SongUpdate updateMessage) {
        try {
            songService.updateSong(updateMessage);
            System.out.println("Updated song ID: " + updateMessage.getId() + 
                             " with status: " + updateMessage.getStatus());
        } catch (Exception e) {
            System.err.println("Error updating song: " + e.getMessage());
            e.printStackTrace();
        }
    }
}