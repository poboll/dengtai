package com.caiths.dengtai.storage.api.dto;

public record StoragePresignResponse(
        String objectKey,
        String uploadToken,
        String uploadUrl,
        int expiresIn
) {}
