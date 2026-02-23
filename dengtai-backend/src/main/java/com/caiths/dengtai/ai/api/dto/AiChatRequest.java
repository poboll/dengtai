package com.caiths.dengtai.ai.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiChatRequest(
        @NotBlank @Size(max = 2000) String question,
        String sessionId,
        int topK
) {
    public AiChatRequest {
        if (topK <= 0 || topK > 20) topK = 5;
    }
}
