package com.caiths.dengtai.llm;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * LLM 基础设施配置。
 * <p>
 * 通过 {@link RestClientCustomizer} 将全局 RestClient 的底层 HTTP 实现
 * 替换为 JDK 内置 HttpClient，解决 Apache HttpClient 5 在流式（SSE）场景下
 * 回退到 HTTP/1.0 导致 "Chunked transfer encoding not allowed" 异常。
 */
@Configuration
public class LlmConfig {

    @Bean
    public ChatClient chatClient(@Qualifier("deepSeekChatModel") ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    /**
     * 全局 RestClient 定制器：强制使用 JDK HttpClient（支持 HTTP/1.1 + HTTP/2），
     * 替代 Apache HttpClient 5 的默认行为。
     */
    @Bean
    public RestClientCustomizer jdkHttpClientCustomizer() {
        HttpClient jdkClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(jdkClient);
        factory.setReadTimeout(Duration.ofSeconds(120));
        return builder -> builder.requestFactory(factory);
    }
}
