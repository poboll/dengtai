package com.caiths.dengtai.storage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "oss")
public class OssProperties {
    private String accessKey;
    private String secretKey;
    private String bucket;
    private String domain;
    private String folder = "dengtai";
}
