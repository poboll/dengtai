package com.caiths.dengtai.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.deepseek.DeepSeekChatOptions;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 全局 AI 对话服务：
 * - 在整个向量库范围内语义检索相关知文切片
 * - 将检索结果作为上下文注入 DeepSeek，流式返回回答
 * - 当向量检索不可用时（如 embedding 服务异常），自动降级为纯对话模式
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalAiChatService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    private static final String SYSTEM_PROMPT = """
            你是灯塔知识平台的 AI 助手，专注于帮助用户解答技术与知识问题。
            - 优先参考提供的知识库上下文来作答，并在回复末尾推荐相关文章（如有）。
            - 回答使用简洁的 Markdown 格式，适当使用标题、列表和代码块。
            - 如果上下文中没有相关内容，直接依据你的知识回答，不要编造内容。
            - 语气专业但友好，中文回复。
            """;

    public Flux<String> streamAnswer(String question, int topK) {
        List<Document> docs = safeSearch(question, topK);
        String context = buildContext(docs);
        String userMessage = buildUserMessage(question, context);

        return chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .user(userMessage)
                .options(DeepSeekChatOptions.builder()
                        .model("deepseek-chat")
                        .temperature(0.3)
                        .maxTokens(2048)
                        .build())
                .stream()
                .content();
    }

    private List<Document> safeSearch(String question, int topK) {
        try {
            return vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(question)
                            .topK(Math.max(1, topK))
                            .similarityThreshold(0.5)
                            .build()
            );
        } catch (Exception e) {
            log.warn("向量检索失败，降级为纯对话模式: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String buildContext(List<Document> docs) {
        if (docs.isEmpty()) return "";
        return docs.stream()
                .filter(d -> d.getText() != null && !d.getText().isBlank())
                .map(d -> {
                    Object postId = d.getMetadata().get("postId");
                    Object title = d.getMetadata().get("title");
                    String header = (title != null ? "【" + title + "】" : "") +
                            (postId != null ? "（文章ID:" + postId + "）" : "");
                    return header + "\n" + d.getText();
                })
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    private String buildUserMessage(String question, String context) {
        if (context.isBlank()) {
            return "问题：" + question;
        }
        return "问题：" + question + "\n\n以下是知识库中检索到的相关内容，请参考：\n\n" + context;
    }
}
