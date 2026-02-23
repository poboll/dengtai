package com.caiths.dengtai.storage.api;

import com.caiths.dengtai.common.exception.BusinessException;
import com.caiths.dengtai.common.exception.ErrorCode;
import com.caiths.dengtai.auth.token.JwtService;
import com.caiths.dengtai.knowpost.mapper.KnowPostMapper;
import com.caiths.dengtai.knowpost.model.KnowPost;
import com.caiths.dengtai.storage.OssStorageService;
import com.caiths.dengtai.storage.api.dto.StoragePresignRequest;
import com.caiths.dengtai.storage.api.dto.StoragePresignResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/storage")
@Validated
@RequiredArgsConstructor
public class StorageController {

    private static final String QINIU_UPLOAD_URL = "https://up-as0.qiniup.com";
    private static final int PRESIGN_EXPIRES_SECONDS = 600;

    private final OssStorageService ossStorageService;
    private final JwtService jwtService;
    private final KnowPostMapper knowPostMapper;

    @PostMapping("/presign")
    public StoragePresignResponse presign(@Valid @RequestBody StoragePresignRequest request,
                                          @AuthenticationPrincipal Jwt jwt) {
        long userId = jwtService.extractUserId(jwt);

        long postId;
        try {
            postId = Long.parseLong(request.postId());
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "postId 非法");
        }

        KnowPost post = knowPostMapper.findById(postId);
        if (post == null || post.getCreatorId() == null || post.getCreatorId() != userId) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "草稿不存在或无权限");
        }

        String scene = request.scene();
        String ext = normalizeExt(request.ext(), request.contentType(), scene);
        String objectKey;

        if ("knowpost_content".equals(scene)) {
            objectKey = "posts/" + postId + "/content" + ext;
        } else if ("knowpost_image".equals(scene)) {
            String date = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneId.of("UTC")).format(Instant.now());
            String rand = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            objectKey = "posts/" + postId + "/images/" + date + "/" + rand + ext;
        } else {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的上传场景");
        }

        String token = ossStorageService.generateUploadToken(objectKey, PRESIGN_EXPIRES_SECONDS);
        return new StoragePresignResponse(objectKey, token, QINIU_UPLOAD_URL, PRESIGN_EXPIRES_SECONDS);
    }

    private String normalizeExt(String ext, String contentType, String scene) {
        if (ext != null && !ext.isBlank()) {
            return ext.startsWith(".") ? ext : "." + ext;
        }
        if ("knowpost_content".equals(scene)) {
            return switch (contentType) {
                case "text/markdown" -> ".md";
                case "text/html" -> ".html";
                case "text/plain" -> ".txt";
                case "application/json" -> ".json";
                default -> ".bin";
            };
        } else {
            return switch (contentType) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> ".img";
            };
        }
    }
}
