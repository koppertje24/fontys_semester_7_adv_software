package com.example.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    @Autowired
    private ElasticsearchClient client;

    public com.example.model.SearchResponse search(String index, String query) throws IOException {
        SearchResponse<Object> response = client.search(s -> s
            .index(index)
            .query(q -> q
                .bool(b -> b
                    .should(sh -> sh
                        .match(m -> m
                            .field("name")
                            .query(query)
                        )
                    )
                    .should(sh -> sh
                        .match(m -> m
                            .field("description")
                            .query(query)
                        )
                    )
                )
            ),
            Object.class
        );

        List<Object> results = response.hits().hits().stream()
            .map(Hit::source)
            .collect(Collectors.toList());

        long totalHits = response.hits().total().value();

        return new com.example.model.SearchResponse(totalHits, results);
    }
}