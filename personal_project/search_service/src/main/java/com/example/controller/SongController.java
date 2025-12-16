package com.example.controller;

import com.example.model.Song;
import com.example.service.SongService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private SongService songService;

    @Value("${rabbitmq.exchange}")
    private String exchange;

    @Value("${rabbitmq.routing.key.create}")
    private String createRoutingKey;

    @Value("${rabbitmq.routing.key.update}")
    private String updateRoutingKey;

    @PostMapping
    public ResponseEntity<String> createSong(@RequestBody Song song) {
        try {
            rabbitTemplate.convertAndSend(exchange, createRoutingKey, song);
            return ResponseEntity.ok("Song creation message sent to queue");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error sending message: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/filepath")
    public ResponseEntity<String> updateSongFilePath(
            @PathVariable String id,
            @RequestBody Song updateMessage) {
        try {
            updateMessage.setId(id);
            rabbitTemplate.convertAndSend(exchange, updateRoutingKey, updateMessage);
            return ResponseEntity.ok("Song update message sent to queue");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error sending message: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSong(@PathVariable String id) {
        try {
            Song song = songService.getSong(id);
            if (song != null) {
                return ResponseEntity.ok(song);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}