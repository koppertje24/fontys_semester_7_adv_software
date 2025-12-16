package com.example.model;

import java.util.List;

public class SearchResponse {
    private long totalHits;
    private List<Object> results;

    public SearchResponse(long totalHits, List<Object> results) {
        this.totalHits = totalHits;
        this.results = results;
    }

    public long getTotalHits() {
        return totalHits;
    }

    public void setTotalHits(long totalHits) {
        this.totalHits = totalHits;
    }

    public List<Object> getResults() {
        return results;
    }

    public void setResults(List<Object> results) {
        this.results = results;
    }
}