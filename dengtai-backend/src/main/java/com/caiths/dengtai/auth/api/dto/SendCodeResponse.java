package com.caiths.dengtai.auth.api.dto;

import com.caiths.dengtai.auth.verification.VerificationScene;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SendCodeResponse(
        String identifier,
        VerificationScene scene,
        int expireSeconds,
        String devCode
) {
}
