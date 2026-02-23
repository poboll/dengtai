package com.caiths.dengtai.ai.api;

import com.caiths.dengtai.ai.api.dto.AiChatRequest;
import com.caiths.dengtai.ai.service.GlobalAiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/**
 * 全局 AI 助手对话接口（SSE 流式输出）。
 * GET /api/v1/ai/chat/stream?question=...&topK=5
 */
@RestController
@RequestMapping("/api/v1/ai")
@Validated
@RequiredArgsConstructor
public class AiChatController {

    private final GlobalAiChatService aiChatService;

    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(
            @RequestParam String question,
            @RequestParam(defaultValue = "5") int topK
    ) {
        return aiChatService.streamAnswer(question, topK);
    }
}
