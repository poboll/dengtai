package com.caiths.dengtai.llm.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.deepseek.DeepSeekChatOptions;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagQueryService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final RagIndexService indexService;

    public Flux<String> streamAnswerFlux(long postId, String question, int topK, int maxTokens) {
        safeEnsureIndexed(postId);

        List<String> contexts = safeSearchContexts(String.valueOf(postId), question, Math.max(1, topK));
        String context = String.join("\n\n---\n\n", contexts);

        String system = "你是中文知识助手。只能依据提供的知文上下文回答；无法确定的请说明不确定。";
        String user = context.isEmpty()
                ? "问题：" + question + "\n\n（知识库暂无相关上下文，请基于你的知识回答）"
                : "问题：" + question + "\n\n上下文如下（可能不完整）：\n" + context + "\n\n请基于以上上下文作答。";

        return chatClient
                .prompt()
                .system(system)
                .user(user)
                .options(DeepSeekChatOptions.builder()
                        .model("deepseek-chat")
                        .temperature(0.2)
                        .maxTokens(maxTokens)
                        .build())
                .stream()
                .content();
    }

    private void safeEnsureIndexed(long postId) {
        try {
            indexService.ensureIndexed(postId);
        } catch (Exception e) {
            log.warn("索引保障失败(postId={})，跳过: {}", postId, e.getMessage());
        }
    }

    private List<String> safeSearchContexts(String postId, String query, int topK) {
        try {
            return searchContexts(postId, query, topK);
        } catch (Exception e) {
            log.warn("向量检索失败(postId={})，降级为无上下文模式: {}", postId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> searchContexts(String postId, String query, int topK) {
        int fetchK = Math.max(topK * 3, 20);
        List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder().query(query).topK(fetchK).build()
        );
        List<String> out = new ArrayList<>(topK);
        for (Document d : docs) {
            Object pid = d.getMetadata().get("postId");
            if (pid != null && postId.equals(String.valueOf(pid))) {
                String txt = d.getText();
                if (txt != null && !txt.isEmpty()) {
                    out.add(txt);
                    if (out.size() >= topK) break;
                }
            }
        }
        return out;
    }
}
